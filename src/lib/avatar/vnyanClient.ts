import { VRM_EMOTIONS } from '@/lib/avatar/constants';
import type { AvatarConnectionStats, SoftwareConfig } from '@/types/avatar';

const DEFAULT_TRANSITION_DURATION_MS = 120;

export class VNyanClient {
	private isConnected = false;
	private isConnecting = false;
	private lastError: string | null = null;
	private port = 8000;
	private host = '127.0.0.1';
	private transitionDurationMs = DEFAULT_TRANSITION_DURATION_MS;

	private ws: WebSocket | null = null;
	private pingInterval: ReturnType<typeof setInterval> | null = null;
	private stats: AvatarConnectionStats = {
		packetsSent: 0,
		lastPingMs: null,
		connectedAt: '',
	};

	private listeners = new Set<() => void>();

	public subscribe(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}

	private notify(): void {
		for (const listener of this.listeners) {
			listener();
		}
	}

	public getState() {
		return {
			connected: this.isConnected,
			connecting: this.isConnecting,
			error: this.lastError,
			port: this.port,
			host: this.host,
			transitionDurationMs: this.transitionDurationMs,
			stats: this.stats,
		};
	}

	public setTransitionDuration(ms: number): void {
		this.transitionDurationMs = Math.max(0, Math.min(1000, ms));
	}

	public getTransitionDuration(): number {
		return this.transitionDurationMs;
	}

	public connect(config?: Partial<SoftwareConfig>): Promise<void> {
		this.disconnect();
		this.isConnecting = true;
		this.lastError = null;
		this.port = config?.port ?? 8000;
		this.host = config?.host ?? '127.0.0.1';
		this.transitionDurationMs = config?.transitionDurationMs ?? DEFAULT_TRANSITION_DURATION_MS;
		this.notify();

		return new Promise((resolve, reject) => {
			const wsUrl = `ws://${this.host}:${this.port}/vnyan`;

			try {
				const socket = new WebSocket(wsUrl);
				let timeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
					socket.close();
					const err = new Error(
						`Tiempo de espera agotado al conectar a VNyan en ${wsUrl}. Verifica que VNyan esté abierto y que WebSockets esté activado.`,
					);
					this.lastError = err.message;
					this.isConnected = false;
					this.isConnecting = false;
					this.notify();
					reject(err);
				}, 4000);

				socket.onopen = () => {
					if (timeout) {
						clearTimeout(timeout);
						timeout = null;
					}
					this.ws = socket;
					this.isConnected = true;
					this.isConnecting = false;
					this.lastError = null;
					this.stats = {
						packetsSent: 0,
						lastPingMs: null,
						connectedAt: new Date().toISOString(),
					};
					this.startHeartbeat();
					this.notify();
					resolve();
				};

				socket.onerror = () => {
					if (timeout) {
						clearTimeout(timeout);
						timeout = null;
					}
					const err = new Error(
						`No se pudo conectar a VNyan en ws://${this.host}:${this.port}/vnyan. Abre VNyan ➔ Settings ➔ Misc ➔ WebSockets y activa 'Start Receiver'.`,
					);
					this.lastError = err.message;
					this.isConnected = false;
					this.isConnecting = false;
					this.notify();
					reject(err);
				};

				socket.onclose = () => {
					this.cleanup();
					this.notify();
				};
			} catch (err) {
				const errMsg =
					err instanceof Error
						? err.message
						: 'Error al inicializar la conexión WebSocket con VNyan.';
				this.lastError = errMsg;
				this.isConnected = false;
				this.isConnecting = false;
				this.notify();
				reject(new Error(errMsg));
			}
		});
	}

	public disconnect(): void {
		this.cleanup();
		this.notify();
	}

	private cleanup(): void {
		this.isConnected = false;
		this.isConnecting = false;
		if (this.pingInterval) {
			clearInterval(this.pingInterval);
			this.pingInterval = null;
		}
		if (this.ws) {
			try {
				this.ws.close();
			} catch {
				// Ignorar
			}
			this.ws = null;
		}
	}

	private startHeartbeat(): void {
		if (this.pingInterval) clearInterval(this.pingInterval);
		this.pingInterval = setInterval(() => {
			if (this.ws && this.ws.readyState === WebSocket.OPEN) {
				const pingStart = performance.now();
				try {
					this.ws.send(JSON.stringify({ type: 'ping', timestamp: pingStart }));
					this.stats.lastPingMs = Math.round(performance.now() - pingStart);
				} catch {
					// Ignorar fallo de ping
				}
			}
		}, 15000);
	}

	/**
	 * Envía un mensaje raw por WebSocket a VNyan.
	 */
	private send(data: Record<string, unknown> | string): void {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
		try {
			const payload = typeof data === 'string' ? data : JSON.stringify(data);
			this.ws.send(payload);
			this.stats.packetsSent += 1;
		} catch {
			// Ignorar fallo de envío transitorio
		}
	}

	/**
	 * Activa una emoción VRM (Joy, Angry, Sorrow, Fun, Surprised, Neutral)
	 * transmitiendo tanto el evento estructurado JSON como el trigger textual
	 * para máxima compatibilidad con el sistema de nodos de VNyan.
	 */
	public async setEmotion(emotionId: string, intensity = 1.0): Promise<void> {
		const preset = VRM_EMOTIONS.find((e) => e.id === emotionId);
		const targetName = preset?.name || emotionId;

		// 1. Enviar evento JSON estructurado
		this.send({
			type: 'expression',
			action: 'setEmotion',
			emotion: emotionId,
			name: targetName,
			intensity: Math.min(1, Math.max(0, intensity)),
			vrm0: preset?.vrm0Blendshapes ?? {},
			vrm1: preset?.vrm1Blendshapes ?? {},
		});

		// 2. Disparar trigger estándar de VNyan (Node Graph WebSockets)
		this.send(`Trigger_${emotionId}`);
		this.send(`Expression_${targetName}`);
	}

	/**
	 * Restablece todas las emociones al estado neutro.
	 */
	public async resetEmotions(): Promise<void> {
		this.send({
			type: 'expression',
			action: 'reset',
			emotion: 'neutral',
		});
		this.send('ResetExpressions');
		this.send('Trigger_neutral');
	}

	/**
	 * Inyecta parámetros de apertura y forma de boca para Lip Sync.
	 */
	public async injectMouth(open: number, smile = 0): Promise<void> {
		this.send({
			type: 'lipsync',
			action: 'mouth',
			open: Math.min(1, Math.max(0, open)),
			smile: Math.min(1, Math.max(0, smile)),
		});
	}

	/**
	 * Transmite fonemas de vocales VRM (A, I, U, E, O) a VNyan a 60 FPS.
	 */
	public async injectVrmVowels(vowels: {
		A?: number;
		I?: number;
		U?: number;
		E?: number;
		O?: number;
	}): Promise<void> {
		this.send({
			type: 'lipsync',
			action: 'vowels',
			A: vowels.A ?? 0,
			I: vowels.I ?? 0,
			U: vowels.U ?? 0,
			E: vowels.E ?? 0,
			O: vowels.O ?? 0,
		});
	}

	/**
	 * Dispara un fonema de prueba de vocal directa por un tiempo determinado.
	 */
	public playVowelGesture(vowel: 'A' | 'E' | 'I' | 'O' | 'U', durationMs = 600): () => void {
		const vowels = { A: 0, I: 0, U: 0, E: 0, O: 0 };
		vowels[vowel] = 1.0;
		void this.injectVrmVowels(vowels);

		const timer = setTimeout(() => {
			void this.injectVrmVowels({ A: 0, I: 0, U: 0, E: 0, O: 0 });
		}, durationMs);

		return () => {
			clearTimeout(timer);
			void this.injectVrmVowels({ A: 0, I: 0, U: 0, E: 0, O: 0 });
		};
	}

	/**
	 * Procesa payloads de IA y chat (happy, angry, sad, etc.).
	 */
	public async sendAvatarPayload(payload: {
		type?: string;
		emotion?: string;
		intensity?: number;
	}): Promise<boolean> {
		const rawEmotion = String(payload.emotion ?? '').toLowerCase();
		const intensity = Math.min(1, Math.max(0, payload.intensity ?? 1.0));

		const emotionMap: Record<string, string> = {
			happy: 'joy',
			smile: 'joy',
			joy: 'joy',
			angry: 'angry',
			mad: 'angry',
			sad: 'sorrow',
			sorrow: 'sorrow',
			crying: 'sorrow',
			excited: 'fun',
			fun: 'fun',
			surprised: 'surprised',
			shocked: 'surprised',
			neutral: 'neutral',
		};

		const matched = emotionMap[rawEmotion];
		if (matched) {
			if (matched === 'neutral') {
				await this.resetEmotions();
			} else {
				await this.setEmotion(matched, intensity);
			}
			return true;
		}

		return false;
	}
}

export const vnyanClient = new VNyanClient();
