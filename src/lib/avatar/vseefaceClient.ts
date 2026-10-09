import { VMC_BRIDGE_PORT, VRM_EMOTIONS } from '@/lib/avatar/constants';
import type { AvatarConnectionStats, SoftwareConfig } from '@/types/avatar';

const DEFAULT_TRANSITION_DURATION_MS = 120;

export class VSeeFaceClient {
	private isConnected = false;
	private isConnecting = false;
	private lastError: string | null = null;
	private port = 39539;
	private host = '127.0.0.1';
	private transitionDurationMs = DEFAULT_TRANSITION_DURATION_MS;

	private bridgeWs: WebSocket | null = null;
	private stats: AvatarConnectionStats = {
		packetsSent: 0,
		lastPingMs: null,
		connectedAt: '',
	};

	private listeners = new Set<() => void>();

	// Estado actual de blendshapes interpolados (nombre -> valor actual)
	private currentBlendshapes = new Map<string, number>();
	// Valores objetivos para interpolar (nombre -> valor objetivo)
	private targetBlendshapes = new Map<string, number>();
	// Tiempos de inicio para la interpolación (nombre -> timestamp inicio)
	private startBlendshapes = new Map<string, { startVal: number; startTime: number }>();
	private animFrameId: number | null = null;

	// In-flight coalescing para el fallback HTTP
	private isHttpSending = false;
	private pendingHttpPayload: Array<{ name: string; value: number }> | null = null;

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

	public async connect(config?: Partial<SoftwareConfig>): Promise<void> {
		this.disconnect();
		this.isConnecting = true;
		this.lastError = null;
		this.port = config?.port ?? 39539;
		this.host = config?.host ?? '127.0.0.1';
		this.transitionDurationMs = config?.transitionDurationMs ?? DEFAULT_TRANSITION_DURATION_MS;
		this.notify();

		try {
			// 1. Probar puente WebSocket local de ultrabaja latencia
			await this.initBridgeWebSocket();

			this.isConnected = true;
			this.isConnecting = false;
			this.stats = {
				packetsSent: 0,
				lastPingMs: null,
				connectedAt: new Date().toISOString(),
			};
			this.notify();
		} catch {
			// Fallback: verificar API HTTP de VMC
			try {
				const res = await fetch('/api/avatar/vmc', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						ping: true,
						host: this.host,
						port: this.port,
					}),
				});
				if (!res.ok) {
					throw new Error('No se pudo verificar el puerto VMC de VSeeFace');
				}
				this.isConnected = true;
				this.isConnecting = false;
				this.stats = {
					packetsSent: 0,
					lastPingMs: null,
					connectedAt: new Date().toISOString(),
				};
				this.notify();
			} catch (err) {
				this.isConnected = false;
				this.isConnecting = false;
				this.lastError =
					err instanceof Error
						? err.message
						: 'No se pudo conectar a VSeeFace. Verifica que esté abierto con VMC Receiver.';
				this.notify();
				throw err;
			}
		}
	}

	private initBridgeWebSocket(): Promise<void> {
		return new Promise((resolve, reject) => {
			const wsUrl = `ws://127.0.0.1:${VMC_BRIDGE_PORT}`;
			try {
				const ws = new WebSocket(wsUrl);
				let timeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
					ws.close();
					reject(new Error('Timeout de puente local'));
				}, 1500);

				ws.onopen = () => {
					if (timeout) {
						clearTimeout(timeout);
						timeout = null;
					}
					this.bridgeWs = ws;
					resolve();
				};

				ws.onerror = () => {
					if (timeout) {
						clearTimeout(timeout);
						timeout = null;
					}
					reject(new Error('Puente local WS no disponible'));
				};

				ws.onclose = () => {
					this.bridgeWs = null;
					if (this.isConnected) {
						setTimeout(() => {
							if (this.isConnected && !this.bridgeWs) {
								void this.initBridgeWebSocket().catch(() => {
									// Silencioso si el puente aún no está listo
								});
							}
						}, 2000);
					}
				};
			} catch (err) {
				reject(err);
			}
		});
	}

	public disconnect(): void {
		this.isConnected = false;
		this.isConnecting = false;
		if (this.bridgeWs) {
			try {
				this.bridgeWs.close();
			} catch {
				// Ignorar
			}
			this.bridgeWs = null;
		}
		if (this.animFrameId !== null) {
			cancelAnimationFrame(this.animFrameId);
			this.animFrameId = null;
		}
		void this.injectVrmVowels({ A: 0, I: 0, U: 0, E: 0, O: 0 });
		this.notify();
	}

	/**
	 * Activa una emoción VRM (VRM 0.x y VRM 1.0) con transición suave personalizable.
	 */
	public async setEmotion(emotionId: string, intensity = 1.0): Promise<void> {
		const preset = VRM_EMOTIONS.find((e) => e.id === emotionId);
		const blendshapes: Record<string, number> = {};

		if (preset) {
			for (const [key, val] of Object.entries(preset.vrm0Blendshapes)) {
				blendshapes[key] = val * intensity;
			}
			for (const [key, val] of Object.entries(preset.vrm1Blendshapes)) {
				blendshapes[key] = val * intensity;
			}
		} else {
			blendshapes[emotionId] = intensity;
		}

		this.interpolateBlendshapes(blendshapes);
	}

	/**
	 * Restablece todas las emociones a 0 (rostro neutro).
	 */
	public async resetEmotions(): Promise<void> {
		const resetMap: Record<string, number> = {};
		for (const preset of VRM_EMOTIONS) {
			for (const key of Object.keys(preset.vrm0Blendshapes)) {
				resetMap[key] = 0;
			}
			for (const key of Object.keys(preset.vrm1Blendshapes)) {
				resetMap[key] = 0;
			}
		}
		this.interpolateBlendshapes(resetMap);
	}

	/**
	 * Inyecta un blendshape personalizado directo (ej. SandyLipOpen o Blink).
	 */
	public async setCustomBlendshape(name: string, value: number): Promise<void> {
		const map: Record<string, number> = { [name]: value };
		if (this.transitionDurationMs <= 0) {
			await this.sendBlendshapesBatch([{ name, value }]);
		} else {
			this.interpolateBlendshapes(map);
		}
	}

	/**
	 * Inyección de fonemas de boca (apertura y sonrisa) para lip-sync en tiempo real.
	 * Se envía de forma directa e inmediata para máxima reactividad.
	 */
	public async injectMouth(open: number, smile: number): Promise<void> {
		const batch: Array<{ name: string; value: number }> = [
			// VRM 0.x (A = abierto, Joy = sonrisa)
			{ name: 'A', value: open },
			{ name: 'Joy', value: smile },
			// VRM 1.0 (aa = abierto, happy = sonrisa)
			{ name: 'aa', value: open },
			{ name: 'happy', value: smile },
		];
		await this.sendBlendshapesBatch(batch);
	}

	/**
	 * Inyección de vocales estándar VRM (A, I, U, E, O) para lip-sync fonético realista.
	 * Envía las 5 vocales en formatos VRM 0.x y VRM 1.0 atómicamente.
	 */
	public async injectVrmVowels(vowels: {
		A: number;
		I: number;
		U: number;
		E: number;
		O: number;
	}): Promise<void> {
		const batch: Array<{ name: string; value: number }> = [
			// VRM 0.x
			{ name: 'A', value: vowels.A },
			{ name: 'I', value: vowels.I },
			{ name: 'U', value: vowels.U },
			{ name: 'E', value: vowels.E },
			{ name: 'O', value: vowels.O },
			// VRM 1.0
			{ name: 'aa', value: vowels.A },
			{ name: 'ih', value: vowels.I },
			{ name: 'ou', value: vowels.U },
			{ name: 'ee', value: vowels.E },
			{ name: 'oh', value: vowels.O },
		];
		await this.sendBlendshapesBatch(batch);
	}

	/**
	 * Procesa los payloads emitidos por el backend cuando la IA responde con texto y emociones.
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
			wink: 'blink',
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

	/**
	 * Interpolador a 60 FPS con curva Ease-Out y duración configurable (ms).
	 */
	private interpolateBlendshapes(targets: Record<string, number>): void {
		const duration = this.transitionDurationMs;
		const now = performance.now();

		if (duration <= 0) {
			const batch: Array<{ name: string; value: number }> = [];
			for (const [name, val] of Object.entries(targets)) {
				this.currentBlendshapes.set(name, val);
				this.targetBlendshapes.set(name, val);
				batch.push({ name, value: val });
			}
			void this.sendBlendshapesBatch(batch);
			return;
		}

		for (const [name, targetVal] of Object.entries(targets)) {
			const currentVal = this.currentBlendshapes.get(name) ?? 0;
			this.targetBlendshapes.set(name, targetVal);
			this.startBlendshapes.set(name, {
				startVal: currentVal,
				startTime: now,
			});
		}

		if (this.animFrameId === null) {
			this.runAnimationLoop();
		}
	}

	private runAnimationLoop(): void {
		const loop = () => {
			const now = performance.now();
			const duration = this.transitionDurationMs;
			let isAnyActive = false;
			const batch: Array<{ name: string; value: number }> = [];

			for (const [name, targetVal] of this.targetBlendshapes.entries()) {
				const startInfo = this.startBlendshapes.get(name);
				if (!startInfo) continue;

				const elapsed = now - startInfo.startTime;
				if (elapsed >= duration) {
					this.currentBlendshapes.set(name, targetVal);
					this.startBlendshapes.delete(name);
					batch.push({ name, value: targetVal });
				} else {
					isAnyActive = true;
					// Curva Ease-Out: 1 - (1 - t)^2
					const t = elapsed / duration;
					const ease = 1 - (1 - t) * (1 - t);
					const currentVal = startInfo.startVal + (targetVal - startInfo.startVal) * ease;
					this.currentBlendshapes.set(name, currentVal);
					batch.push({ name, value: currentVal });
				}
			}

			if (batch.length > 0) {
				void this.sendBlendshapesBatch(batch);
			}

			if (isAnyActive) {
				this.animFrameId = requestAnimationFrame(loop);
			} else {
				this.animFrameId = null;
			}
		};

		this.animFrameId = requestAnimationFrame(loop);
	}

	/**
	 * Envía el lote de blendshapes vía el puente WebSocket local (< 1ms)
	 * o por el fallback HTTP coalescente.
	 */
	public async sendBlendshapesBatch(
		blendshapes: Array<{ name: string; value: number }>,
	): Promise<void> {
		if (blendshapes.length === 0) return;

		// 1. Puente local WS (Prioritario, latencia ~1ms)
		if (this.bridgeWs && this.bridgeWs.readyState === WebSocket.OPEN) {
			try {
				this.bridgeWs.send(
					JSON.stringify({
						host: this.host,
						port: this.port,
						blendshapes,
						apply: true,
					}),
				);
				this.stats.packetsSent += 1;
				return;
			} catch {
				// Fallback a HTTP
			}
		}

		// 2. Fallback HTTP coalescente (máximo 1 fetch simultáneo)
		if (this.isHttpSending) {
			this.pendingHttpPayload = blendshapes;
			return;
		}

		this.isHttpSending = true;
		try {
			await fetch('/api/avatar/vmc', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					host: this.host,
					port: this.port,
					blendshapes,
					apply: true,
				}),
			});
			this.stats.packetsSent += 1;
		} catch {
			// Ignorar error transitorio en fallback
		} finally {
			this.isHttpSending = false;
			if (this.pendingHttpPayload) {
				const nextPayload = this.pendingHttpPayload;
				this.pendingHttpPayload = null;
				void this.sendBlendshapesBatch(nextPayload);
			}
		}
	}
}

export const vseefaceClient = new VSeeFaceClient();
