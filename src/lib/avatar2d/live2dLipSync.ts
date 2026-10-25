import { decodeAudioBlob } from './avatar2dLipSync';

/**
 * Módulo de sincronización labial y modulación fonética para modelos Live2D Cubism.
 * Analiza la energía RMS (apertura) y el centroide espectral / tasa de cruces por cero (ZCR)
 * para calcular los parámetros universales ParamMouthOpenY y ParamMouthForm.
 */

export interface Live2dMouthFrame {
	mouthOpenY: number; // 0.0 (cerrada) a 1.0 (abierta)
	mouthForm: number; // -1.0 (redondeada O/U) a +1.0 (ensanchada / sonrisa I/E)
}

export type Live2dAudioClock = () => number;

export interface Live2dLipSyncController {
	(audioBlob: Blob, clock?: Live2dAudioClock): Promise<void>;
	prepare: (audioBlob: Blob) => Promise<void>;
	start: (audioBlob: Blob, clock?: Live2dAudioClock) => Promise<void>;
	stop: () => void;
	tick?: () => void;
}

/**
 * Calcula los fotogramas de modulación bucal para Live2D a partir de muestras PCM.
 * - mouthOpenY: amplitud vertical basada en energía RMS.
 * - mouthForm: curvatura horizontal (+1 sonrisa/ensanchada para I/E, -1 redondeada para O/U).
 */
export function computeLive2dMouthFrames(
	samples: Float32Array,
	sampleRate: number,
	fps = 60,
	threshold = 0.02,
): Live2dMouthFrame[] {
	if (!samples || samples.length === 0 || sampleRate <= 0) {
		return [];
	}

	const samplesPerFrame = Math.max(1, Math.floor(sampleRate / fps));
	const totalFrames = Math.ceil(samples.length / samplesPerFrame);
	const frames: Live2dMouthFrame[] = new Array(totalFrames);

	let prevOpen = 0;
	let prevForm = 0;

	for (let f = 0; f < totalFrames; f++) {
		const start = f * samplesPerFrame;
		const end = Math.min(samples.length, start + samplesPerFrame);
		const count = end - start;

		if (count <= 0) {
			frames[f] = { mouthOpenY: 0, mouthForm: 0 };
			continue;
		}

		let sumSq = 0;
		let zeroCrossings = 0;

		for (let i = start; i < end; i++) {
			const s = samples[i];
			sumSq += s * s;
			if (i > start) {
				const prev = samples[i - 1];
				if ((s >= 0 && prev < 0) || (s < 0 && prev >= 0)) {
					zeroCrossings++;
				}
			}
		}

		const rms = Math.sqrt(sumSq / count);

		if (rms < threshold) {
			// En silencio o pausas: retorno suave a reposo neutral
			prevOpen = Math.max(0, prevOpen * 0.4);
			prevForm = prevForm * 0.4;
			if (prevOpen < 0.01) prevOpen = 0;
			if (Math.abs(prevForm) < 0.01) prevForm = 0;
			frames[f] = {
				mouthOpenY: Number(prevOpen.toFixed(3)),
				mouthForm: Number(prevForm.toFixed(3)),
			};
			continue;
		}

		// Apertura vertical: calibrada a la dinámica normal de voz (0.02 a 0.25 RMS)
		const targetOpen = Math.min(1.0, Math.max(0.15, (rms - threshold) * 4.0));

		// Tasa de cruces por cero (ZCR) normalizada
		const zcr = count > 1 ? zeroCrossings / (count - 1) : 0;

		// Formación horizontal de boca:
		// Fonemas agudos/anteriores (I, E) tienen mayor ZCR -> ensancha (mouthForm > 0)
		// Fonemas graves/posteriores (O, U) tienen menor ZCR -> redondea (mouthForm < 0)
		let targetForm = 0;
		if (zcr >= 0.13) {
			// Ensanchamiento / Sonrisa
			targetForm = Math.min(1.0, (zcr - 0.12) / 0.12);
		} else if (zcr <= 0.09) {
			// Redondeo / O, U
			targetForm = -Math.min(1.0, (0.09 - zcr) / 0.06);
		} else {
			// Zona neutra / Vocal A
			targetForm = 0;
		}

		// Suavizado asimétrico para animación fluida sin jitter
		prevOpen = prevOpen * 0.35 + targetOpen * 0.65;
		prevForm = prevForm * 0.4 + targetForm * 0.6;

		frames[f] = {
			mouthOpenY: Number(Math.max(0, Math.min(1, prevOpen)).toFixed(3)),
			mouthForm: Number(Math.max(-1, Math.min(1, prevForm)).toFixed(3)),
		};
	}

	return frames;
}

/**
 * Crea un manejador de Lip Sync fonético para modelos Live2D.
 * Predecodifica el audio sin latencia y emite ParamMouthOpenY y ParamMouthForm a 60 FPS.
 */
export function createLive2dLipSyncHandler(
	onMouthFrame: (frame: Live2dMouthFrame) => void,
	options?: { threshold?: number; fps?: number },
): Live2dLipSyncController {
	let cachedBlob: Blob | null = null;
	let cachedFrames: Live2dMouthFrame[] | null = null;
	let timerId: ReturnType<typeof setInterval> | null = null;
	let activeSession = 0;
	let lastReportedOpen = 0;
	let lastReportedForm = 0;

	const threshold = options?.threshold ?? 0.02;
	const fps = options?.fps ?? 60;
	const tickIntervalMs = Math.max(8, Math.floor(1000 / fps));

	const prepare = async (blob: Blob): Promise<void> => {
		if (cachedBlob === blob && cachedFrames) return;
		try {
			const decoded = await decodeAudioBlob(blob);
			cachedBlob = blob;
			cachedFrames = computeLive2dMouthFrames(decoded.samples, decoded.sampleRate, fps, threshold);
		} catch {
			cachedBlob = null;
			cachedFrames = null;
		}
	};

	let externalTick: (() => void) | undefined;

	const start = async (blob: Blob, clock?: Live2dAudioClock): Promise<void> => {
		const session = ++activeSession;
		if (timerId !== null) {
			clearInterval(timerId);
			timerId = null;
		}

		if (cachedBlob !== blob || !cachedFrames) {
			await prepare(blob);
		}

		const frames = cachedFrames;
		if (!frames || frames.length === 0 || session !== activeSession) {
			onMouthFrame({ mouthOpenY: 0, mouthForm: 0 });
			return;
		}

		const startTime = performance.now();
		const getElapsedSeconds = clock ?? (() => (performance.now() - startTime) / 1000);

		const finish = () => {
			if (timerId !== null) {
				clearInterval(timerId);
				timerId = null;
			}
			lastReportedOpen = 0;
			lastReportedForm = 0;
			onMouthFrame({ mouthOpenY: 0, mouthForm: 0 });
		};

		const tick = () => {
			if (session !== activeSession) {
				finish();
				return;
			}
			const elapsed = getElapsedSeconds();
			const frameIdx = Math.floor(elapsed * fps);
			if (frameIdx >= frames.length) {
				finish();
				return;
			}
			const current = frames[frameIdx] ?? { mouthOpenY: 0, mouthForm: 0 };
			if (current.mouthOpenY !== lastReportedOpen || current.mouthForm !== lastReportedForm) {
				lastReportedOpen = current.mouthOpenY;
				lastReportedForm = current.mouthForm;
				onMouthFrame(current);
			}
		};

		externalTick = tick;

		// Emitir primer fotograma inmediatamente (0ms)
		const initial = frames[0] ?? { mouthOpenY: 0, mouthForm: 0 };
		lastReportedOpen = initial.mouthOpenY;
		lastReportedForm = initial.mouthForm;
		onMouthFrame(initial);

		timerId = setInterval(tick, tickIntervalMs);
	};

	const stop = () => {
		activeSession++;
		if (timerId !== null) {
			clearInterval(timerId);
			timerId = null;
		}
		lastReportedOpen = 0;
		lastReportedForm = 0;
		onMouthFrame({ mouthOpenY: 0, mouthForm: 0 });
	};

	const handler = (async (blob: Blob, clock?: Live2dAudioClock) => {
		await start(blob, clock);
	}) as unknown as Live2dLipSyncController;

	handler.prepare = prepare;
	handler.start = start;
	handler.stop = stop;
	handler.tick = () => {
		externalTick?.();
	};

	return handler;
}
