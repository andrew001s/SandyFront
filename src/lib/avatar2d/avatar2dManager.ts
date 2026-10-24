'use client';

import { AudioQueueManager } from '@/lib/audioQueueSingleton';
import { DEFAULT_SANDY_EMOTIONS, DEFAULT_SANDY_SPRITES } from '@/lib/avatar2d/defaultSprites';
import type {
	Avatar2dMode,
	Avatar2dState,
	Avatar2dSyncMessage,
	Avatar2dTransform,
	PngTuberEmotion,
	PngTuberPhysics,
	PngTuberSpriteKey,
} from '@/lib/avatar2d/types';

const STORAGE_KEY = 'sandy_avatar2d_state';

export const DEFAULT_AVATAR2D_STATE: Avatar2dState = {
	mode: 'pngtuber',
	pngtuber: {
		sprites: DEFAULT_SANDY_SPRITES,
		activeEmotion: 'neutral',
		emotions: DEFAULT_SANDY_EMOTIONS,
		physics: {
			bounceAmount: 14,
			bounceSpeed: 180,
			breathing: true,
			blinkInterval: 3800,
		},
		transform: {
			x: 0,
			y: 0,
			scale: 1,
			rotation: 0,
		},
	},
	live2d: {
		modelUrl: null,
		modelName: undefined,
		transform: {
			x: 0,
			y: 0,
			scale: 1,
			rotation: 0,
		},
		eyeTracking: true,
		autoBlink: true,
		breath: true,
		activeExpression: null,
		activeExpressions: [],
	},
};

export class Avatar2dManager {
	private static instance: Avatar2dManager;
	private state: Avatar2dState = DEFAULT_AVATAR2D_STATE;
	private isSpeaking = false;
	private mouthParams = { mouthOpenY: 0, mouthForm: 0 };
	private broadcastChannel: BroadcastChannel | null = null;
	private listeners = new Set<(state: Avatar2dState) => void>();
	private speakingListeners = new Set<(isSpeaking: boolean) => void>();
	private mouthListeners = new Set<(mouthOpenY: number, mouthForm: number) => void>();

	private constructor() {
		if (typeof window !== 'undefined') {
			try {
				const raw = window.localStorage.getItem(STORAGE_KEY);
				if (raw) {
					const parsed = JSON.parse(raw) as Partial<Avatar2dState>;
					this.state = {
						...DEFAULT_AVATAR2D_STATE,
						...parsed,
						pngtuber: {
							...DEFAULT_AVATAR2D_STATE.pngtuber,
							...parsed.pngtuber,
							sprites: {
								...DEFAULT_SANDY_SPRITES,
								...(parsed.pngtuber?.sprites || {}),
							},
						},
						live2d: {
							...DEFAULT_AVATAR2D_STATE.live2d,
							...parsed.live2d,
							activeExpressions:
								parsed.live2d?.activeExpressions ??
								(parsed.live2d?.activeExpression ? [parsed.live2d.activeExpression] : []),
						},
					};
				}
			} catch {
				// Ignorar error de carga
			}

			// BroadcastChannel para sincronizar en tiempo real con Overlay OBS
			if ('BroadcastChannel' in window) {
				this.broadcastChannel = new BroadcastChannel('sandy_avatar2d_sync');
				this.broadcastChannel.onmessage = (event: MessageEvent<Avatar2dSyncMessage>) => {
					this.handleSyncMessage(event.data);
				};

				// Solicitar sincronización inicial
				setTimeout(() => {
					this.broadcastChannel?.postMessage({ type: 'requestState' });
				}, 100);
			}

			// Suscribirse al reproductor de voz global para activar la boca de forma reactiva
			const audioQueue = AudioQueueManager.getInstance();
			audioQueue.subscribe((playing) => {
				this.setSpeaking(playing);
			});

			// Redundancia con eventos storage entre pestañas
			window.addEventListener('storage', (event) => {
				if (event.key === STORAGE_KEY && event.newValue) {
					try {
						const next = JSON.parse(event.newValue) as Avatar2dState;
						this.state = next;
						this.notify();
					} catch {
						// Ignorar
					}
				}
			});
		}
	}

	public static getInstance(): Avatar2dManager {
		if (!Avatar2dManager.instance) {
			Avatar2dManager.instance = new Avatar2dManager();
		}
		return Avatar2dManager.instance;
	}

	public getState(): Avatar2dState {
		return this.state;
	}

	public getIsSpeaking(): boolean {
		return this.isSpeaking;
	}

	public subscribe(listener: (state: Avatar2dState) => void): () => void {
		this.listeners.add(listener);
		listener(this.state);
		return () => this.listeners.delete(listener);
	}

	public subscribeSpeaking(listener: (isSpeaking: boolean) => void): () => void {
		this.speakingListeners.add(listener);
		listener(this.isSpeaking);
		return () => this.speakingListeners.delete(listener);
	}

	public getMouthParams(): { mouthOpenY: number; mouthForm: number } {
		return this.mouthParams;
	}

	public subscribeMouthParams(
		listener: (mouthOpenY: number, mouthForm: number) => void,
	): () => void {
		this.mouthListeners.add(listener);
		listener(this.mouthParams.mouthOpenY, this.mouthParams.mouthForm);
		return () => this.mouthListeners.delete(listener);
	}

	private notify(): void {
		for (const listener of this.listeners) {
			listener(this.state);
		}
	}

	private notifySpeaking(): void {
		for (const listener of this.speakingListeners) {
			listener(this.isSpeaking);
		}
	}

	private notifyMouth(): void {
		for (const listener of this.mouthListeners) {
			listener(this.mouthParams.mouthOpenY, this.mouthParams.mouthForm);
		}
	}

	private save(): void {
		if (typeof window !== 'undefined') {
			try {
				window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
			} catch {
				// Ignorar cuota
			}
		}
	}

	public setSpeaking(speaking: boolean, broadcast = true): void {
		if (this.isSpeaking === speaking) return;
		this.isSpeaking = speaking;
		this.notifySpeaking();
		if (broadcast) {
			this.broadcastChannel?.postMessage({ type: 'speaking', speaking });
		}
	}

	public setMouthParams(mouthOpenY: number, mouthForm: number, broadcast = true): void {
		if (this.mouthParams.mouthOpenY === mouthOpenY && this.mouthParams.mouthForm === mouthForm) {
			return;
		}
		this.mouthParams = { mouthOpenY, mouthForm };
		this.notifyMouth();
		if (broadcast) {
			this.broadcastChannel?.postMessage({
				type: 'mouth',
				mouthOpenY,
				mouthForm,
			});
		}
	}

	public setMode(mode: Avatar2dMode): void {
		this.state = { ...this.state, mode };
		this.save();
		this.notify();
		this.broadcastChannel?.postMessage({ type: 'mode', mode });
	}

	public setEmotion(emotion: string): void {
		this.state = {
			...this.state,
			pngtuber: {
				...this.state.pngtuber,
				activeEmotion: emotion,
			},
		};
		this.save();
		this.notify();
		try {
			this.broadcastChannel?.postMessage({ type: 'emotion', emotion });
		} catch {
			// Ignorar error si broadcast falla por límites de clonado
		}
	}

	public addCustomEmotion(
		label: string,
		idleImage: string,
		speakingImage?: string,
		blinkImage?: string,
	): PngTuberEmotion {
		const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
		const newEmotion: PngTuberEmotion = {
			id,
			label: label.trim(),
			idle: idleImage,
			speaking: speakingImage,
			blink: blinkImage,
		};
		const nextEmotions = [...this.state.pngtuber.emotions, newEmotion];
		this.state = {
			...this.state,
			pngtuber: {
				...this.state.pngtuber,
				emotions: nextEmotions,
			},
		};
		this.save();
		this.notify();
		try {
			this.broadcastChannel?.postMessage({
				type: 'emotions',
				emotions: nextEmotions,
			});
		} catch {
			// Ignorar error si broadcast falla por payload grande
		}
		return newEmotion;
	}

	public updateCustomEmotion(
		id: string,
		updates: Partial<Omit<PngTuberEmotion, 'id'>>,
	): PngTuberEmotion | null {
		const target = this.state.pngtuber.emotions.find((e) => e.id === id);
		if (!target) return null;

		const updatedEmotion: PngTuberEmotion = {
			...target,
			...updates,
			id: target.id,
			label: updates.label !== undefined ? updates.label.trim() : target.label,
		};

		const nextEmotions = this.state.pngtuber.emotions.map((e) =>
			e.id === id ? updatedEmotion : e,
		);

		this.state = {
			...this.state,
			pngtuber: {
				...this.state.pngtuber,
				emotions: nextEmotions,
			},
		};

		this.save();
		this.notify();

		try {
			this.broadcastChannel?.postMessage({
				type: 'emotions',
				emotions: nextEmotions,
			});
		} catch {
			// Ignorar error si broadcast falla
		}

		return updatedEmotion;
	}

	public updateEmotion(
		id: string,
		updates: Partial<Omit<PngTuberEmotion, 'id'>>,
	): PngTuberEmotion | null {
		return this.updateCustomEmotion(id, updates);
	}

	public deleteEmotion(id: string): boolean {
		const exists = this.state.pngtuber.emotions.some((e) => e.id === id);
		if (!exists) return false;

		const nextEmotions = this.state.pngtuber.emotions.filter((e) => e.id !== id);
		let nextActiveEmotion = this.state.pngtuber.activeEmotion;

		if (nextActiveEmotion === id) {
			const hasNeutral = nextEmotions.some((e) => e.id === 'neutral');
			nextActiveEmotion = hasNeutral ? 'neutral' : nextEmotions[0]?.id || 'neutral';
		}

		this.state = {
			...this.state,
			pngtuber: {
				...this.state.pngtuber,
				emotions: nextEmotions,
				activeEmotion: nextActiveEmotion,
			},
		};

		this.save();
		this.notify();

		try {
			this.broadcastChannel?.postMessage({
				type: 'emotions',
				emotions: nextEmotions,
			});
			this.broadcastChannel?.postMessage({
				type: 'emotion',
				emotion: nextActiveEmotion,
			});
		} catch {
			// Ignorar error de broadcast
		}

		return true;
	}

	public deleteCustomEmotion(id: string): boolean {
		return this.deleteEmotion(id);
	}

	public setTransform(transform: Avatar2dTransform, target: Avatar2dMode, broadcast = true): void {
		if (target === 'pngtuber') {
			this.state = {
				...this.state,
				pngtuber: {
					...this.state.pngtuber,
					transform,
				},
			};
		} else {
			this.state = {
				...this.state,
				live2d: {
					...this.state.live2d,
					transform,
				},
			};
		}
		this.save();
		this.notify();
		if (broadcast) {
			this.broadcastChannel?.postMessage({
				type: 'transform',
				transform,
				target,
			});
		}
	}

	public setPhysics(physics: PngTuberPhysics): void {
		this.state = {
			...this.state,
			pngtuber: {
				...this.state.pngtuber,
				physics,
			},
		};
		this.save();
		this.notify();
		this.broadcastChannel?.postMessage({ type: 'physics', physics });
	}

	public setLive2dModel(modelUrl: string | null, modelName?: string, broadcast = true): void {
		this.state = {
			...this.state,
			mode: 'live2d',
			live2d: {
				...this.state.live2d,
				modelUrl,
				modelName,
			},
		};
		this.save();
		this.notify();
		if (broadcast) {
			this.broadcastChannel?.postMessage({
				type: 'live2dModel',
				modelUrl,
				modelName,
			});
		}
	}

	public setEyeTracking(enabled: boolean, broadcast = true): void {
		if (this.state.live2d.eyeTracking === enabled) return;
		this.state = {
			...this.state,
			live2d: {
				...this.state.live2d,
				eyeTracking: enabled,
			},
		};
		this.save();
		this.notify();
		if (broadcast) {
			this.broadcastChannel?.postMessage({
				type: 'eyeTracking',
				enabled,
			});
		}
	}

	public toggleLive2dExpression(expression: string, broadcast = true): void {
		const currentList = this.state.live2d.activeExpressions || [];
		const isCurrentlyActive = currentList.includes(expression);
		const nextList = isCurrentlyActive
			? currentList.filter((id) => id !== expression)
			: [...currentList, expression];
		const nextActive = nextList.length > 0 ? nextList[nextList.length - 1] : null;

		this.state = {
			...this.state,
			live2d: {
				...this.state.live2d,
				activeExpression: nextActive,
				activeExpressions: nextList,
			},
		};
		this.save();
		this.notify();
		if (broadcast) {
			this.broadcastChannel?.postMessage({
				type: 'live2dExpression',
				expression: nextActive,
				expressions: nextList,
			});
		}
	}

	public setLive2dExpression(expression: string | null, broadcast = true): void {
		const nextExpressions = expression ? [expression] : [];
		if (
			this.state.live2d.activeExpression === expression &&
			JSON.stringify(this.state.live2d.activeExpressions || []) === JSON.stringify(nextExpressions)
		) {
			return;
		}
		this.state = {
			...this.state,
			live2d: {
				...this.state.live2d,
				activeExpression: expression,
				activeExpressions: nextExpressions,
			},
		};
		this.save();
		this.notify();
		if (broadcast) {
			this.broadcastChannel?.postMessage({
				type: 'live2dExpression',
				expression,
				expressions: nextExpressions,
			});
		}
	}

	public updateSprite(key: PngTuberSpriteKey, dataUrl: string): void {
		const nextSprites = {
			...this.state.pngtuber.sprites,
			[key]: dataUrl,
		};
		const nextEmotions = this.state.pngtuber.emotions.map((em) =>
			em.id === 'neutral'
				? {
						...em,
						[key]: dataUrl,
					}
				: em,
		);
		this.state = {
			...this.state,
			pngtuber: {
				...this.state.pngtuber,
				sprites: nextSprites,
				activeEmotion: 'neutral',
				emotions: nextEmotions,
			},
		};
		this.save();
		this.notify();
		this.broadcastChannel?.postMessage({
			type: 'sprites',
			sprites: nextSprites,
		});
		this.broadcastChannel?.postMessage({
			type: 'emotion',
			emotion: 'neutral',
		});
	}

	public resetDefaultSprites(): void {
		this.state = {
			...this.state,
			pngtuber: {
				...this.state.pngtuber,
				sprites: DEFAULT_SANDY_SPRITES,
				activeEmotion: 'neutral',
				emotions: DEFAULT_SANDY_EMOTIONS,
			},
		};
		this.save();
		this.notify();
		this.broadcastChannel?.postMessage({
			type: 'sprites',
			sprites: DEFAULT_SANDY_SPRITES,
		});
	}

	public requestSync(): void {
		if (this.broadcastChannel) {
			this.broadcastChannel.postMessage({ type: 'requestState' });
		}
	}

	private handleSyncMessage(msg: Avatar2dSyncMessage): void {
		switch (msg.type) {
			case 'speaking':
				this.isSpeaking = msg.speaking;
				this.notifySpeaking();
				break;
			case 'emotion':
				this.state = {
					...this.state,
					pngtuber: {
						...this.state.pngtuber,
						activeEmotion: msg.emotion,
					},
				};
				this.notify();
				break;
			case 'emotions':
				this.state = {
					...this.state,
					pngtuber: {
						...this.state.pngtuber,
						emotions: msg.emotions,
					},
				};
				this.notify();
				break;
			case 'mode':
				this.state = { ...this.state, mode: msg.mode };
				this.notify();
				break;
			case 'transform':
				if (msg.target === 'pngtuber') {
					this.state = {
						...this.state,
						pngtuber: { ...this.state.pngtuber, transform: msg.transform },
					};
				} else {
					this.state = {
						...this.state,
						live2d: { ...this.state.live2d, transform: msg.transform },
					};
				}
				this.notify();
				break;
			case 'physics':
				this.state = {
					...this.state,
					pngtuber: { ...this.state.pngtuber, physics: msg.physics },
				};
				this.notify();
				break;
			case 'sprites':
				this.state = {
					...this.state,
					pngtuber: { ...this.state.pngtuber, sprites: msg.sprites },
				};
				this.notify();
				break;
			case 'live2dModel':
				this.state = {
					...this.state,
					mode: 'live2d',
					live2d: {
						...this.state.live2d,
						modelUrl: msg.modelUrl,
						modelName: msg.modelName,
					},
				};
				this.notify();
				break;
			case 'requestState':
				this.broadcastChannel?.postMessage({
					type: 'fullState',
					state: this.state,
				});
				break;
			case 'mouth':
				this.mouthParams = { mouthOpenY: msg.mouthOpenY, mouthForm: msg.mouthForm };
				this.notifyMouth();
				break;
			case 'eyeTracking':
				this.state = {
					...this.state,
					live2d: {
						...this.state.live2d,
						eyeTracking: msg.enabled,
					},
				};
				this.notify();
				break;
			case 'live2dExpression': {
				const nextExpressions = msg.expressions ?? (msg.expression ? [msg.expression] : []);
				this.state = {
					...this.state,
					live2d: {
						...this.state.live2d,
						activeExpression: msg.expression,
						activeExpressions: nextExpressions,
					},
				};
				this.notify();
				break;
			}
			case 'fullState':
				this.state = msg.state;
				this.save();
				this.notify();
				break;
		}
	}
}

export const avatar2dManager = Avatar2dManager.getInstance();
