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
	private vowelAnimId: number | null = null;

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
			const preferredHost =
				typeof window !== 'undefined' && window.location.hostname
					? window.location.hostname
					: '127.0.0.1';

			const tryConnect = (host: string, isRetry = false) => {
				const wsUrl = `ws://${host}:${VMC_BRIDGE_PORT}`;
				let ws: WebSocket;
				try {
					ws = new WebSocket(wsUrl);
				} catch (err) {
					if (!isRetry && host !== '127.0.0.1') {
						tryConnect('127.0.0.1', true);
						return;
					}
					reject(err);
					return;
				}

				let timeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
					try {
						ws.close();
					} catch {
						// Ignorar
					}
					if (!isRetry && host !== '127.0.0.1') {
						tryConnect('127.0.0.1', true);
					} else {
						reject(new Error('Timeout de puente local'));
					}
				}, 1200);

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
					try {
						ws.close();
					} catch {
						// Ignorar
					}
					if (!isRetry && host !== '127.0.0.1') {
						tryConnect('127.0.0.1', true);
					} else {
						reject(new Error('Puente local WS no disponible'));
					}
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
			};

			tryConnect(preferredHost);
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
		if (this.vowelAnimId !== null) {
			cancelAnimationFrame(this.vowelAnimId);
			this.vowelAnimId = null;
		}
		void this.injectVrmVowels({ A: 0, I: 0, U: 0, E: 0, O: 0 });
		this.notify();
	}

	/**
	 * Activa una emoción VRM (VRM 0.x y VRM 1.0) con transición suave personalizable.
	 */
	public async setEmotion(emotionId: string, intensity = 1.0, durationMs?: number): Promise<void> {
		if (typeof durationMs === 'number') {
			this.transitionDurationMs = Math.max(0, Math.min(1000, durationMs));
		}
		const preset = VRM_EMOTIONS.find((e) => e.id === emotionId);
		const blendshapes: Record<string, number> = {};

		// 1. Primero poner a 0 todas las emociones anteriores para evitar que se solapen o queden trabadas
		for (const p of VRM_EMOTIONS) {
			if (p.id === 'neutral') continue;
			for (const key of Object.keys(p.vrm0Blendshapes)) {
				blendshapes[key] = 0;
			}
			for (const key of Object.keys(p.vrm1Blendshapes)) {
				blendshapes[key] = 0;
			}
		}

		// 2. Si es neutral, aplicar reseteo
		if (emotionId === 'neutral') {
			this.interpolateBlendshapes(blendshapes);
			return;
		}

		// 3. Aplicar la nueva emoción deseada
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
	public async resetEmotions(durationMs?: number): Promise<void> {
		if (typeof durationMs === 'number') {
			this.transitionDurationMs = Math.max(0, Math.min(1000, durationMs));
		}
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
			// VRM 0.x (Clips estándar universales)
			{ name: 'A', value: vowels.A },
			{ name: 'I', value: vowels.I },
			{ name: 'U', value: vowels.U },
			{ name: 'E', value: vowels.E },
			{ name: 'O', value: vowels.O },
			// VRM 1.0 (Presets estándar UniVRM 1.0)
			{ name: 'aa', value: vowels.A },
			{ name: 'ih', value: vowels.I },
			{ name: 'ou', value: vowels.U },
			{ name: 'ee', value: vowels.E },
			{ name: 'oh', value: vowels.O },
			// VRoid Studio Face Mesh Shape Keys (Face.baked / Face)
			{ name: 'Fcl_MTH_A', value: vowels.A },
			{ name: 'Fcl_MTH_I', value: vowels.I },
			{ name: 'Fcl_MTH_U', value: vowels.U },
			{ name: 'Fcl_MTH_E', value: vowels.E },
			{ name: 'Fcl_MTH_O', value: vowels.O },
			// Minúsculas estándar
			{ name: 'a', value: vowels.A },
			{ name: 'i', value: vowels.I },
			{ name: 'u', value: vowels.U },
			{ name: 'e', value: vowels.E },
			{ name: 'o', value: vowels.O },
		];
		await this.sendBlendshapesBatch(batch);
	}

	/**
	 * Reproduce un gesto fluido y continuo de vocal a 60 FPS (apertura, sostén y cierre natural).
	 * Al transmitir continuamente a 60 Hz durante toda la duración, evita que VSeeFace
	 * decaiga bruscamente o dispare animaciones lentas secundarias por timeout de VMC.
	 */
	public playVowelGesture(vowel: 'A' | 'E' | 'I' | 'O' | 'U', durationMs = 600): () => void {
		if (this.vowelAnimId !== null) {
			cancelAnimationFrame(this.vowelAnimId);
			this.vowelAnimId = null;
		}

		const startTime = performance.now();
		let isCancelled = false;

		const loop = () => {
			if (isCancelled) return;

			const now = performance.now();
			const elapsed = now - startTime;
			const t = Math.min(1.0, elapsed / durationMs);

			// Curva natural de articulación fonética:
			// 0% a 25%: Ataque suave (Ease-Out)
			// 25% a 65%: Sostén nítido en 1.0
			// 65% a 100%: Cierre fluido (Ease-In)
			let weight = 0;
			if (t < 0.25) {
				const p = t / 0.25;
				weight = Math.sin((p * Math.PI) / 2);
			} else if (t <= 0.65) {
				weight = 1.0;
			} else {
				const p = (t - 0.65) / 0.35;
				weight = 1.0 - Math.sin((p * Math.PI) / 2);
			}

			weight = Math.max(0, Math.min(1.0, weight));

			const targetVowels = {
				A: vowel === 'A' ? weight : 0,
				E: vowel === 'E' ? weight : 0,
				I: vowel === 'I' ? weight : 0,
				O: vowel === 'O' ? weight : 0,
				U: vowel === 'U' ? weight : 0,
			};

			void this.injectVrmVowels(targetVowels);

			if (t < 1.0) {
				this.vowelAnimId = requestAnimationFrame(loop);
			} else {
				this.vowelAnimId = null;
				void this.injectVrmVowels({ A: 0, I: 0, U: 0, E: 0, O: 0 });
			}
		};

		this.vowelAnimId = requestAnimationFrame(loop);

		return () => {
			isCancelled = true;
			if (this.vowelAnimId !== null) {
				cancelAnimationFrame(this.vowelAnimId);
				this.vowelAnimId = null;
			}
			void this.injectVrmVowels({ A: 0, I: 0, U: 0, E: 0, O: 0 });
		};
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
			excited: 'excited',
			fun: 'fun',
			surprised: 'surprised',
			shocked: 'surprised',
			thinking: 'thinking',
			confused: 'confused',
			sleepy: 'sleepy',
			tired: 'sleepy',
			shy: 'shy',
			smug: 'smug',
			wink: 'blink',
			wink_l: 'wink_l',
			wink_r: 'wink_r',
			blink: 'blink',
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
	 * Incluye vía rápida inmediata (<1ms) para tiempos de transición <= 40ms.
	 */
	private interpolateBlendshapes(targets: Record<string, number>): void {
		const duration = this.transitionDurationMs;
		const now = performance.now();

		// Si el tiempo de transición es instantáneo o muy bajo (<= 40 ms),
		// aplicar de inmediato en un único lote sin sobrecarga de bucle requestAnimationFrame.
		if (duration <= 40) {
			if (this.animFrameId !== null) {
				cancelAnimationFrame(this.animFrameId);
				this.animFrameId = null;
			}
			this.startBlendshapes.clear();
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
			if (Math.abs(currentVal - targetVal) < 0.005) {
				this.currentBlendshapes.set(name, targetVal);
				this.targetBlendshapes.set(name, targetVal);
				continue;
			}
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

			for (const [name, targetVal] of Array.from(this.targetBlendshapes.entries())) {
				const startInfo = this.startBlendshapes.get(name);
				if (!startInfo) continue;

				const elapsed = now - startInfo.startTime;
				if (elapsed >= duration) {
					this.currentBlendshapes.set(name, targetVal);
					this.startBlendshapes.delete(name);
					batch.push({ name, value: targetVal });
				} else {
					isAnyActive = true;
					const t = Math.min(1.0, elapsed / duration);
					// Curva Ease-Out: 1 - (1 - t)^2
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
	 * Consulta los blendshapes descubiertos pasivamente desde VSeeFace VMC Out.
	 */
	public async fetchDiscoveredBlendshapes(): Promise<string[]> {
		try {
			const res = await fetch('/api/avatar/vmc');
			if (res.ok) {
				const data = await res.json();
				if (Array.isArray(data.blendshapes)) {
					return data.blendshapes;
				}
			}
		} catch {
			// Fallback silencioso
		}
		return [];
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
