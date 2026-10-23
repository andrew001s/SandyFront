'use client';

import { type VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { type GLTF, GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export interface VrmViewerOptions {
	canvas: HTMLCanvasElement;
	transparent?: boolean;
}

export interface VrmCameraTransform {
	position: { x: number; y: number; z: number };
	target: { x: number; y: number; z: number };
	zoom?: number;
}

export type VrmCameraPreset = 'face' | 'upperBody' | 'fullBody';

export class VrmViewer {
	private scene: THREE.Scene;
	private camera: THREE.PerspectiveCamera;
	private renderer: THREE.WebGLRenderer;
	private controls: OrbitControls;
	private clock: THREE.Clock;

	private currentVrm: VRM | null = null;
	private animationFrameId: number | null = null;
	private isDisposed = false;

	// Micro-animación de respiración y parpadeo natural
	private nextBlinkTime = 0;
	private blinkDuration = 0.18;
	private isBlinking = false;
	private blinkStartTime = 0;

	private activeEmotion = 'neutral';
	private activeEmotionIntensity = 0;

	// Callbacks de estado
	private onModelLoadedCallbacks = new Set<(vrm: VRM) => void>();
	private onFpsCallbacks = new Set<(fps: number) => void>();
	private frameCount = 0;
	private lastFpsUpdateTime = 0;

	constructor({ canvas, transparent = true }: VrmViewerOptions) {
		this.scene = new THREE.Scene();

		// Cámara
		this.camera = new THREE.PerspectiveCamera(
			30,
			canvas.clientWidth / (canvas.clientHeight || 1),
			0.1,
			20.0,
		);
		this.camera.position.set(0, 1.35, 1.2);

		// Renderizador WebGL
		this.renderer = new THREE.WebGLRenderer({
			canvas,
			alpha: transparent,
			antialias: true,
			powerPreference: 'high-performance',
		});
		this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.outputColorSpace = THREE.SRGBColorSpace;

		// Iluminación de estudio optimizada para modelos VRM estilo anime
		const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
		this.scene.add(ambientLight);

		const mainLight = new THREE.DirectionalLight(0xffffff, 1.6);
		mainLight.position.set(1.0, 1.5, 1.5).normalize();
		this.scene.add(mainLight);

		const fillLight = new THREE.DirectionalLight(0xffe6f0, 0.8);
		fillLight.position.set(-1.0, 1.0, -1.0).normalize();
		this.scene.add(fillLight);

		// Controles de cámara
		this.controls = new OrbitControls(this.camera, canvas);
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.05;
		this.controls.target.set(0, 1.25, 0);
		this.controls.minDistance = 0.4;
		this.controls.maxDistance = 3.5;
		this.controls.update();

		this.clock = new THREE.Clock();
		this.scheduleNextBlink();
		this.animate();
	}

	public onModelLoaded(callback: (vrm: VRM) => void): () => void {
		this.onModelLoadedCallbacks.add(callback);
		if (this.currentVrm) callback(this.currentVrm);
		return () => this.onModelLoadedCallbacks.delete(callback);
	}

	public onFpsUpdate(callback: (fps: number) => void): () => void {
		this.onFpsCallbacks.add(callback);
		return () => this.onFpsCallbacks.delete(callback);
	}

	public resize(width: number, height: number): void {
		if (this.isDisposed || height === 0) return;
		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(width, height, false);
	}

	public setCameraPreset(preset: VrmCameraPreset): void {
		if (!this.currentVrm) return;
		const head = this.currentVrm.humanoid?.getNormalizedBoneNode('head');
		let headHeight = 1.35;
		if (head) {
			const headPos = new THREE.Vector3();
			head.getWorldPosition(headPos);
			if (headPos.y > 0.5) headHeight = headPos.y;
		}

		switch (preset) {
			case 'face':
				this.controls.target.set(0, headHeight, 0);
				this.camera.position.set(0, headHeight, 0.65);
				break;
			case 'upperBody':
				this.controls.target.set(0, headHeight * 0.85, 0);
				this.camera.position.set(0, headHeight * 0.9, 1.25);
				break;
			case 'fullBody':
				this.controls.target.set(0, headHeight * 0.55, 0);
				this.camera.position.set(0, headHeight * 0.65, 2.3);
				break;
		}
		this.controls.update();
	}

	public getCameraTransform(): VrmCameraTransform {
		return {
			position: {
				x: Number(this.camera.position.x.toFixed(4)),
				y: Number(this.camera.position.y.toFixed(4)),
				z: Number(this.camera.position.z.toFixed(4)),
			},
			target: {
				x: Number(this.controls.target.x.toFixed(4)),
				y: Number(this.controls.target.y.toFixed(4)),
				z: Number(this.controls.target.z.toFixed(4)),
			},
			zoom: this.camera.zoom,
		};
	}

	public setCameraTransform(t: VrmCameraTransform): void {
		this.camera.position.set(t.position.x, t.position.y, t.position.z);
		this.controls.target.set(t.target.x, t.target.y, t.target.z);
		if (t.zoom && Math.abs(t.zoom - this.camera.zoom) > 0.001) {
			this.camera.zoom = t.zoom;
			this.camera.updateProjectionMatrix();
		}
		this.controls.update();
	}

	public onCameraChange(callback: (transform: VrmCameraTransform) => void): () => void {
		let rafId: number | null = null;
		const listener = () => {
			if (rafId !== null) return;
			rafId = requestAnimationFrame(() => {
				rafId = null;
				callback(this.getCameraTransform());
			});
		};
		this.controls.addEventListener('change', listener);
		return () => {
			if (rafId !== null) cancelAnimationFrame(rafId);
			this.controls.removeEventListener('change', listener);
		};
	}

	/**
	 * Carga un modelo VRM desde una URL o un Blob (archivo local arrastrado por el usuario).
	 */
	public async loadModel(source: string | ArrayBuffer): Promise<VRM> {
		const loader = new GLTFLoader();
		loader.register((parser) => new VRMLoaderPlugin(parser));

		return new Promise<VRM>((resolve, reject) => {
			const onLoad = (gltf: GLTF) => {
				const vrm: VRM = gltf.userData.vrm;
				if (!vrm) {
					reject(new Error('El archivo no contiene un modelo VRM válido.'));
					return;
				}

				// Limpiar modelo anterior
				if (this.currentVrm) {
					this.scene.remove(this.currentVrm.scene);
					VRMUtils.deepDispose(this.currentVrm.scene);
				}

				// Ajustes de orientación VRM (rotación T-pose hacia cámara)
				VRMUtils.rotateVRM0(vrm);
				this.currentVrm = vrm;
				this.scene.add(vrm.scene);

				// Aplicar inmediatamente la postura natural de descanso (eliminar Pose en T)
				this.updateIdlePose(0);
				vrm.update(0);

				// Centrar objetivo en la cabeza del modelo si está disponible
				const head = vrm.humanoid?.getNormalizedBoneNode('head');
				if (head) {
					const headPos = new THREE.Vector3();
					head.getWorldPosition(headPos);
					this.controls.target.copy(headPos);
					this.camera.position.set(headPos.x, headPos.y + 0.02, headPos.z + 0.7);
					this.controls.update();
				}

				for (const cb of this.onModelLoadedCallbacks) {
					cb(vrm);
				}

				resolve(vrm);
			};

			if (typeof source === 'string') {
				loader.load(source, onLoad, undefined, reject);
			} else {
				loader.parse(source, '', onLoad, reject);
			}
		});
	}

	/**
	 * Transmite fonemas acústicos de vocales a la boca del modelo en tiempo real a 60 FPS.
	 */
	public setVowels(vowels: { A?: number; I?: number; U?: number; E?: number; O?: number }): void {
		if (!this.currentVrm?.expressionManager) return;

		const mgr = this.currentVrm.expressionManager;

		// VRM 1.0 (aa, ih, ou, ee, oh) y VRM 0.x (A, I, U, E, O)
		const setVal = (name1: string, name0: string, val: number) => {
			const safeVal = Math.max(0, Math.min(1, val));
			try {
				mgr.setValue(name1, safeVal);
			} catch {
				try {
					mgr.setValue(name0, safeVal);
				} catch {
					// Ignorar si el modelo no tiene la expresión
				}
			}
		};

		setVal('aa', 'A', vowels.A ?? 0);
		setVal('ih', 'I', vowels.I ?? 0);
		setVal('ou', 'U', vowels.U ?? 0);
		setVal('ee', 'E', vowels.E ?? 0);
		setVal('oh', 'O', vowels.O ?? 0);
	}

	/**
	 * Activa una expresión facial (Alegría, Enojo, Tristeza, Sorpresa, etc.).
	 */
	public setExpression(name: string, intensity = 1.0): void {
		if (!this.currentVrm?.expressionManager) return;
		const mgr = this.currentVrm.expressionManager;

		this.activeEmotion = name;
		this.activeEmotionIntensity = intensity;

		// Limpiar expresiones previas excepto neutro
		const expressions = ['happy', 'joy', 'angry', 'sad', 'sorrow', 'surprised', 'relaxed', 'fun'];
		for (const expr of expressions) {
			try {
				mgr.setValue(expr, 0);
			} catch {
				// Ignorar
			}
		}

		if (name === 'neutral') return;

		const mappedName =
			name === 'joy' ? 'happy' : name === 'sorrow' ? 'sad' : name === 'fun' ? 'relaxed' : name;

		try {
			mgr.setValue(mappedName, Math.max(0, Math.min(1, intensity)));
		} catch {
			try {
				mgr.setValue(name, Math.max(0, Math.min(1, intensity)));
			} catch {
				// Ignorar si el modelo no tiene el blendshape
			}
		}
	}

	public resetExpressions(): void {
		this.setExpression('neutral', 0);
	}

	private scheduleNextBlink(): void {
		// Parpadeo natural cada 2.5 a 5 segundos
		const delay = 2.5 + Math.random() * 2.5;
		this.nextBlinkTime = this.clock.getElapsedTime() + delay;
	}

	private updateBlink(elapsed: number): void {
		if (!this.currentVrm?.expressionManager) return;
		const mgr = this.currentVrm.expressionManager;

		if (!this.isBlinking && elapsed >= this.nextBlinkTime) {
			this.isBlinking = true;
			this.blinkStartTime = elapsed;
		}

		if (this.isBlinking) {
			const progress = (elapsed - this.blinkStartTime) / this.blinkDuration;
			if (progress >= 1.0) {
				this.isBlinking = false;
				try {
					mgr.setValue('blink', 0);
				} catch {
					// Ignorar si el modelo no soporta parpadeo
				}
				this.scheduleNextBlink();
			} else {
				// Curva suave senoidal para cierre y apertura de párpados
				const blinkVal = Math.sin(progress * Math.PI);
				try {
					mgr.setValue('blink', blinkVal);
				} catch {
					// Ignorar si el modelo no soporta parpadeo
				}
			}
		}
	}

	/**
	 * Aplica una postura de reposo natural continua (eliminando la pose en T rígida)
	 * con respiración orgánica, micro-balanceo y relajación anatómica de brazos y hombros.
	 */
	private updateIdlePose(elapsed: number): void {
		if (!this.currentVrm?.humanoid) return;

		// Ciclos senoidales suaves para respiración (~3.2s) y micro-balanceo (~6.5s)
		const breathCycle = Math.sin(elapsed * 1.95) * 0.025;
		const swayCycle = Math.sin(elapsed * 0.95) * 0.015;

		const humanoid = this.currentVrm.humanoid;
		const spine = humanoid.getNormalizedBoneNode('spine');
		const chest = humanoid.getNormalizedBoneNode('chest');
		const neck = humanoid.getNormalizedBoneNode('neck');
		const head = humanoid.getNormalizedBoneNode('head');

		const leftUpperArm = humanoid.getNormalizedBoneNode('leftUpperArm');
		const rightUpperArm = humanoid.getNormalizedBoneNode('rightUpperArm');
		const leftLowerArm = humanoid.getNormalizedBoneNode('leftLowerArm');
		const rightLowerArm = humanoid.getNormalizedBoneNode('rightLowerArm');
		const leftHand = humanoid.getNormalizedBoneNode('leftHand');
		const rightHand = humanoid.getNormalizedBoneNode('rightHand');

		// Columna, pecho y cabeza con respiración y micro-balanceo orgánico
		if (spine) {
			spine.rotation.x = breathCycle * 0.35;
			spine.rotation.y = swayCycle * 0.3;
		}
		if (chest) {
			chest.rotation.x = breathCycle * 0.55;
			chest.rotation.z = swayCycle * 0.25;
		}
		if (neck) {
			neck.rotation.x = -breathCycle * 0.15;
		}
		if (head) {
			head.rotation.x = -breathCycle * 0.2;
			head.rotation.y = -swayCycle * 0.4;
		}

		// Brazos relajados hacia abajo a los lados del torso (postura natural de descanso)
		// En el espacio normalizado de Three-VRM:
		// +Z baja el brazo izquierdo y -Z baja el brazo derecho hacia el costado del cuerpo.
		if (leftUpperArm) {
			leftUpperArm.rotation.z = 1.35 - breathCycle * 0.04;
			leftUpperArm.rotation.x = 0.05;
			leftUpperArm.rotation.y = 0.02;
		}
		if (rightUpperArm) {
			rightUpperArm.rotation.z = -1.35 + breathCycle * 0.04;
			rightUpperArm.rotation.x = 0.05;
			rightUpperArm.rotation.y = -0.02;
		}

		// Antebrazos con orientación anatómica relajada
		if (leftLowerArm) {
			leftLowerArm.rotation.z = 0.05;
			leftLowerArm.rotation.y = 0.15;
			leftLowerArm.rotation.x = 0.05;
		}
		if (rightLowerArm) {
			rightLowerArm.rotation.z = -0.05;
			rightLowerArm.rotation.y = -0.15;
			rightLowerArm.rotation.x = 0.05;
		}

		// Muñecas y manos relajadas
		if (leftHand) {
			leftHand.rotation.x = 0.02;
		}
		if (rightHand) {
			rightHand.rotation.x = 0.02;
		}
	}

	private animate = (): void => {
		if (this.isDisposed) return;

		this.animationFrameId = requestAnimationFrame(this.animate);
		const delta = this.clock.getDelta();
		const elapsed = this.clock.getElapsedTime();

		this.controls.update();

		if (this.currentVrm) {
			this.updateBlink(elapsed);
			this.updateIdlePose(elapsed);
			this.currentVrm.update(delta);
		}

		this.renderer.render(this.scene, this.camera);

		// Cálculo de FPS
		this.frameCount += 1;
		if (elapsed - this.lastFpsUpdateTime >= 1.0) {
			const fps = Math.round(this.frameCount / (elapsed - this.lastFpsUpdateTime));
			for (const cb of this.onFpsCallbacks) {
				cb(fps);
			}
			this.frameCount = 0;
			this.lastFpsUpdateTime = elapsed;
		}
	};

	public dispose(): void {
		this.isDisposed = true;
		if (this.animationFrameId !== null) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}

		if (this.currentVrm) {
			this.scene.remove(this.currentVrm.scene);
			VRMUtils.deepDispose(this.currentVrm.scene);
			this.currentVrm = null;
		}

		this.controls.dispose();
		this.renderer.dispose();
		this.onModelLoadedCallbacks.clear();
		this.onFpsCallbacks.clear();
	}
}
