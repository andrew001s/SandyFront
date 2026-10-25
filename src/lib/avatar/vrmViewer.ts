'use client';

import { type VRM, type VRMHumanBoneName, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { type GLTF, GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';
import {
	DEFAULT_VRM_IDLE_SETTINGS,
	VRM_IDLE_BONES,
	VRM_RELAXED_ARM_POSE,
	type VrmIdleBoneName,
	type VrmIdleRotation,
	type VrmIdleSettings,
	normalizeVrmIdleSettings,
	sampleVrmIdlePose,
} from './vrmIdle';
import { DEFAULT_VRM_SLIME_COLOR, type VrmDropObjectKind } from './vrmTriggerGraph';

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
	private idleSettings: VrmIdleSettings = { ...DEFAULT_VRM_IDLE_SETTINGS };
	private idleRestRotations = new Map<VrmIdleBoneName, THREE.Quaternion>();
	private idleBlendWeight = 1;
	private idleBlendStartWeight = 1;
	private idleBlendTargetWeight = 1;
	private idleBlendStartTime = 0;
	private idleBlendDuration = DEFAULT_VRM_IDLE_SETTINGS.smoothSeconds;
	private idleEuler = new THREE.Euler();
	private idleDeltaQuaternion = new THREE.Quaternion();
	private idleTargetQuaternion = new THREE.Quaternion();

	// Micro-animación de respiración y parpadeo natural
	private nextBlinkTime = 0;
	private blinkDuration = 0.18;
	private isBlinking = false;
	private blinkStartTime = 0;

	private activeEmotion = 'neutral';
	private activeEmotionIntensity = 0;
	private spawnedObjects: Array<{
		mesh: THREE.Group;
		velocity: THREE.Vector3;
		spin: THREE.Vector3;
		hitBones: Set<VRMHumanBoneName>;
		restitution: number;
		mass: number;
		drag: number;
		collisionRadius: number;
		floorY: number;
		expiresAt: number;
	}> = [];
	private slimeActive = false;
	private slimeColor = DEFAULT_VRM_SLIME_COLOR;
	private slimeMesh: MarchingCubes | null = null;
	private slimeStartedAt = 0;
	private slimeLastSimulationTime = 0;
	private slimeLastMeshUpdate = 0;
	private slimeSimulationAccumulator = 0;
	private slimeEmissionTime = 0;
	private slimeDrops: Array<{
		position: THREE.Vector3;
		velocity: THREE.Vector3;
		acceleration: THREE.Vector3;
		radius: number;
		age: number;
	}> = [];
	private boneHitReactions = new Map<
		VRMHumanBoneName,
		{ startedAt: number; strength: number; axis: THREE.Vector3 }
	>();

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

	public getIdleSettings(): VrmIdleSettings {
		return { ...this.idleSettings };
	}

	public setIdleSettings(settings: Partial<VrmIdleSettings>): void {
		const next = normalizeVrmIdleSettings(settings, this.idleSettings);
		if (next.enabled !== this.idleSettings.enabled) {
			const elapsed = this.clock.getElapsedTime();
			this.idleBlendWeight = this.getIdleBlendWeight(elapsed);
			this.idleBlendStartWeight = this.idleBlendWeight;
			this.idleBlendTargetWeight = next.enabled ? 1 : 0;
			this.idleBlendStartTime = elapsed;
			this.idleBlendDuration = next.smoothSeconds;
		}
		this.idleSettings = next;
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
					this.clearSlimeMesh();
					this.scene.remove(this.currentVrm.scene);
					VRMUtils.deepDispose(this.currentVrm.scene);
				}

				// Ajustes de orientación VRM (rotación T-pose hacia cámara)
				VRMUtils.rotateVRM0(vrm);
				this.currentVrm = vrm;
				this.scene.add(vrm.scene);
				if (this.slimeActive) this.setSlimeActive(true);
				this.captureIdleRestPose();

				// Aplicar inmediatamente la postura natural de descanso (eliminar Pose en T)
				this.updateIdlePose(this.clock.getElapsedTime());
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
	 * Obtiene los nombres de todas las expresiones declaradas en el modelo VRM actual.
	 */
	public getAvailableExpressions(): string[] {
		if (!this.currentVrm?.expressionManager) return [];
		return this.currentVrm.expressionManager.expressions.map((e) => e.expressionName);
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

	public spawnDropObject(kind: VrmDropObjectKind = 'random'): void {
		if (this.spawnedObjects.length >= 16) {
			const oldest = this.spawnedObjects.shift();
			if (oldest) this.disposeSpawnedObject(oldest.mesh);
		}
		const selectedKind =
			kind === 'random'
				? (['ball', 'rubber_duck', 'sneaker', 'apple', 'donut', 'heart', 'star'] as const)[
						Math.floor(Math.random() * 7)
					]
				: kind;
		const mesh = this.createDropObject(selectedKind);
		const humanoid = this.currentVrm?.humanoid;
		const head = humanoid?.getNormalizedBoneNode('head');
		const chest =
			humanoid?.getNormalizedBoneNode('chest') ??
			humanoid?.getNormalizedBoneNode('spine') ??
			humanoid?.getNormalizedBoneNode('hips');
		const target = new THREE.Vector3(0, 1.15, 0);
		const launch = new THREE.Vector3(0, 1.8, 0.65);
		if (this.currentVrm) this.currentVrm.scene.updateMatrixWorld(true);
		chest?.getWorldPosition(target);
		head?.getWorldPosition(launch);
		launch.x += (Math.random() - 0.5) * 0.85;
		launch.y += 0.22 + Math.random() * 0.38;
		launch.z += 0.45 + Math.random() * 0.3;
		mesh.position.copy(launch);
		this.scene.add(mesh);
		const velocity = target
			.sub(launch)
			.normalize()
			.multiplyScalar(3.4 + Math.random() * 1.2);
		this.spawnedObjects.push({
			mesh,
			velocity,
			spin: new THREE.Vector3(
				2.5 + Math.random() * 3,
				1 + Math.random() * 2,
				2 + Math.random() * 3,
			),
			hitBones: new Set(),
			restitution:
				selectedKind === 'ball'
					? 0.76
					: selectedKind === 'rubber_duck' || selectedKind === 'donut'
						? 0.48
						: 0.22,
			mass:
				selectedKind === 'sneaker'
					? 0.8
					: selectedKind === 'rubber_duck' || selectedKind === 'heart' || selectedKind === 'star'
						? 0.38
						: 0.52,
			drag: selectedKind === 'ball' ? 0.12 : 0.3,
			collisionRadius: selectedKind === 'sneaker' ? 0.2 : selectedKind === 'apple' ? 0.13 : 0.16,
			floorY: selectedKind === 'sneaker' ? 0.1 : 0.13,
			expiresAt: this.clock.getElapsedTime() + 8,
		});
	}

	private createDropObject(kind: Exclude<VrmDropObjectKind, 'random'>): THREE.Group {
		const object = new THREE.Group();
		if (kind === 'ball') {
			const base = new THREE.MeshPhysicalMaterial({
				color: new THREE.Color().setHSL(Math.random(), 0.78, 0.56),
				roughness: 0.28,
				clearcoat: 0.55,
			});
			const white = new THREE.MeshStandardMaterial({ color: 0xf4f0e8, roughness: 0.42 });
			object.add(new THREE.Mesh(new THREE.SphereGeometry(0.14, 28, 20), base));
			const band = new THREE.Mesh(new THREE.TorusGeometry(0.122, 0.008, 8, 40), white);
			band.rotation.x = Math.PI / 2;
			object.add(band);
			const seam = new THREE.Mesh(new THREE.TorusGeometry(0.122, 0.006, 8, 40), white);
			seam.rotation.y = Math.PI / 2;
			object.add(seam);
		} else if (kind === 'rubber_duck') {
			const yellow = new THREE.MeshPhysicalMaterial({
				color: 0xffd43b,
				roughness: 0.24,
				clearcoat: 0.8,
			});
			const orange = new THREE.MeshStandardMaterial({ color: 0xef741f, roughness: 0.36 });
			const black = new THREE.MeshStandardMaterial({ color: 0x201b27, roughness: 0.3 });
			const body = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), yellow);
			body.scale.set(0.14, 0.115, 0.19);
			body.position.y = 0.04;
			object.add(body);
			const head = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 16), yellow);
			head.position.set(0.055, 0.16, 0);
			object.add(head);
			const beak = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.09, 10), orange);
			beak.rotation.z = -Math.PI / 2;
			beak.position.set(0.14, 0.145, 0);
			object.add(beak);
			for (const side of [-1, 1]) {
				const eye = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), black);
				eye.position.set(0.09, 0.19, side * 0.052);
				object.add(eye);
				const wing = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), yellow);
				wing.scale.set(0.065, 0.05, 0.035);
				wing.position.set(-0.01, 0.055, side * 0.15);
				object.add(wing);
			}
		} else if (kind === 'sneaker') {
			const upper = new THREE.MeshPhysicalMaterial({
				color: 0x4b4f7d,
				roughness: 0.48,
				clearcoat: 0.2,
			});
			const soleMaterial = new THREE.MeshStandardMaterial({ color: 0xf1eef1, roughness: 0.72 });
			const laceMaterial = new THREE.MeshStandardMaterial({ color: 0xe7e4ec, roughness: 0.55 });
			const soleShape = new THREE.Shape();
			soleShape.moveTo(-0.18, -0.055);
			soleShape.quadraticCurveTo(-0.19, -0.09, -0.14, -0.1);
			soleShape.lineTo(0.16, -0.1);
			soleShape.quadraticCurveTo(0.22, -0.08, 0.21, -0.035);
			soleShape.lineTo(-0.18, -0.055);
			const sole = new THREE.Mesh(
				new THREE.ExtrudeGeometry(soleShape, {
					depth: 0.12,
					bevelEnabled: true,
					bevelSegments: 2,
					bevelSize: 0.01,
					bevelThickness: 0.01,
				}),
				soleMaterial,
			);
			sole.position.z = -0.06;
			object.add(sole);
			const upperShape = new THREE.Shape();
			upperShape.moveTo(-0.16, -0.045);
			upperShape.quadraticCurveTo(-0.08, 0.015, -0.045, 0.11);
			upperShape.quadraticCurveTo(0.01, 0.16, 0.055, 0.115);
			upperShape.lineTo(0.1, 0.055);
			upperShape.quadraticCurveTo(0.17, 0.045, 0.2, 0.015);
			upperShape.quadraticCurveTo(0.22, -0.02, 0.16, -0.045);
			upperShape.closePath();
			const shoeBody = new THREE.Mesh(
				new THREE.ExtrudeGeometry(upperShape, {
					depth: 0.1,
					bevelEnabled: true,
					bevelSegments: 3,
					bevelSize: 0.018,
					bevelThickness: 0.014,
				}),
				upper,
			);
			shoeBody.position.z = -0.05;
			object.add(shoeBody);
			for (let i = 0; i < 3; i += 1) {
				const lace = new THREE.Mesh(
					new THREE.CylinderGeometry(0.004, 0.004, 0.07, 6),
					laceMaterial,
				);
				lace.position.set(-0.02 + i * 0.027, 0.075 - i * 0.008, 0.006);
				lace.rotation.z = -0.65;
				object.add(lace);
			}
		} else if (kind === 'apple') {
			const red = new THREE.MeshPhysicalMaterial({
				color: new THREE.Color().setHSL(0.96 + Math.random() * 0.05, 0.78, 0.48),
				roughness: 0.24,
				clearcoat: 0.68,
			});
			const green = new THREE.MeshStandardMaterial({ color: 0x548c37, roughness: 0.55 });
			const apple = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 16), red);
			apple.scale.set(1, 0.92, 0.95);
			object.add(apple);
			const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.012, 0.055, 7), green);
			stem.position.y = 0.15;
			stem.rotation.z = -0.16;
			object.add(stem);
		} else if (kind === 'donut') {
			const dough = new THREE.MeshStandardMaterial({ color: 0xc8834d, roughness: 0.62 });
			const icing = new THREE.MeshPhysicalMaterial({
				color: new THREE.Color().setHSL(Math.random(), 0.72, 0.64),
				roughness: 0.27,
				clearcoat: 0.5,
			});
			object.add(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.06, 14, 28), dough));
			const frosting = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.052, 12, 28), icing);
			frosting.scale.set(1, 0.82, 1);
			frosting.position.y = 0.018;
			object.add(frosting);
			const sprinkleColors = [0xffe066, 0xff6b6b, 0x7ec8e3, 0xffffff];
			for (let i = 0; i < 7; i += 1) {
				const angle = (i / 7) * Math.PI * 2;
				const sprinkle = new THREE.Mesh(
					new THREE.CylinderGeometry(0.005, 0.005, 0.035, 5),
					new THREE.MeshStandardMaterial({ color: sprinkleColors[i % sprinkleColors.length] }),
				);
				sprinkle.position.set(Math.cos(angle) * 0.12, 0.06, Math.sin(angle) * 0.12);
				sprinkle.rotation.z = Math.PI / 2 + angle;
				object.add(sprinkle);
			}
		} else if (kind === 'heart') {
			const heartShape = new THREE.Shape();
			heartShape.moveTo(0, -0.13);
			heartShape.bezierCurveTo(-0.26, 0.02, -0.18, 0.2, -0.07, 0.17);
			heartShape.bezierCurveTo(-0.02, 0.16, 0, 0.12, 0, 0.1);
			heartShape.bezierCurveTo(0.04, 0.2, 0.21, 0.2, 0.23, 0.07);
			heartShape.bezierCurveTo(0.25, -0.02, 0.12, -0.1, 0, -0.13);
			const heart = new THREE.Mesh(
				new THREE.ExtrudeGeometry(heartShape, {
					depth: 0.1,
					bevelEnabled: true,
					bevelSegments: 3,
					bevelSize: 0.025,
					bevelThickness: 0.025,
				}),
				new THREE.MeshPhysicalMaterial({ color: 0xf05b78, roughness: 0.32, clearcoat: 0.52 }),
			);
			heart.position.z = -0.05;
			object.add(heart);
		} else {
			const starShape = new THREE.Shape();
			for (let i = 0; i < 10; i += 1) {
				const radius = i % 2 === 0 ? 0.17 : 0.075;
				const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
				const x = Math.cos(angle) * radius;
				const y = Math.sin(angle) * radius;
				if (i === 0) starShape.moveTo(x, y);
				else starShape.lineTo(x, y);
			}
			starShape.closePath();
			const star = new THREE.Mesh(
				new THREE.ExtrudeGeometry(starShape, {
					depth: 0.1,
					bevelEnabled: true,
					bevelSegments: 2,
					bevelSize: 0.018,
					bevelThickness: 0.018,
				}),
				new THREE.MeshPhysicalMaterial({
					color: 0xffcf56,
					roughness: 0.28,
					metalness: 0.08,
					clearcoat: 0.6,
				}),
			);
			star.position.z = -0.05;
			object.add(star);
		}
		return object;
	}

	private disposeSpawnedObject(object: THREE.Group): void {
		this.scene.remove(object);
		object.traverse((child) => {
			if (!(child instanceof THREE.Mesh)) return;
			child.geometry.dispose();
			const materials = Array.isArray(child.material) ? child.material : [child.material];
			for (const material of materials) material.dispose();
		});
	}

	private resolveAvatarCollision(item: (typeof this.spawnedObjects)[number]): void {
		const humanoid = this.currentVrm?.humanoid;
		if (!humanoid) return;
		const colliders: Array<[VRMHumanBoneName, number]> = [
			['hips', 0.2],
			['spine', 0.2],
			['chest', 0.23],
			['head', 0.15],
			['leftUpperArm', 0.12],
			['rightUpperArm', 0.12],
			['leftUpperLeg', 0.14],
			['rightUpperLeg', 0.14],
		];
		const center = new THREE.Vector3();
		const normal = new THREE.Vector3();
		for (const [bone, radius] of colliders) {
			const node = humanoid.getNormalizedBoneNode(bone);
			if (!node) continue;
			node.getWorldPosition(center);
			normal.subVectors(item.mesh.position, center);
			const distance = normal.length();
			const minimumDistance = radius + item.collisionRadius;
			if (distance >= minimumDistance) {
				if (distance > minimumDistance + 0.12) item.hitBones.delete(bone);
				continue;
			}
			if (distance < 0.0001) normal.set(0, 1, 0);
			else normal.divideScalar(distance);
			item.mesh.position.addScaledVector(normal, minimumDistance - distance);
			const normalSpeed = item.velocity.dot(normal);
			if (normalSpeed < 0) {
				if (!item.hitBones.has(bone)) {
					item.hitBones.add(bone);
					this.triggerBoneHit(bone, normal, -normalSpeed);
				}
				item.velocity.addScaledVector(normal, -(1 + item.restitution) * normalSpeed);
			}
		}
	}

	private triggerBoneHit(bone: VRMHumanBoneName, normal: THREE.Vector3, speed: number): void {
		const axis = new THREE.Vector3(normal.z, normal.x * 0.3, -normal.x).normalize();
		this.boneHitReactions.set(bone, {
			startedAt: this.clock.getElapsedTime(),
			strength: THREE.MathUtils.clamp(speed * 0.045, 0.045, 0.24),
			axis,
		});
	}

	private updateBoneHitReactions(elapsed: number): void {
		const humanoid = this.currentVrm?.humanoid;
		if (!humanoid) return;
		for (const [bone, reaction] of this.boneHitReactions) {
			const age = elapsed - reaction.startedAt;
			if (age > 1.15) {
				this.boneHitReactions.delete(bone);
				continue;
			}
			const node = humanoid.getNormalizedBoneNode(bone);
			if (!node) continue;
			const angle = reaction.strength * Math.exp(-3.8 * age) * Math.sin(17 * age);
			node.quaternion.multiply(this.idleTargetQuaternion.setFromAxisAngle(reaction.axis, angle));
		}
	}

	private resolveObjectCollisions(): void {
		const delta = new THREE.Vector3();
		for (let i = 0; i < this.spawnedObjects.length; i += 1) {
			const first = this.spawnedObjects[i];
			for (let j = i + 1; j < this.spawnedObjects.length; j += 1) {
				const second = this.spawnedObjects[j];
				delta.subVectors(first.mesh.position, second.mesh.position);
				const distance = delta.length();
				const minimumDistance = first.collisionRadius + second.collisionRadius;
				if (distance >= minimumDistance) continue;
				if (distance < 0.0001) delta.set(1, 0, 0);
				else delta.divideScalar(distance);
				const inverseFirstMass = 1 / first.mass;
				const inverseSecondMass = 1 / second.mass;
				const inverseMassTotal = inverseFirstMass + inverseSecondMass;
				const overlap = minimumDistance - distance;
				first.mesh.position.addScaledVector(delta, (overlap * inverseFirstMass) / inverseMassTotal);
				second.mesh.position.addScaledVector(
					delta,
					(-overlap * inverseSecondMass) / inverseMassTotal,
				);
				const closingSpeed = first.velocity.clone().sub(second.velocity).dot(delta);
				if (closingSpeed >= 0) continue;
				const restitution = Math.min(first.restitution, second.restitution);
				const impulse = (-(1 + restitution) * closingSpeed) / inverseMassTotal;
				first.velocity.addScaledVector(delta, impulse * inverseFirstMass);
				second.velocity.addScaledVector(delta, -impulse * inverseSecondMass);
			}
		}
	}

	public setSlimeActive(active: boolean, color = this.slimeColor): void {
		this.setSlimeColor(color);
		if (!active) {
			this.slimeActive = false;
			this.slimeStartedAt = 0;
			this.clearSlimeMesh();
			return;
		}
		this.slimeActive = true;
		if (!this.currentVrm) return;
		if (this.slimeMesh) return;
		this.slimeStartedAt = this.clock.getElapsedTime();
		const material = new THREE.MeshPhysicalMaterial({
			color: this.slimeColor,
			transparent: true,
			opacity: 0.9,
			roughness: 0.08,
			metalness: 0,
			clearcoat: 0.95,
			clearcoatRoughness: 0.035,
			ior: 1.33,
			transmission: 0,
			depthWrite: true,
			side: THREE.DoubleSide,
		});
		material.onBeforeCompile = (shader) => {
			shader.uniforms.uSlimeTime = { value: 0 };
			shader.vertexShader = shader.vertexShader
				.replace('#include <common>', '#include <common>\nvarying vec3 vSlimePosition;')
				.replace('#include <begin_vertex>', '#include <begin_vertex>\nvSlimePosition = position;');
			shader.fragmentShader = shader.fragmentShader
				.replace(
					'#include <common>',
					'#include <common>\nuniform float uSlimeTime;\nvarying vec3 vSlimePosition;',
				)
				.replace(
					'#include <color_fragment>',
					`#include <color_fragment>
					float slimeFlow = sin(vSlimePosition.y * 13.0 - uSlimeTime * 1.8 + sin(vSlimePosition.x * 8.0 + uSlimeTime) * 0.7)
						* cos(vSlimePosition.z * 11.0 + uSlimeTime * 0.65);
					diffuseColor.rgb *= 0.91 + 0.13 * slimeFlow;`,
				)
				.replace(
					'#include <roughnessmap_fragment>',
					'#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor + 0.035 * (1.0 - abs(slimeFlow)), 0.035, 0.22);',
				);
			material.userData.slimeUniforms = shader.uniforms;
		};
		material.customProgramCacheKey = () => 'vrm-slime-flow-v1';
		const slime = new MarchingCubes(24, material, false, false, 4000);
		slime.isolation = 80;
		slime.scale.set(0.9, 1.55, 0.78);
		slime.position.set(0, 1.15, 0);
		slime.frustumCulled = false;
		this.currentVrm.scene.add(slime);
		this.slimeMesh = slime;
		this.slimeLastSimulationTime = this.clock.getElapsedTime();
		this.slimeLastMeshUpdate = -1;
		this.slimeSimulationAccumulator = 0;
		this.slimeEmissionTime = this.clock.getElapsedTime();
		this.slimeDrops = [];
	}

	public setSlimeColor(color: string): void {
		if (!/^#[\da-f]{6}$/i.test(color)) return;
		this.slimeColor = color;
		const materials = this.slimeMesh
			? Array.isArray(this.slimeMesh.material)
				? this.slimeMesh.material
				: [this.slimeMesh.material]
			: [];
		for (const material of materials) {
			if (material instanceof THREE.MeshStandardMaterial) material.color.set(color);
		}
	}

	private clearSlimeMesh(): void {
		if (!this.slimeMesh) return;
		this.slimeMesh.parent?.remove(this.slimeMesh);
		this.slimeMesh.geometry.dispose();
		const materials = Array.isArray(this.slimeMesh.material)
			? this.slimeMesh.material
			: [this.slimeMesh.material];
		for (const material of materials) material.dispose();
		this.slimeMesh = null;
		this.slimeDrops = [];
	}

	private updateSlime(elapsed: number): void {
		const slime = this.slimeMesh;
		const vrm = this.currentVrm;
		const humanoid = vrm?.humanoid;
		if (!slime || !this.slimeActive || !vrm || !humanoid) return;

		const bonePoints: Array<{
			bone: VRMHumanBoneName;
			field: THREE.Vector3;
			local: THREE.Vector3;
			radius: number;
		}> = [];
		const collisionBones: Array<[VRMHumanBoneName, number]> = [
			['head', 0.15],
			['neck', 0.12],
			['upperChest', 0.2],
			['chest', 0.22],
			['spine', 0.2],
			['hips', 0.22],
			['leftShoulder', 0.13],
			['rightShoulder', 0.13],
			['leftUpperArm', 0.105],
			['rightUpperArm', 0.105],
			['leftLowerArm', 0.08],
			['rightLowerArm', 0.08],
			['leftHand', 0.075],
			['rightHand', 0.075],
			['leftUpperLeg', 0.14],
			['rightUpperLeg', 0.14],
			['leftLowerLeg', 0.11],
			['rightLowerLeg', 0.11],
			['leftFoot', 0.09],
			['rightFoot', 0.09],
		];
		for (const [bone, radius] of collisionBones) {
			const node = humanoid.getNormalizedBoneNode(bone);
			if (!node) continue;
			const local = vrm.scene.worldToLocal(node.getWorldPosition(new THREE.Vector3()));
			bonePoints.push({
				bone,
				local,
				radius,
				field: new THREE.Vector3(
					THREE.MathUtils.clamp(0.5 + local.x / 0.9, 0.04, 0.96),
					THREE.MathUtils.clamp(0.5 + (local.y - 1.15) / 1.55, 0.04, 0.96),
					THREE.MathUtils.clamp(0.5 + local.z / 0.78, 0.04, 0.96),
				),
			});
		}
		const fillProgress = THREE.MathUtils.clamp((elapsed - this.slimeStartedAt) / 5, 0, 1);
		const headBone = bonePoints.find(({ bone }) => bone === 'head');
		const hipsBone = bonePoints.find(({ bone }) => bone === 'hips');
		const lowestBone = bonePoints.reduce(
			(lowest, point) => (point.local.y < lowest.local.y ? point : lowest),
			hipsBone ?? bonePoints[0],
		);
		const fillFrontY = THREE.MathUtils.lerp(
			headBone?.local.y ?? 1.7,
			lowestBone.local.y,
			fillProgress,
		);

		const frameDelta = Math.min(Math.max(0, elapsed - this.slimeLastSimulationTime), 0.1);
		this.slimeLastSimulationTime = elapsed;
		this.slimeSimulationAccumulator += frameDelta;
		const step = 1 / 30;
		const offset = new THREE.Vector3();
		const relativeVelocity = new THREE.Vector3();
		while (this.slimeSimulationAccumulator >= step) {
			if (elapsed >= this.slimeEmissionTime) {
				const emitters = bonePoints.filter(
					({ bone, local }) =>
						bone === 'head' || (local.y >= fillFrontY - 0.12 && local.y <= fillFrontY + 0.16),
				);
				if (emitters.length > 0) {
					const emitter = emitters[Math.floor(Math.random() * emitters.length)];
					const position = emitter.local.clone();
					position.y += emitter.radius + 0.08;
					position.x += (Math.random() - 0.5) * 0.09;
					position.z += (Math.random() - 0.5) * 0.08;
					this.slimeDrops.push({
						position,
						velocity: new THREE.Vector3(
							(Math.random() - 0.5) * 0.16,
							-0.12,
							(Math.random() - 0.5) * 0.12,
						),
						acceleration: new THREE.Vector3(),
						radius: 0.025 + Math.random() * 0.012,
						age: 0,
					});
				}
				this.slimeEmissionTime = elapsed + 0.16;
			}

			for (const drop of this.slimeDrops) drop.acceleration.set(0, -1.25, 0);
			const interactionRadius = 0.19;
			for (let i = 0; i < this.slimeDrops.length; i += 1) {
				const first = this.slimeDrops[i];
				for (let j = i + 1; j < this.slimeDrops.length; j += 1) {
					const second = this.slimeDrops[j];
					offset.subVectors(second.position, first.position);
					const distance = offset.length();
					if (distance <= 0.0001 || distance >= interactionRadius) continue;
					const influence = 1 - distance / interactionRadius;
					const direction = offset.multiplyScalar(1 / distance);
					const cohesion = influence * 1.8;
					first.acceleration.addScaledVector(direction, cohesion);
					second.acceleration.addScaledVector(direction, -cohesion);
					relativeVelocity.subVectors(second.velocity, first.velocity);
					first.acceleration.addScaledVector(relativeVelocity, influence * 3.2);
					second.acceleration.addScaledVector(relativeVelocity, -influence * 3.2);
					const minDistance = first.radius + second.radius;
					if (distance < minDistance) {
						const push = (minDistance - distance) * 8;
						first.acceleration.addScaledVector(direction, -push);
						second.acceleration.addScaledVector(direction, push);
					}
				}
			}

			for (const drop of this.slimeDrops) {
				drop.velocity.addScaledVector(drop.acceleration, step);
				drop.velocity.multiplyScalar(0.985);
				drop.position.addScaledVector(drop.velocity, step);
				drop.age += step;
				for (const { local: center, radius } of bonePoints) {
					offset.subVectors(drop.position, center);
					const distance = offset.length();
					const surfaceRadius = radius + drop.radius;
					if (distance >= surfaceRadius || distance <= 0.0001) continue;
					const normal = offset.multiplyScalar(1 / distance);
					drop.position.copy(center).addScaledVector(normal, surfaceRadius);
					const inwardVelocity = drop.velocity.dot(normal);
					if (inwardVelocity < 0) drop.velocity.addScaledVector(normal, -inwardVelocity);
					drop.velocity.multiplyScalar(0.82);
				}
			}
			for (let i = this.slimeDrops.length - 1; i >= 0; i -= 1) {
				const drop = this.slimeDrops[i];
				if (drop.age >= 5 || drop.position.y <= 0.55) this.slimeDrops.splice(i, 1);
			}
			if (this.slimeDrops.length > 80) this.slimeDrops.splice(0, this.slimeDrops.length - 80);
			this.slimeSimulationAccumulator -= step;
		}

		const slimeMaterials = Array.isArray(slime.material) ? slime.material : [slime.material];
		for (const material of slimeMaterials) {
			const uniforms = material.userData.slimeUniforms as
				| { uSlimeTime?: { value: number } }
				| undefined;
			if (uniforms?.uSlimeTime) uniforms.uSlimeTime.value = elapsed;
		}
		if (elapsed - this.slimeLastMeshUpdate < 1 / 12) return;
		slime.reset();
		for (const { bone, field, local } of bonePoints) {
			const isSource = bone === 'head' || bone === 'leftShoulder' || bone === 'rightShoulder';
			if (local.y < fillFrontY - 0.04) continue;
			const strength = isSource
				? 0.16
				: bone === 'chest' || bone === 'upperChest'
					? 0.12 * fillProgress
					: 0.08 * fillProgress;
			slime.addBall(field.x, field.y, field.z, strength, 14);
		}
		const findBone = (bone: VRMHumanBoneName) => bonePoints.find((point) => point.bone === bone);
		const head = findBone('head');
		const chest = findBone('chest') ?? findBone('upperChest') ?? findBone('spine');
		const hips = findBone('hips') ?? chest;
		const trails: Array<[typeof head, typeof hips, number, number]> = [
			[head, hips, 0, 0],
			[findBone('leftShoulder'), hips, 0.12, 1.7],
			[findBone('rightShoulder'), hips, 0.2, 3.4],
			[chest, hips, 0.36, 5.1],
			[hips, findBone('leftFoot'), 0.58, 2.1],
			[hips, findBone('rightFoot'), 0.58, 4.2],
			[findBone('leftShoulder'), findBone('leftHand'), 0.18, 0.9],
			[findBone('rightShoulder'), findBone('rightHand'), 0.18, 3.9],
		];
		for (const [from, to, startAt, phase] of trails) {
			if (!from || !to) continue;
			const pathProgress = THREE.MathUtils.clamp((fillProgress - startAt) / (1 - startAt), 0, 1);
			if (pathProgress <= 0.005) continue;
			const pulsePosition = ((elapsed * 0.42 + phase * 0.13) % 1) * pathProgress;
			const segmentCount = Math.max(1, Math.ceil(pathProgress * 12));
			for (let i = 0; i <= segmentCount; i += 1) {
				const t = (i / segmentCount) * pathProgress;
				const wave = elapsed * 2.8 - t * 8 + phase;
				const local = from.local.clone().lerp(to.local, t);
				local.x += Math.sin(wave) * 0.035 * Math.sin(Math.PI * t);
				local.y += Math.sin(wave * 0.72) * 0.012;
				local.z += 0.12 + Math.cos(wave * 0.8) * 0.018;
				const field = new THREE.Vector3(
					THREE.MathUtils.clamp(0.5 + local.x / 0.9, 0.04, 0.96),
					THREE.MathUtils.clamp(0.5 + (local.y - 1.15) / 1.55, 0.04, 0.96),
					THREE.MathUtils.clamp(0.5 + local.z / 0.78, 0.04, 0.96),
				);
				const pulse = Math.exp(-(((t - pulsePosition) / 0.11) ** 2)) * 0.14;
				slime.addBall(field.x, field.y, field.z, 0.2 + pulse, 14);
			}
		}
		for (const drop of this.slimeDrops) {
			const point = new THREE.Vector3(
				THREE.MathUtils.clamp(0.5 + drop.position.x / 0.9, 0.04, 0.96),
				THREE.MathUtils.clamp(0.5 + (drop.position.y - 1.15) / 1.55, 0.04, 0.96),
				THREE.MathUtils.clamp(0.5 + drop.position.z / 0.78, 0.04, 0.96),
			);
			const surfaceStrength = 0.18 + drop.radius * 0.8;
			slime.addBall(point.x, point.y, point.z, surfaceStrength, 14);
		}
		slime.update();
		this.slimeLastMeshUpdate = elapsed;
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

	private captureIdleRestPose(): void {
		this.idleRestRotations.clear();
		const humanoid = this.currentVrm?.humanoid;
		if (!humanoid) return;

		for (const boneName of VRM_IDLE_BONES) {
			const node = humanoid.getNormalizedBoneNode(boneName as VRMHumanBoneName);
			if (node) this.idleRestRotations.set(boneName, node.quaternion.clone());
		}
	}

	private getIdleBlendWeight(elapsed: number): number {
		if (this.idleBlendDuration <= 0) return this.idleBlendTargetWeight;
		const progress = THREE.MathUtils.clamp(
			(elapsed - this.idleBlendStartTime) / this.idleBlendDuration,
			0,
			1,
		);
		return THREE.MathUtils.lerp(this.idleBlendStartWeight, this.idleBlendTargetWeight, progress);
	}

	/** Applies the sampled idle as a local quaternion offset from the model's normalized rest pose. */
	private updateIdlePose(elapsed: number): void {
		const humanoid = this.currentVrm?.humanoid;
		if (!humanoid) return;

		this.idleBlendWeight = this.getIdleBlendWeight(elapsed);
		const pose = sampleVrmIdlePose(elapsed, this.idleSettings);

		for (const [boneName, offset] of Object.entries(pose) as [VrmIdleBoneName, VrmIdleRotation][]) {
			this.applyIdleRotation(humanoid, boneName, offset, this.idleBlendWeight);
		}

		for (const [boneName, offset] of Object.entries(VRM_RELAXED_ARM_POSE) as [
			VrmIdleBoneName,
			VrmIdleRotation,
		][]) {
			this.applyIdleRotation(humanoid, boneName, offset, 1);
		}
	}

	private applyIdleRotation(
		humanoid: NonNullable<VRM['humanoid']>,
		boneName: VrmIdleBoneName,
		offset: VrmIdleRotation,
		weight: number,
	): void {
		const node = humanoid.getNormalizedBoneNode(boneName as VRMHumanBoneName);
		const base = this.idleRestRotations.get(boneName);
		if (!node || !base) return;

		this.idleEuler.set(offset.x, offset.y, offset.z, 'XYZ');
		this.idleDeltaQuaternion.setFromEuler(this.idleEuler);
		this.idleTargetQuaternion.copy(base).multiply(this.idleDeltaQuaternion);
		node.quaternion.copy(base).slerp(this.idleTargetQuaternion, weight);
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
			this.updateBoneHitReactions(elapsed);
			this.currentVrm.update(delta);
			this.currentVrm.scene.updateMatrixWorld(true);
		}
		this.updateSlime(elapsed);
		for (let i = this.spawnedObjects.length - 1; i >= 0; i -= 1) {
			const item = this.spawnedObjects[i];
			const step = Math.min(delta, 0.04);
			item.velocity.y -= 4.8 * step;
			item.velocity.multiplyScalar(Math.exp(-item.drag * step));
			item.mesh.position.addScaledVector(item.velocity, step);
			item.mesh.rotation.x += item.spin.x * step;
			item.mesh.rotation.y += item.spin.y * step;
			item.mesh.rotation.z += item.spin.z * step;
			if (item.mesh.position.y < item.floorY) {
				item.mesh.position.y = item.floorY;
				item.velocity.y = Math.abs(item.velocity.y) * item.restitution;
				item.velocity.x *= 0.82;
				item.velocity.z *= 0.82;
				item.spin.multiplyScalar(0.78);
				if (item.velocity.y < 0.35) {
					item.velocity.y = 0;
					item.velocity.x *= 0.92;
					item.velocity.z *= 0.92;
				}
			}
			this.resolveAvatarCollision(item);
			if (item.mesh.position.x < -1.1 || item.mesh.position.x > 1.1) {
				item.mesh.position.x = THREE.MathUtils.clamp(item.mesh.position.x, -1.1, 1.1);
				item.velocity.x *= -0.58;
			}
			if (item.mesh.position.z < -0.7 || item.mesh.position.z > 0.7) {
				item.mesh.position.z = THREE.MathUtils.clamp(item.mesh.position.z, -0.7, 0.7);
				item.velocity.z *= -0.58;
			}
			if (elapsed >= item.expiresAt) {
				this.disposeSpawnedObject(item.mesh);
				this.spawnedObjects.splice(i, 1);
			}
		}
		this.resolveObjectCollisions();

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
		for (const item of this.spawnedObjects) {
			this.disposeSpawnedObject(item.mesh);
		}
		this.spawnedObjects = [];
		this.slimeActive = false;
		this.clearSlimeMesh();

		if (this.currentVrm) {
			this.scene.remove(this.currentVrm.scene);
			VRMUtils.deepDispose(this.currentVrm.scene);
			this.currentVrm = null;
		}
		this.idleRestRotations.clear();

		this.controls.dispose();
		this.renderer.dispose();
		this.onModelLoadedCallbacks.clear();
		this.onFpsCallbacks.clear();
	}
}
