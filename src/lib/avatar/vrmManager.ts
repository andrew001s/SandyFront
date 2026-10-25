'use client';

import {
	DEFAULT_VRM_BACKGROUND_STATE,
	type VrmBackgroundState,
	getStoredBackgroundState,
	storeBackgroundState,
} from '@/lib/avatar/vrmBackground';
import {
	type VrmModelMeta,
	clearSavedVrmModel,
	loadSavedVrmModel,
	saveVrmModel,
} from '@/lib/avatar/vrmStorage';
import type { VrmCameraPreset, VrmCameraTransform, VrmViewer } from '@/lib/avatar/vrmViewer';

export type VrmSyncMessage =
	| { type: 'vowels'; vowels: { A?: number; I?: number; U?: number; E?: number; O?: number } }
	| { type: 'emotion'; emotion: string; intensity: number }
	| { type: 'reset' }
	| { type: 'modelUpdated' }
	| { type: 'cameraPreset'; preset: VrmCameraPreset }
	| { type: 'cameraTransform'; transform: VrmCameraTransform }
	| { type: 'background'; state: VrmBackgroundState }
	| { type: 'requestState' }
	| {
			type: 'fullState';
			emotion: string;
			intensity: number;
			cameraPreset: VrmCameraPreset;
			cameraTransform?: VrmCameraTransform;
			background?: VrmBackgroundState;
	  };

const CAMERA_STORAGE_KEY = 'sandy_vrm_camera_transform';
const PRESET_STORAGE_KEY = 'sandy_vrm_camera_preset';

export class VrmManager {
	private static instance: VrmManager;
	private activeViewers = new Set<VrmViewer>();
	private broadcastChannel: BroadcastChannel | null = null;
	private currentMeta: VrmModelMeta | null = null;
	private currentBuffer: ArrayBuffer | null = null;
	private listeners = new Set<() => void>();
	private bgListeners = new Set<(state: VrmBackgroundState) => void>();

	// Estado activo para sincronización espejo en tiempo real con OBS Overlay
	private currentEmotion = 'neutral';
	private currentIntensity = 1.0;
	private currentCameraPreset: VrmCameraPreset = 'face';
	private currentCameraTransform: VrmCameraTransform | null = null;
	private currentBackground: VrmBackgroundState | null = null;
	private availableExpressions: string[] = [];

	private constructor() {
		if (typeof window !== 'undefined') {
			try {
				const savedTransform = window.localStorage.getItem(CAMERA_STORAGE_KEY);
				if (savedTransform) {
					this.currentCameraTransform = JSON.parse(savedTransform);
				}
				const savedPreset = window.localStorage.getItem(PRESET_STORAGE_KEY);
				if (savedPreset) {
					this.currentCameraPreset = savedPreset as VrmCameraPreset;
				}
				this.currentBackground = getStoredBackgroundState();
			} catch {
				// Ignorar errores de lectura inicial
			}

			if ('BroadcastChannel' in window) {
				this.broadcastChannel = new BroadcastChannel('sandy_vrm_sync');
				this.broadcastChannel.onmessage = (event: MessageEvent<VrmSyncMessage>) => {
					this.handleSyncMessage(event.data);
				};
				// Solicitar estado a cualquier pestaña abierta
				setTimeout(() => {
					this.broadcastChannel?.postMessage({ type: 'requestState' });
				}, 100);
			}

			// Escuchar cambios de localStorage entre diferentes pestañas/ventanas y fuentes de OBS
			window.addEventListener('storage', (event) => {
				if (
					event.key === 'sandy_vrm_background_state' ||
					event.key === 'sandy_vrm_background_image_data'
				) {
					const freshBg = getStoredBackgroundState();
					this.currentBackground = freshBg;
					this.notifyBg(freshBg);
				} else if (event.key === CAMERA_STORAGE_KEY && event.newValue) {
					try {
						const transform = JSON.parse(event.newValue);
						this.currentCameraTransform = transform;
						for (const viewer of this.activeViewers) {
							viewer.setCameraTransform(transform);
						}
					} catch {
						// Ignorar error de parseo
					}
				} else if (event.key === PRESET_STORAGE_KEY && event.newValue) {
					this.currentCameraPreset = event.newValue as VrmCameraPreset;
					this.currentCameraTransform = null;
					for (const viewer of this.activeViewers) {
						viewer.setCameraPreset(this.currentCameraPreset);
					}
				}
			});
		}
	}

	static getInstance(): VrmManager {
		if (!VrmManager.instance) {
			VrmManager.instance = new VrmManager();
		}
		return VrmManager.instance;
	}

	public subscribe(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	public subscribeBackground(listener: (state: VrmBackgroundState) => void): () => void {
		this.bgListeners.add(listener);
		if (this.currentBackground) {
			listener(this.currentBackground);
		}
		return () => this.bgListeners.delete(listener);
	}

	private notify(): void {
		for (const listener of this.listeners) {
			listener();
		}
	}

	private notifyBg(state: VrmBackgroundState): void {
		for (const listener of this.bgListeners) {
			listener(state);
		}
	}

	public registerViewer(viewer: VrmViewer): () => void {
		this.activeViewers.add(viewer);

		const applyActiveState = () => {
			if (this.currentEmotion !== 'neutral') {
				viewer.setExpression(this.currentEmotion, this.currentIntensity);
			}
			if (this.currentCameraTransform) {
				viewer.setCameraTransform(this.currentCameraTransform);
			} else {
				viewer.setCameraPreset(this.currentCameraPreset);
			}
		};

		const unregisterModelLoaded = viewer.onModelLoaded(() => {
			this.availableExpressions = viewer.getAvailableExpressions();
			applyActiveState();
			this.notify();
		});

		if (this.currentBuffer) {
			void viewer.loadModel(this.currentBuffer.slice(0)).then(() => {
				applyActiveState();
			});
		} else {
			void this.restoreSavedModel().then((loaded) => {
				if (loaded && this.currentBuffer) {
					void viewer.loadModel(this.currentBuffer.slice(0)).then(() => {
						applyActiveState();
					});
				}
			});
		}

		return () => {
			unregisterModelLoaded();
			this.activeViewers.delete(viewer);
		};
	}

	public async restoreSavedModel(): Promise<boolean> {
		if (this.currentBuffer) return true;
		const saved = await loadSavedVrmModel();
		if (saved) {
			this.currentBuffer = saved.buffer;
			this.currentMeta = saved.meta;
			this.notify();
			return true;
		}
		return false;
	}

	public getMeta(): VrmModelMeta | null {
		return this.currentMeta;
	}

	public getBackground(): VrmBackgroundState {
		if (!this.currentBackground && typeof window !== 'undefined') {
			this.currentBackground = getStoredBackgroundState();
		}
		return this.currentBackground || DEFAULT_VRM_BACKGROUND_STATE;
	}

	public async loadModelFile(file: File): Promise<void> {
		const buffer = await file.arrayBuffer();
		const meta: VrmModelMeta = {
			name: file.name.replace(/\.vrm$/i, ''),
			size: file.size,
			updatedAt: new Date().toISOString(),
		};

		this.currentBuffer = buffer;
		this.currentMeta = meta;

		// Guardar en IndexedDB
		await saveVrmModel(buffer.slice(0), meta);

		// Cargar en los viewers activos
		for (const viewer of this.activeViewers) {
			await viewer.loadModel(buffer.slice(0));
			if (this.currentCameraTransform) {
				viewer.setCameraTransform(this.currentCameraTransform);
			} else {
				viewer.setCameraPreset(this.currentCameraPreset);
			}
		}

		// Notificar a otras pestañas (como overlay OBS)
		this.broadcastChannel?.postMessage({ type: 'modelUpdated' });
		this.notify();
	}

	public getAvailableExpressions(): string[] {
		return this.availableExpressions;
	}

	public async removeModel(): Promise<void> {
		this.currentBuffer = null;
		this.currentMeta = null;
		this.availableExpressions = [];
		await clearSavedVrmModel();
		this.notify();
		this.broadcastChannel?.postMessage({ type: 'modelUpdated' });
	}

	public setVowels(vowels: { A?: number; I?: number; U?: number; E?: number; O?: number }): void {
		for (const viewer of this.activeViewers) {
			viewer.setVowels(vowels);
		}
		this.broadcastChannel?.postMessage({ type: 'vowels', vowels });
	}

	public setEmotion(emotion: string, intensity = 1.0): void {
		this.currentEmotion = emotion;
		this.currentIntensity = intensity;
		for (const viewer of this.activeViewers) {
			viewer.setExpression(emotion, intensity);
		}
		this.broadcastChannel?.postMessage({ type: 'emotion', emotion, intensity });
	}

	public resetEmotions(): void {
		this.currentEmotion = 'neutral';
		for (const viewer of this.activeViewers) {
			viewer.resetExpressions();
		}
		this.broadcastChannel?.postMessage({ type: 'reset' });
	}

	public setCameraPreset(preset: VrmCameraPreset): void {
		this.currentCameraPreset = preset;
		this.currentCameraTransform = null;
		if (typeof window !== 'undefined') {
			try {
				window.localStorage.setItem(PRESET_STORAGE_KEY, preset);
				window.localStorage.removeItem(CAMERA_STORAGE_KEY);
			} catch {
				// Ignorar
			}
		}
		for (const viewer of this.activeViewers) {
			viewer.setCameraPreset(preset);
		}
		this.broadcastChannel?.postMessage({ type: 'cameraPreset', preset });
	}

	public setCameraTransform(transform: VrmCameraTransform, broadcast = true): void {
		this.currentCameraTransform = transform;
		if (typeof window !== 'undefined') {
			try {
				window.localStorage.setItem(CAMERA_STORAGE_KEY, JSON.stringify(transform));
			} catch {
				// Ignorar
			}
		}
		if (broadcast) {
			for (const viewer of this.activeViewers) {
				viewer.setCameraTransform(transform);
			}
			this.broadcastChannel?.postMessage({ type: 'cameraTransform', transform });
		}
	}

	public setBackground(state: VrmBackgroundState): void {
		this.currentBackground = state;
		storeBackgroundState(state);
		this.notifyBg(state);
		this.broadcastChannel?.postMessage({ type: 'background', state });
	}

	public requestSync(): void {
		if (this.broadcastChannel) {
			this.broadcastChannel.postMessage({ type: 'requestState' });
		}
	}

	private handleSyncMessage(msg: VrmSyncMessage): void {
		switch (msg.type) {
			case 'vowels':
				for (const viewer of this.activeViewers) {
					viewer.setVowels(msg.vowels);
				}
				break;
			case 'emotion':
				this.currentEmotion = msg.emotion;
				this.currentIntensity = msg.intensity;
				for (const viewer of this.activeViewers) {
					viewer.setExpression(msg.emotion, msg.intensity);
				}
				break;
			case 'reset':
				this.currentEmotion = 'neutral';
				for (const viewer of this.activeViewers) {
					viewer.resetExpressions();
				}
				break;
			case 'cameraPreset':
				this.currentCameraPreset = msg.preset;
				this.currentCameraTransform = null;
				for (const viewer of this.activeViewers) {
					viewer.setCameraPreset(msg.preset);
				}
				break;
			case 'cameraTransform':
				this.currentCameraTransform = msg.transform;
				for (const viewer of this.activeViewers) {
					viewer.setCameraTransform(msg.transform);
				}
				break;
			case 'background':
				this.currentBackground = msg.state;
				storeBackgroundState(msg.state);
				this.notifyBg(msg.state);
				break;
			case 'requestState':
				this.broadcastChannel?.postMessage({
					type: 'fullState',
					emotion: this.currentEmotion,
					intensity: this.currentIntensity,
					cameraPreset: this.currentCameraPreset,
					cameraTransform: this.currentCameraTransform ?? undefined,
					background: this.getBackground(),
				});
				break;
			case 'fullState':
				this.currentEmotion = msg.emotion;
				this.currentIntensity = msg.intensity;
				if (msg.cameraTransform) {
					this.currentCameraTransform = msg.cameraTransform;
					for (const viewer of this.activeViewers) {
						viewer.setCameraTransform(msg.cameraTransform);
					}
				} else if (msg.cameraPreset) {
					this.currentCameraPreset = msg.cameraPreset;
					for (const viewer of this.activeViewers) {
						viewer.setCameraPreset(msg.cameraPreset);
					}
				}
				if (msg.background) {
					this.currentBackground = msg.background;
					storeBackgroundState(msg.background);
					this.notifyBg(msg.background);
				}
				break;
			case 'modelUpdated':
				void this.restoreSavedModel().then(() => {
					if (this.currentBuffer) {
						for (const viewer of this.activeViewers) {
							void viewer.loadModel(this.currentBuffer.slice(0));
						}
					}
				});
				break;
		}
	}
}

export const vrmManager = VrmManager.getInstance();
