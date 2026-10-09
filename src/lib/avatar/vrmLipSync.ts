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
const LOOKAHEAD_SECONDS = 0.035; // 35 ms de anticipación articulatoria natural

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
 * mediante análisis formántico espectral FFT y selección Winner-Take-Most.
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

	for (let f = 0; f < totalFrames; f += 1) {
		// Timestamp en segundos con anticipación articulatoria (35 ms hacia adelante)
		const t = f / 60 + LOOKAHEAD_SECONDS;
		const centerSample = Math.floor(t * sampleRate);
		const startSample = centerSample - (FFT_SIZE >> 1);

		let sumSq = 0;
		for (let i = 0; i < FFT_SIZE; i += 1) {
			const idx = startSample + i;
			const sample = idx >= 0 && idx < channel.length ? channel[idx] : 0;
			sumSq += sample * sample;
			real[i] = sample * HANN_WINDOW[i];
			imag[i] = 0;
		}

		// Energía RMS del bloque
		const rms = Math.sqrt(sumSq / FFT_SIZE);
		const rawVol = Math.min(1.0, Math.max(0, (rms - 0.012) * 9.5));

		// Ataque rápido (0.75) para abrir al instante y decaimiento medio (0.45) para cerrar entre palabras
		if (rawVol > smoothedVol) {
			smoothedVol += (rawVol - smoothedVol) * 0.75;
		} else {
			smoothedVol += (rawVol - smoothedVol) * 0.45;
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

		// Bandas formánticas acústicas de la voz humana (español y universal):
		// F1_LOW: 250 - 450 Hz (mandíbula casi cerrada: U, I)
		// F1_MID: 450 - 750 Hz (mandíbula media: E, O)
		// F1_HIGH: 750 - 1300 Hz (mandíbula bien abierta: A)
		// F2_LOW: 800 - 1400 Hz (lengua retraída / labios redondeados: U, O)
		// F2_HIGH: 1800 - 3200 Hz (lengua adelantada / labios extendidos: I, E)
		// SIBILANTS: 3500 - 7500 Hz (consonantes sibilantes / brillo: S, T, CH)
		const f1Low = getBandEnergy(magnitudes, sampleRate, FFT_SIZE, 250, 450);
		const f1Mid = getBandEnergy(magnitudes, sampleRate, FFT_SIZE, 450, 750);
		const f1High = getBandEnergy(magnitudes, sampleRate, FFT_SIZE, 750, 1300);
		const f2High = getBandEnergy(magnitudes, sampleRate, FFT_SIZE, 1800, 3200);
		const sibilants = getBandEnergy(magnitudes, sampleRate, FFT_SIZE, 3500, 7500);

		// Puntuaciones fonéticas para cada una de las 5 vocales
		let scoreA = f1High * 2.4 + f1Mid * 0.3;
		let scoreI = (f2High * 2.2 + sibilants * 0.9) * (1.0 + f1Low / (f1High + 0.001)) * 0.6;
		let scoreU = f1Low * 2.4 * Math.max(0, 1.0 - f2High / (f1Low + 0.001));
		let scoreE = (f1Mid * 1.3 + f2High * 1.1) * 0.8;
		let scoreO = f1Mid * 2.3 * Math.max(0, 1.0 - f2High / (f1Mid + 0.001));

		// Winner-Take-Most: Exponente de agudización (2.4)
		// Impide que varias formas de boca contradictorias compitan entre sí en la malla 3D VRM
		scoreA = Math.max(0, scoreA) ** 2.4;
		scoreI = Math.max(0, scoreI) ** 2.4;
		scoreU = Math.max(0, scoreU) ** 2.4;
		scoreE = Math.max(0, scoreE) ** 2.4;
		scoreO = Math.max(0, scoreO) ** 2.4;

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

		// Suavizado temporal continuo para evitar micro-saltos
		prevA += (targetA - prevA) * 0.65;
		prevI += (targetI - prevI) * 0.65;
		prevU += (targetU - prevU) * 0.65;
		prevE += (targetE - prevE) * 0.65;
		prevO += (targetO - prevO) * 0.65;

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
