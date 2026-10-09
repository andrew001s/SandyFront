export type LipSyncClock = () => number;

export interface LipSyncHandlerObject {
	prepare?: (audioBlob: Blob) => Promise<void>;
	start: (audioBlob: Blob, clock?: LipSyncClock) => Promise<void> | void;
	stop?: () => void;
}

export type LipSyncHandler =
	| LipSyncHandlerObject
	| ((audioBlob: Blob, clock?: LipSyncClock) => Promise<void> | void);

export class AudioQueueManager {
	private static instance: AudioQueueManager;
	private queue: { blob: Blob; url: string }[] = [];
	private isPlaying = false;
	private audioElement: HTMLAudioElement | null = null;
	// Huella del contenido -> instante en que se encoló. `URL.createObjectURL`
	// devuelve una URL distinta en cada llamada, incluso para el mismo blob, así
	// que deduplicar por URL no filtraba nada: el mismo audio podía sonar dos
	// veces. La ventana evita descartar una frase legítimamente repetida más
	// tarde en la conversación.
	private recentAudio = new Map<string, number>();
	private static readonly DEDUPE_WINDOW_MS = 30_000;
	private callbacks: Set<(isPlaying: boolean) => void> = new Set();
	/** Manejador de Lip Sync con soporte de preparación sin retraso y reloj de alta resolución. */
	private lipSyncHandler: LipSyncHandler | null = null;

	private constructor() {}

	static getInstance(): AudioQueueManager {
		if (!AudioQueueManager.instance) {
			AudioQueueManager.instance = new AudioQueueManager();
		}
		return AudioQueueManager.instance;
	}

	setAudioElement(element: HTMLAudioElement | null) {
		this.audioElement = element;
		if (element) {
			element.onended = () => {
				if (element.src) {
					URL.revokeObjectURL(element.src);
				}
				if (
					this.lipSyncHandler &&
					typeof this.lipSyncHandler === 'object' &&
					this.lipSyncHandler.stop
				) {
					this.lipSyncHandler.stop();
				}
				this.isPlaying = false;
				this.notifyStateChange();
				void this.playNext();
			};

			// If audio arrived before the player mounted, resume playback now.
			if (!this.isPlaying && this.queue.length > 0) {
				void this.playNext();
			}
		}
	}

	setLipSyncHandler(handler: LipSyncHandler | null) {
		this.lipSyncHandler = handler;
	}

	subscribe(callback: (isPlaying: boolean) => void) {
		this.callbacks.add(callback);
		return () => {
			this.callbacks.delete(callback);
		};
	}

	private notifyStateChange() {
		for (const callback of this.callbacks) {
			callback(this.isPlaying);
		}
	}

	/** Identifica el audio por su contenido, no por su URL. */
	private async fingerprint(blob: Blob): Promise<string> {
		try {
			const buffer = await blob.arrayBuffer();
			const digest = await crypto.subtle.digest('SHA-256', buffer);
			return Array.from(new Uint8Array(digest))
				.map((byte) => byte.toString(16).padStart(2, '0'))
				.join('');
		} catch {
			// Sin contexto seguro no hay crypto.subtle: tamaño y tipo son una
			// aproximación pobre, pero mejor que no filtrar nada.
			return `${blob.size}:${blob.type}`;
		}
	}

	private isDuplicate(key: string): boolean {
		const now = Date.now();
		for (const [previous, at] of this.recentAudio) {
			if (now - at > AudioQueueManager.DEDUPE_WINDOW_MS) {
				this.recentAudio.delete(previous);
			}
		}
		if (this.recentAudio.has(key)) {
			return true;
		}
		this.recentAudio.set(key, now);
		return false;
	}

	async addToQueue(audioBlob: Blob) {
		const key = await this.fingerprint(audioBlob);
		if (this.isDuplicate(key)) {
			return;
		}

		// La URL se crea después del filtro: crearla antes dejaba un objeto
		// colgado por cada duplicado descartado.
		const audioUrl = URL.createObjectURL(audioBlob);
		this.queue.push({ blob: audioBlob, url: audioUrl });
		if (!this.isPlaying) {
			await this.playNext();
		}
	}

	private async playNext() {
		if (this.queue.length > 0 && !this.isPlaying && this.audioElement) {
			this.isPlaying = true;
			this.notifyStateChange();
			const nextAudio = this.queue.shift();
			if (nextAudio) {
				this.audioElement.src = nextAudio.url;

				// 1. Predecodificar / precalcular frames de lip-sync ANTES de iniciar reproducción
				// para garantizar 0 ms de retraso en la apertura de la boca
				if (
					this.lipSyncHandler &&
					typeof this.lipSyncHandler === 'object' &&
					this.lipSyncHandler.prepare
				) {
					try {
						await this.lipSyncHandler.prepare(nextAudio.blob);
					} catch {
						// Continuar con reproducción si la preparación falla
					}
				}

				// 2. Reloj continuo de alta resolución a 60 FPS
				// (evita desfases y micro-congelamientos por los saltos de ~200ms de currentTime)
				let lastMediaTime = 0;
				let lastSyncTime = performance.now();
				const getHighResClock = (): number => {
					const element = this.audioElement;
					if (!element) return 0;
					const now = performance.now();
					const mediaTime = element.currentTime;
					if (mediaTime !== lastMediaTime) {
						lastMediaTime = mediaTime;
						lastSyncTime = now;
						return mediaTime;
					}
					return Math.max(0, lastMediaTime + (now - lastSyncTime) / 1000);
				};

				this.audioElement.onplay = () => {
					lastMediaTime = this.audioElement?.currentTime ?? 0;
					lastSyncTime = performance.now();
					const handler = this.lipSyncHandler;
					if (typeof handler === 'object' && handler?.start) {
						void handler.start(nextAudio.blob, getHighResClock);
					} else if (typeof handler === 'function') {
						void handler(nextAudio.blob, getHighResClock);
					}
				};

				try {
					await this.audioElement.play();
				} catch (error) {
					console.error('Error reproduciendo audio:', error);
					this.isPlaying = false;
					URL.revokeObjectURL(nextAudio.url);
					this.notifyStateChange();
					await this.playNext();
				}
			}
		}
	}

	clearQueue() {
		for (const audio of this.queue) {
			URL.revokeObjectURL(audio.url);
		}
		this.queue = [];
		this.recentAudio.clear();
		if (
			this.lipSyncHandler &&
			typeof this.lipSyncHandler === 'object' &&
			this.lipSyncHandler.stop
		) {
			this.lipSyncHandler.stop();
		}
		if (this.audioElement) {
			this.audioElement.pause();
			this.audioElement.onplay = null;
			if (this.audioElement.src) {
				URL.revokeObjectURL(this.audioElement.src);
			}
			this.audioElement.src = '';
		}
		this.isPlaying = false;
		this.notifyStateChange();
	}
}
