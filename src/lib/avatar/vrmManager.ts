'use client';

import {
	DEFAULT_VRM_BACKGROUND_STATE,
	type VrmBackgroundState,
	getStoredBackgroundState,
	storeBackgroundState,
} from '@/lib/avatar/vrmBackground';
import {
	DEFAULT_VRM_IDLE_SETTINGS,
	type VrmIdleSettings,
	normalizeVrmIdleSettings,
} from '@/lib/avatar/vrmIdle';
import {
	type VrmModelMeta,
	clearSavedVrmModel,
	loadSavedVrmModel,
	saveVrmModel,
} from '@/lib/avatar/vrmStorage';
import {
	DEFAULT_VRM_SLIME_COLOR,
	type VrmDropObjectKind,
	type VrmTriggerAction,
	getVrmTriggerRules,
	matchesVrmTriggerFilter,
} from '@/lib/avatar/vrmTriggerGraph';
import type {
	VrmCameraPreset,
	VrmCameraTransform,
	VrmFallingEmote,
	VrmViewer,
} from '@/lib/avatar/vrmViewer';

export type VrmSyncMessage =
	| { type: 'vowels'; vowels: { A?: number; I?: number; U?: number; E?: number; O?: number } }
	| { type: 'emotion'; emotion: string; intensity: number }
	| { type: 'idleSettings'; settings: VrmIdleSettings }
	| { type: 'reset' }
	| { type: 'modelUpdated' }
	| { type: 'cameraPreset'; preset: VrmCameraPreset }
	| { type: 'cameraTransform'; transform: VrmCameraTransform }
	| { type: 'background'; state: VrmBackgroundState }
	| { type: 'throwObject'; kind: VrmDropObjectKind; strength: number }
	| {
			type: 'emojiRain';
			emojis: VrmFallingEmote[];
			amount: number;
			radius: number;
			size: number;
			gravity: number;
			durationSeconds: number;
	  }
	| { type: 'bonePose'; bone: string; rotation: number; durationSeconds: number }
	| { type: 'boneReset'; bone: string }
	| { type: 'boneScale'; bone: string; scale: number; durationSeconds: number }
	| { type: 'boneScaleReset'; bone: string }
	| { type: 'slime'; enabled: boolean; color?: string }
	| { type: 'slimeColor'; color: string }
	| { type: 'requestState' }
	| {
			type: 'fullState';
			emotion: string;
			intensity: number;
			cameraPreset: VrmCameraPreset;
			cameraTransform?: VrmCameraTransform;
			background?: VrmBackgroundState;
			slimeActive?: boolean;
			slimeColor?: string;
			idleSettings?: VrmIdleSettings;
	  };

const CAMERA_STORAGE_KEY = 'sandy_vrm_camera_transform';
const PRESET_STORAGE_KEY = 'sandy_vrm_camera_preset';
const IDLE_STORAGE_KEY = 'sandy_vrm_idle_settings';

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
	private currentIdleSettings: VrmIdleSettings = { ...DEFAULT_VRM_IDLE_SETTINGS };
	private currentCameraPreset: VrmCameraPreset = 'face';
	private currentCameraTransform: VrmCameraTransform | null = null;
	private currentBackground: VrmBackgroundState | null = null;
	private availableExpressions: string[] = [];
	private currentSlimeActive = false;
	private currentSlimeColor = DEFAULT_VRM_SLIME_COLOR;
	private slimeOffTimer: ReturnType<typeof setTimeout> | null = null;
	private expressionOffTimer: ReturnType<typeof setTimeout> | null = null;
	private idleOffTimer: ReturnType<typeof setTimeout> | null = null;
	private bonePoseTimers = new Map<string, ReturnType<typeof setTimeout>>();
	private boneScaleTimers = new Map<string, ReturnType<typeof setTimeout>>();

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
				const savedIdle = window.localStorage.getItem(IDLE_STORAGE_KEY);
				if (savedIdle) {
					this.currentIdleSettings = normalizeVrmIdleSettings(JSON.parse(savedIdle));
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
			viewer.setIdleSettings(this.currentIdleSettings);
			if (this.currentEmotion !== 'neutral') {
				viewer.setExpression(this.currentEmotion, this.currentIntensity);
			}
			viewer.setSlimeActive(this.currentSlimeActive, this.currentSlimeColor);
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

	public getIdleSettings(): VrmIdleSettings {
		return { ...this.currentIdleSettings };
	}

	public setIdleSettings(settings: Partial<VrmIdleSettings>): void {
		if (settings.enabled === false && this.idleOffTimer) {
			clearTimeout(this.idleOffTimer);
			this.idleOffTimer = null;
		}
		this.currentIdleSettings = normalizeVrmIdleSettings(settings, this.currentIdleSettings);
		try {
			window.localStorage.setItem(IDLE_STORAGE_KEY, JSON.stringify(this.currentIdleSettings));
		} catch {
			// Keep the setting in memory when browser storage is unavailable.
		}
		for (const viewer of this.activeViewers) {
			viewer.setIdleSettings(this.currentIdleSettings);
		}
		this.broadcastChannel?.postMessage({
			type: 'idleSettings',
			settings: this.currentIdleSettings,
		});
		this.notify();
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
		if (this.expressionOffTimer) clearTimeout(this.expressionOffTimer);
		this.expressionOffTimer = null;
		this.currentEmotion = emotion;
		this.currentIntensity = intensity;
		for (const viewer of this.activeViewers) {
			viewer.setExpression(emotion, intensity);
		}
		this.broadcastChannel?.postMessage({ type: 'emotion', emotion, intensity });
	}

	public resetEmotions(): void {
		if (this.expressionOffTimer) clearTimeout(this.expressionOffTimer);
		this.expressionOffTimer = null;
		this.currentEmotion = 'neutral';
		for (const viewer of this.activeViewers) {
			viewer.resetExpressions();
		}
		this.broadcastChannel?.postMessage({ type: 'reset' });
	}

	public executeTriggerAction(
		action: VrmTriggerAction,
		broadcast = true,
		eventData: Record<string, unknown> = {},
	): void {
		switch (action.type) {
			case 'expression': {
				this.setEmotion(action.expression, 1);
				if (action.durationSeconds && action.durationSeconds > 0) {
					const seconds = Math.min(300, Math.max(1, action.durationSeconds));
					this.expressionOffTimer = setTimeout(() => {
						this.expressionOffTimer = null;
						if (this.currentEmotion === action.expression) this.resetEmotions();
					}, seconds * 1000);
				}
				break;
			}
			case 'idle': {
				if (this.idleOffTimer) clearTimeout(this.idleOffTimer);
				this.idleOffTimer = null;
				this.setIdleSettings({ enabled: action.enabled });
				if (action.enabled && action.durationSeconds && action.durationSeconds > 0) {
					const seconds = Math.min(300, Math.max(1, action.durationSeconds));
					this.idleOffTimer = setTimeout(() => {
						this.idleOffTimer = null;
						this.setIdleSettings({ enabled: false });
					}, seconds * 1000);
				}
				break;
			}
			case 'throw_object':
				{
					const availableKinds = [
						'ball',
						'rubber_duck',
						'sneaker',
						'apple',
						'donut',
						'heart',
						'star',
					] as const;
					const kind =
						action.kind && action.kind !== 'random'
							? action.kind
							: availableKinds[Math.floor(Math.random() * availableKinds.length)];
					const strength = action.strength ?? 1;
					for (const viewer of this.activeViewers) viewer.spawnDropObject(kind, strength);
					if (broadcast)
						this.broadcastChannel?.postMessage({ type: 'throwObject', kind, strength });
				}
				break;
			case 'bone_pose': {
				const oldTimer = this.bonePoseTimers.get(action.bone);
				if (oldTimer) clearTimeout(oldTimer);
				const seconds = Math.min(300, Math.max(1, action.durationSeconds));
				for (const viewer of this.activeViewers)
					viewer.setBoneRotation(action.bone, action.rotation);
				if (broadcast)
					this.broadcastChannel?.postMessage({
						type: 'bonePose',
						bone: action.bone,
						rotation: action.rotation,
						durationSeconds: seconds,
					});
				this.bonePoseTimers.set(
					action.bone,
					setTimeout(() => {
						this.bonePoseTimers.delete(action.bone);
						for (const viewer of this.activeViewers) viewer.resetBonePose(action.bone);
						if (broadcast)
							this.broadcastChannel?.postMessage({ type: 'boneReset', bone: action.bone });
					}, seconds * 1000),
				);
				break;
			}
			case 'bone_scale': {
				const oldTimer = this.boneScaleTimers.get(action.bone);
				if (oldTimer) clearTimeout(oldTimer);
				const seconds = Math.min(300, Math.max(1, action.durationSeconds));
				for (const viewer of this.activeViewers) viewer.setBoneScale(action.bone, action.scale);
				if (broadcast)
					this.broadcastChannel?.postMessage({
						type: 'boneScale',
						bone: action.bone,
						scale: action.scale,
						durationSeconds: seconds,
					});
				this.boneScaleTimers.set(
					action.bone,
					setTimeout(() => {
						this.boneScaleTimers.delete(action.bone);
						for (const viewer of this.activeViewers) viewer.resetBoneScale(action.bone);
						if (broadcast)
							this.broadcastChannel?.postMessage({ type: 'boneScaleReset', bone: action.bone });
					}, seconds * 1000),
				);
				break;
			}
			case 'emoji_rain': {
				const message = String(eventData.message ?? eventData.input ?? '');
				const textEmojis = Array.from(
					new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(message),
				)
					.map((part) => part.segment)
					.filter((part) => /\p{Extended_Pictographic}/u.test(part));
				const twitchEmotes = Array.isArray(eventData.emotes)
					? eventData.emotes.flatMap((value): VrmFallingEmote[] => {
							if (!value || typeof value !== 'object') return [];
							const emote = value as { name?: unknown; id?: unknown; imageUrl?: unknown };
							const id = String(emote.id ?? '');
							const text = String(emote.name ?? '');
							if (!text) return [];
							return [
								{
									text,
									imageUrl:
										String(
											emote.imageUrl ??
												(id
													? `https://static-cdn.jtvnw.net/emoticons/v2/${encodeURIComponent(id)}/default/dark/2.0`
													: ''),
										) || undefined,
								},
							];
						})
					: [];
				const tokens: VrmFallingEmote[] = [
					...twitchEmotes,
					...textEmojis.map((text) => ({ text })),
				];
				if (!tokens.length) break;
				const settings = {
					amount: action.amount,
					radius: action.radius,
					size: action.size,
					gravity: action.gravity,
					durationSeconds: action.durationSeconds,
				};
				for (const viewer of this.activeViewers) viewer.spawnEmojiRain(tokens, settings);
				if (broadcast)
					this.broadcastChannel?.postMessage({ type: 'emojiRain', emojis: tokens, ...settings });
				break;
			}
			case 'slime':
				if (this.slimeOffTimer) clearTimeout(this.slimeOffTimer);
				this.slimeOffTimer = null;
				this.currentSlimeActive = action.enabled;
				this.currentSlimeColor = action.color ?? this.currentSlimeColor;
				for (const viewer of this.activeViewers) {
					viewer.setSlimeActive(action.enabled, this.currentSlimeColor);
				}
				if (broadcast)
					this.broadcastChannel?.postMessage({
						type: 'slime',
						enabled: action.enabled,
						color: this.currentSlimeColor,
					});
				if (action.enabled && action.durationSeconds && action.durationSeconds > 0) {
					const seconds = Math.min(300, Math.max(1, action.durationSeconds));
					this.slimeOffTimer = setTimeout(() => {
						this.slimeOffTimer = null;
						this.executeTriggerAction({
							type: 'slime',
							enabled: false,
							color: this.currentSlimeColor,
						});
					}, seconds * 1000);
				}
				break;
		}
	}

	public setSlimeColor(color: string, broadcast = true): void {
		if (!/^#[\da-f]{6}$/i.test(color)) return;
		this.currentSlimeColor = color;
		for (const viewer of this.activeViewers) viewer.setSlimeColor(color);
		if (broadcast) this.broadcastChannel?.postMessage({ type: 'slimeColor', color });
	}

	public handleAvatarTrigger(event: { trigger?: string; data?: Record<string, unknown> }): void {
		const trigger = String(event.trigger ?? '');
		const rewardId = String(event.data?.rewardId ?? '');
		for (const rule of getVrmTriggerRules()) {
			if (!rule.enabled || rule.trigger !== trigger) continue;
			if (rule.trigger === 'channel_point_reward' && rule.rewardId && rule.rewardId !== rewardId)
				continue;
			if (!matchesVrmTriggerFilter(rule, event.data ?? {})) continue;
			this.executeTriggerAction(rule.action, true, event.data ?? {});
		}
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
				if (this.expressionOffTimer) clearTimeout(this.expressionOffTimer);
				this.expressionOffTimer = null;
				this.currentEmotion = msg.emotion;
				this.currentIntensity = msg.intensity;
				for (const viewer of this.activeViewers) {
					viewer.setExpression(msg.emotion, msg.intensity);
				}
				break;
			case 'reset':
				if (this.expressionOffTimer) clearTimeout(this.expressionOffTimer);
				this.expressionOffTimer = null;
				this.currentEmotion = 'neutral';
				for (const viewer of this.activeViewers) {
					viewer.resetExpressions();
				}
				break;
			case 'idleSettings':
				if (this.idleOffTimer) clearTimeout(this.idleOffTimer);
				this.idleOffTimer = null;
				this.currentIdleSettings = normalizeVrmIdleSettings(msg.settings, this.currentIdleSettings);
				for (const viewer of this.activeViewers) {
					viewer.setIdleSettings(this.currentIdleSettings);
				}
				this.notify();
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
			case 'throwObject':
				for (const viewer of this.activeViewers) viewer.spawnDropObject(msg.kind, msg.strength);
				break;
			case 'emojiRain':
				for (const viewer of this.activeViewers)
					viewer.spawnEmojiRain(msg.emojis, {
						amount: msg.amount,
						radius: msg.radius,
						size: msg.size,
						gravity: msg.gravity,
						durationSeconds: msg.durationSeconds,
					});
				break;
			case 'bonePose':
				this.executeTriggerAction(
					{
						type: 'bone_pose',
						bone: msg.bone,
						rotation: msg.rotation,
						durationSeconds: msg.durationSeconds,
					},
					false,
				);
				break;
			case 'boneReset':
				{
					const timer = this.bonePoseTimers.get(msg.bone);
					if (timer) clearTimeout(timer);
					this.bonePoseTimers.delete(msg.bone);
					for (const viewer of this.activeViewers) viewer.resetBonePose(msg.bone);
				}
				break;
			case 'boneScale':
				this.executeTriggerAction(
					{
						type: 'bone_scale',
						bone: msg.bone,
						scale: msg.scale,
						durationSeconds: msg.durationSeconds,
					},
					false,
				);
				break;
			case 'boneScaleReset': {
				const timer = this.boneScaleTimers.get(msg.bone);
				if (timer) clearTimeout(timer);
				this.boneScaleTimers.delete(msg.bone);
				for (const viewer of this.activeViewers) viewer.resetBoneScale(msg.bone);
				break;
			}
			case 'slime':
				this.currentSlimeActive = msg.enabled;
				this.currentSlimeColor = msg.color ?? this.currentSlimeColor;
				for (const viewer of this.activeViewers) {
					viewer.setSlimeActive(msg.enabled, this.currentSlimeColor);
				}
				break;
			case 'slimeColor':
				this.setSlimeColor(msg.color, false);
				break;
			case 'requestState':
				this.broadcastChannel?.postMessage({
					type: 'fullState',
					emotion: this.currentEmotion,
					intensity: this.currentIntensity,
					cameraPreset: this.currentCameraPreset,
					cameraTransform: this.currentCameraTransform ?? undefined,
					background: this.getBackground(),
					slimeActive: this.currentSlimeActive,
					slimeColor: this.currentSlimeColor,
					idleSettings: this.currentIdleSettings,
				});
				break;
			case 'fullState':
				if (this.expressionOffTimer) clearTimeout(this.expressionOffTimer);
				this.expressionOffTimer = null;
				if (this.idleOffTimer) clearTimeout(this.idleOffTimer);
				this.idleOffTimer = null;
				this.currentEmotion = msg.emotion;
				this.currentIntensity = msg.intensity;
				if (msg.idleSettings) {
					this.currentIdleSettings = normalizeVrmIdleSettings(
						msg.idleSettings,
						this.currentIdleSettings,
					);
					for (const viewer of this.activeViewers) {
						viewer.setIdleSettings(this.currentIdleSettings);
					}
				}
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
				if (msg.slimeActive !== undefined) {
					this.currentSlimeActive = msg.slimeActive;
					this.currentSlimeColor = msg.slimeColor ?? this.currentSlimeColor;
					for (const viewer of this.activeViewers) {
						viewer.setSlimeActive(msg.slimeActive, this.currentSlimeColor);
					}
				} else if (msg.slimeColor) {
					this.setSlimeColor(msg.slimeColor, false);
				}
				this.notify();
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
