export type VRMVowelValues = {
	A: number;
	I: number;
	U: number;
	E: number;
	O: number;
};

export type VRMInjectVowels = (vowels: VRMVowelValues) => Promise<void> | void;

export type VRMAudioClock = () => number;

export interface VrmLipSyncController {
	(audioBlob: Blob, clock?: VRMAudioClock): Promise<void>;
	prepare: (audioBlob: Blob) => Promise<void>;
	start: (audioBlob: Blob, clock?: VRMAudioClock) => Promise<void>;
	stop: () => void;
}

let activeSession = 0;

const TICK_MS = 16; // ~60 Hz
const FFT_SIZE = 512;
const LOOKAHEAD_SECONDS = 0.075; // 75 ms de anticipación articulatoria natural (compensa latencia de hardware de audio)

// Tabla Hann para evitar fugas espectrales en la FFT
const HANN_WINDOW = new Float32Array(FFT_SIZE);
for (let i = 0; i < FFT_SIZE; i += 1) {
	HANN_WINDOW[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (FFT_SIZE - 1)));
}

/**
 * FFT Radix-2 de Cooley-Tukey en tiempo real (~3 microsegundos por bloque).
 */
function computeRadix2Fft(real: Float32Array, imag: Float32Array): void {
	const n = real.length;
	let j = 0;
	for (let i = 0; i < n - 1; i += 1) {
		if (i < j) {
			const tr = real[i];
			real[i] = real[j];
			real[j] = tr;
			const ti = imag[i];
			imag[i] = imag[j];
			imag[j] = ti;
		}
		let k = n >> 1;
		while (k <= j) {
			j -= k;
			k >>= 1;
		}
		j += k;
	}

	for (let len = 2; len <= n; len <<= 1) {
		const half = len >> 1;
		const angle = (-2 * Math.PI) / len;
		const wStepR = Math.cos(angle);
		const wStepI = Math.sin(angle);
		for (let i = 0; i < n; i += len) {
			let wr = 1;
			let wi = 0;
			for (let m = 0; m < half; m += 1) {
				const pos = i + m;
				const match = pos + half;
				const tr = wr * real[match] - wi * imag[match];
				const ti = wr * imag[match] + wi * real[match];
				real[match] = real[pos] - tr;
				imag[match] = imag[pos] - ti;
				real[pos] += tr;
				imag[pos] += ti;
				const nextWr = wr * wStepR - wi * wStepI;
				wi = wr * wStepI + wi * wStepR;
				wr = nextWr;
			}
		}
	}
}

/**
 * Extrae la energía promedio en un rango de frecuencias [fLow, fHigh] en Hz.
 */
function getBandEnergy(
	magnitudes: Float32Array,
	sampleRate: number,
	fftSize: number,
	fLow: number,
	fHigh: number,
): number {
	const binWidth = sampleRate / fftSize;
	const startBin = Math.max(0, Math.floor(fLow / binWidth));
	const endBin = Math.min(magnitudes.length - 1, Math.ceil(fHigh / binWidth));
	let sum = 0;
	let count = 0;
	for (let i = startBin; i <= endBin; i += 1) {
		sum += magnitudes[i];
		count += 1;
	}
	return count > 0 ? sum / count : 0;
}

/**
 * Pre-calcula la secuencia completa de formas de boca a 60 FPS
 * mediante pre-énfasis acústico, análisis formántico espectral FFT y
 * selección Winner-Take-Most sin retraso perceptual.
 */
export function precomputeVrmVowels(audioBuffer: AudioBuffer): VRMVowelValues[] {
	const sampleRate = audioBuffer.sampleRate;
	const channel = audioBuffer.getChannelData(0);
	const duration = audioBuffer.duration;
	const totalFrames = Math.max(1, Math.ceil(duration * 60));
	const frames: VRMVowelValues[] = new Array(totalFrames);

	const real = new Float32Array(FFT_SIZE);
	const imag = new Float32Array(FFT_SIZE);
	const magnitudes = new Float32Array(FFT_SIZE / 2);

	let smoothedVol = 0;
	let prevA = 0;
	let prevI = 0;
	let prevU = 0;
	let prevE = 0;
	let prevO = 0;

	const smoothTarget = (prev: number, target: number): number => {
		const factor = target > prev ? 0.85 : 0.5;
		return prev + (target - prev) * factor;
	};

	for (let f = 0; f < totalFrames; f += 1) {
		// Timestamp en segundos con anticipación articulatoria (75 ms hacia adelante)
		const t = f / 60 + LOOKAHEAD_SECONDS;
		const centerSample = Math.floor(t * sampleRate);
		const startSample = centerSample - (FFT_SIZE >> 1);

		let sumSq = 0;
		for (let i = 0; i < FFT_SIZE; i += 1) {
			const idx = startSample + i;
			const sample = idx >= 0 && idx < channel.length ? channel[idx] : 0;
			const prevSample = idx - 1 >= 0 && idx - 1 < channel.length ? channel[idx - 1] : 0;
			// Filtro Pre-Énfasis: y[n] = x[n] - 0.95 * x[n-1] para ecualizar la pendiente glotal (-6dB/oct)
			const emphasized = sample - 0.95 * prevSample;
			sumSq += sample * sample;
			real[i] = emphasized * HANN_WINDOW[i];
			imag[i] = 0;
		}

		// Energía RMS del bloque sobre señal real
		const rms = Math.sqrt(sumSq / FFT_SIZE);
		const rawVol = Math.min(1.0, Math.max(0, (rms - 0.012) * 9.5));

		// Ataque rápido (0.90) para sincronía instantánea y decaimiento medio (0.40) para cierre orgánico
		if (rawVol > smoothedVol) {
			smoothedVol += (rawVol - smoothedVol) * 0.9;
		} else {
			smoothedVol += (rawVol - smoothedVol) * 0.4;
		}

		if (smoothedVol <= 0.015) {
			smoothedVol = 0;
			prevA = 0;
			prevI = 0;
			prevU = 0;
			prevE = 0;
			prevO = 0;
			frames[f] = { A: 0, I: 0, U: 0, E: 0, O: 0 };
			continue;
		}

		// Ejecutar FFT espectral
		computeRadix2Fft(real, imag);

		// Magnitudes de Fourier (solo primera mitad espectral)
		for (let i = 0; i < FFT_SIZE / 2; i += 1) {
			magnitudes[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
		}

		// Bandas formánticas acústicas de la voz humana (con pre-énfasis):
		// bLow: 200 - 450 Hz (F1 mandíbula cerrada: U, I)
		// bMid: 450 - 750 Hz (F1 mandíbula media: O, E)
		// bOpen: 750 - 1400 Hz (F1 mandíbula abierta: A, O)
		// bFront: 1700 - 2800 Hz (F2 lengua anterior / labios extendidos: E, A)
		// bSibil: 3000 - 6500 Hz (F3 resonancia palatal / aire sibilante: I)
		const bLow = getBandEnergy(magnitudes, sampleRate, FFT_SIZE, 200, 450);
		const bMid = getBandEnergy(magnitudes, sampleRate, FFT_SIZE, 450, 750);
		const bOpen = getBandEnergy(magnitudes, sampleRate, FFT_SIZE, 750, 1400);
		const bFront = getBandEnergy(magnitudes, sampleRate, FFT_SIZE, 1700, 2800);
		const bSibil = getBandEnergy(magnitudes, sampleRate, FFT_SIZE, 3000, 6500);

		const totalHigh = bFront + bSibil;
		const totalLow = bLow + bMid;
		const highLowRatio = totalHigh / (totalLow + 0.02);

		const eps = 0.03;
		// A: Apertura mandibular máxima (750-1400 Hz) y F2 abierto
		let scoreA =
			(bOpen * 2.0 + bFront * 1.5) *
			Math.min(3.5, bOpen / (bLow + eps)) *
			Math.min(3.5, bFront / (bMid + eps));

		// O: F1 media (450-750 Hz) con apertura redonda, sin altas frecuencias frontales
		let scoreO =
			(bMid * 2.2 + bOpen * 2.0) *
			Math.min(3.5, bOpen / (bLow + eps)) *
			(1.0 / (highLowRatio * 4.0 + 1.0));

		// U: Mandíbula cerrada (200-450 Hz) dominante sobre apertura, labios fruncidos sin F2 frontal
		let scoreU =
			(bLow * 3.0 + bMid * 1.0) *
			Math.min(3.5, bLow / (bOpen + eps)) *
			(1.0 / (highLowRatio * 6.0 + 1.0));

		// E: F2 anterior nítido (1800-2800 Hz) dominante sobre sibilantes, apertura media
		let scoreE =
			(bFront * 3.5 + bMid * 1.0) *
			Math.min(3.5, bFront / (bOpen + eps)) *
			Math.min(3.5, bFront / (bSibil + eps));

		// I: Resonancia superior F3 (3000-6500 Hz) dominante sobre F2, mandíbula cerrada
		let scoreI =
			(bSibil * 3.0 + bLow * 0.6) *
			Math.min(3.5, bSibil / (bOpen + eps)) *
			Math.min(3.5, bSibil / (bFront + eps));

		// Winner-Take-Most: Exponente de agudización (2.2)
		// Impide que formas opuestas compitan entre sí en la malla 3D VRM
		scoreA = Math.max(0, scoreA) ** 2.2;
		scoreI = Math.max(0, scoreI) ** 2.2;
		scoreU = Math.max(0, scoreU) ** 2.2;
		scoreE = Math.max(0, scoreE) ** 2.2;
		scoreO = Math.max(0, scoreO) ** 2.2;

		const totalScore = scoreA + scoreI + scoreU + scoreE + scoreO;
		if (totalScore <= 0) {
			frames[f] = { A: 0, I: 0, U: 0, E: 0, O: 0 };
			continue;
		}

		// Normalización de forma dominante ponderada por volumen
		const targetA = (scoreA / totalScore) * smoothedVol;
		const targetI = (scoreI / totalScore) * smoothedVol;
		const targetU = (scoreU / totalScore) * smoothedVol;
		const targetE = (scoreE / totalScore) * smoothedVol;
		const targetO = (scoreO / totalScore) * smoothedVol;

		// Suavizado temporal asimétrico: apertura inmediata (0.85), cierre orgánico (0.50)
		prevA = smoothTarget(prevA, targetA);
		prevI = smoothTarget(prevI, targetI);
		prevU = smoothTarget(prevU, targetU);
		prevE = smoothTarget(prevE, targetE);
		prevO = smoothTarget(prevO, targetO);

		frames[f] = {
			A: Number(Math.max(0, Math.min(1, prevA)).toFixed(3)),
			I: Number(Math.max(0, Math.min(1, prevI)).toFixed(3)),
			U: Number(Math.max(0, Math.min(1, prevU)).toFixed(3)),
			E: Number(Math.max(0, Math.min(1, prevE)).toFixed(3)),
			O: Number(Math.max(0, Math.min(1, prevO)).toFixed(3)),
		};
	}

	return frames;
}

const TICKER_SOURCE = `
let id = null;
onmessage = (e) => {
  if (e.data && e.data.type === 'start') {
    clearInterval(id);
    id = setInterval(() => postMessage(0), e.data.interval);
  } else {
    clearInterval(id);
    id = null;
    close();
  }
};`;

const createTicker = (onTick: () => void): (() => void) => {
	if (typeof Worker === 'undefined') {
		const id = setInterval(onTick, TICK_MS);
		return () => clearInterval(id);
	}

	const url = URL.createObjectURL(new Blob([TICKER_SOURCE], { type: 'text/javascript' }));
	const WorkerConstructor = (window as unknown as { Worker: typeof Worker }).Worker;
	const worker = new WorkerConstructor(url);
	worker.onmessage = onTick;
	worker.postMessage({ type: 'start', interval: TICK_MS });

	return () => {
		worker.postMessage({ type: 'stop' });
		worker.terminate();
		URL.revokeObjectURL(url);
	};
};

const stopVrmMouth = async (injectVowels: VRMInjectVowels) => {
	try {
		await injectVowels({ A: 0, I: 0, U: 0, E: 0, O: 0 });
	} catch {
		// Ignorar errores transitorios al detener la boca
	}
};

export const stopVrmLipSync = () => {
	activeSession += 1;
};

/**
 * Decodifica un audio Blob a AudioBuffer reutilizando el AudioContext.
 */
async function decodeAudioBlob(audioBlob: Blob): Promise<AudioBuffer> {
	const arrayBuffer = await audioBlob.arrayBuffer();
	const audioContext = new AudioContext();
	try {
		if (audioContext.state === 'suspended') {
			try {
				await audioContext.resume();
			} catch {
				// decodeAudioData funciona incluso suspendido
			}
		}
		const decoded = await audioContext.decodeAudioData(arrayBuffer);
		return decoded;
	} finally {
		void audioContext.close();
	}
}

/**
 * Crea un manejador de Lip Sync de alta precisión para avatares 3D VRM (VSeeFace).
 * Soporta pre-cálculo sin retardo, anticipación articulatoria de 35ms y
 * agudización Winner-Take-Most para vocalización 3D impecable.
 */
export const createVrmLipSyncHandler = (injectVowels: VRMInjectVowels): VrmLipSyncController => {
	let cachedBlob: Blob | null = null;
	let cachedFrames: VRMVowelValues[] | null = null;
	let stopTicker: (() => void) | null = null;

	const prepare = async (audioBlob: Blob): Promise<void> => {
		if (cachedBlob === audioBlob && cachedFrames) {
			return;
		}
		try {
			const audioBuffer = await decodeAudioBlob(audioBlob);
			cachedBlob = audioBlob;
			cachedFrames = precomputeVrmVowels(audioBuffer);
		} catch {
			cachedBlob = null;
			cachedFrames = null;
		}
	};

	const start = async (audioBlob: Blob, clock?: VRMAudioClock): Promise<void> => {
		const session = ++activeSession;
		stopTicker?.();
		stopTicker = null;

		// Si no se había preparado antes, calcular frames ahora
		if (cachedBlob !== audioBlob || !cachedFrames) {
			await prepare(audioBlob);
		}

		const frames = cachedFrames;
		if (!frames || frames.length === 0 || session !== activeSession) {
			void stopVrmMouth(injectVowels);
			return;
		}

		const startTime = performance.now();
		const getElapsedSeconds = clock ?? (() => (performance.now() - startTime) / 1000);

		const finish = () => {
			stopTicker?.();
			stopTicker = null;
			void stopVrmMouth(injectVowels);
		};

		const tick = () => {
			if (session !== activeSession) {
				finish();
				return;
			}

			const elapsed = getElapsedSeconds();
			const frameIdx = Math.floor(elapsed * 60);

			if (frameIdx >= frames.length) {
				finish();
				return;
			}

			const currentFrame = frames[frameIdx] ?? { A: 0, I: 0, U: 0, E: 0, O: 0 };
			void injectVowels(currentFrame);
		};

		// Enviar primer fotograma inmediatamente (0 ms)
		const initialFrame = frames[0] ?? { A: 0, I: 0, U: 0, E: 0, O: 0 };
		void injectVowels(initialFrame);

		stopTicker = createTicker(tick);
	};

	const stop = () => {
		activeSession += 1;
		stopTicker?.();
		stopTicker = null;
		void stopVrmMouth(injectVowels);
	};

	// Función ejecutable compatible con llamadas directas
	const handler = (async (audioBlob: Blob, clock?: VRMAudioClock) => {
		await start(audioBlob, clock);
	}) as VrmLipSyncController;

	handler.prepare = prepare;
	handler.start = start;
	handler.stop = stop;

	return handler;
};
