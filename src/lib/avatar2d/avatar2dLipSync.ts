/**
 * Decodifica muestras PCM de un ArrayBuffer con formato WAV estándar.
 */
export function parseWavSamples(
	buffer: ArrayBuffer,
): { samples: Float32Array; sampleRate: number } | null {
	if (buffer.byteLength < 44) return null;
	const view = new DataView(buffer);

	// Validar encabezado RIFF y WAVE
	const isRiff =
		view.getUint8(0) === 0x52 &&
		view.getUint8(1) === 0x49 &&
		view.getUint8(2) === 0x46 &&
		view.getUint8(3) === 0x46;
	const isWave =
		view.getUint8(8) === 0x57 &&
		view.getUint8(9) === 0x41 &&
		view.getUint8(10) === 0x56 &&
		view.getUint8(11) === 0x45;

	if (!isRiff || !isWave) return null;

	const numChannels = view.getUint16(22, true);
	const sampleRate = view.getUint32(24, true);
	const bitsPerSample = view.getUint16(34, true);

	if (bitsPerSample !== 16 || numChannels <= 0) return null;

	// Buscar el chunk 'data'
	let dataOffset = 36;
	let foundData = false;
	while (dataOffset < buffer.byteLength - 8) {
		const c1 = view.getUint8(dataOffset);
		const c2 = view.getUint8(dataOffset + 1);
		const c3 = view.getUint8(dataOffset + 2);
		const c4 = view.getUint8(dataOffset + 3);
		if (c1 === 0x64 && c2 === 0x61 && c3 === 0x74 && c4 === 0x61) {
			foundData = true;
			dataOffset += 8;
			break;
		}
		dataOffset += 1;
	}

	if (!foundData) {
		dataOffset = 44;
	}

	const numSamples = Math.floor((buffer.byteLength - dataOffset) / (2 * numChannels));
	const samples = new Float32Array(numSamples);

	for (let i = 0; i < numSamples; i++) {
		const raw = view.getInt16(dataOffset + i * 2 * numChannels, true);
		samples[i] = raw < 0 ? raw / 32768 : raw / 32767;
	}

	return { samples, sampleRate };
}

/**
 * Decodifica un audio Blob a muestras Float32Array usando el parser WAV integrado
 * o fallback a AudioContext del navegador.
 */
export async function decodeAudioBlob(
	audioBlob: Blob,
): Promise<{ samples: Float32Array; sampleRate: number }> {
	const arrayBuffer = await audioBlob.arrayBuffer();
	const wav = parseWavSamples(arrayBuffer);
	if (wav) {
		return wav;
	}

	if (typeof window !== 'undefined' && 'AudioContext' in window) {
		const audioContext = new AudioContext();
		try {
			if (audioContext.state === 'suspended') {
				try {
					await audioContext.resume();
				} catch {
					// Continuar
				}
			}
			const decoded = await audioContext.decodeAudioData(arrayBuffer);
			const samples = decoded.getChannelData(0);
			return { samples, sampleRate: decoded.sampleRate };
		} finally {
			void audioContext.close();
		}
	}

	return { samples: new Float32Array(0), sampleRate: 24000 };
}

/**
 * Calcula los fotogramas booleanos de gesticulación bucal a partir de las muestras PCM de audio.
 * Analiza la energía cuadrática media (RMS) por bloque para determinar si hay voz activa
 * o si se encuentra en un tramo de silencio/pausa entre palabras.
 */
export function computeSpeakingFrames(
	samples: Float32Array,
	sampleRate: number,
	fps = 60,
	threshold = 0.02,
): boolean[] {
	if (!samples || samples.length === 0 || sampleRate <= 0) {
		return [];
	}

	const samplesPerFrame = Math.max(1, Math.floor(sampleRate / fps));
	const totalFrames = Math.ceil(samples.length / samplesPerFrame);
	const frames: boolean[] = new Array(totalFrames);

	for (let f = 0; f < totalFrames; f++) {
		const start = f * samplesPerFrame;
		const end = Math.min(samples.length, start + samplesPerFrame);
		let sumSq = 0;
		const count = end - start;

		for (let i = start; i < end; i++) {
			const s = samples[i];
			sumSq += s * s;
		}

		const rms = count > 0 ? Math.sqrt(sumSq / count) : 0;
		frames[f] = rms >= threshold;
	}

	return frames;
}

export type Avatar2dAudioClock = () => number;

export interface Avatar2dLipSyncController {
	(audioBlob: Blob, clock?: Avatar2dAudioClock): Promise<void>;
	prepare: (audioBlob: Blob) => Promise<void>;
	start: (audioBlob: Blob, clock?: Avatar2dAudioClock) => Promise<void>;
	stop: () => void;
	tick?: () => void;
}

/**
 * Crea un manejador de Lip Sync 2D reactivo a la señal de audio del TTS.
 * Analiza el volumen en tiempo real y alterna apertura y cierre bucal según la cadencia.
 */
export function createAvatar2dLipSyncHandler(
	onSpeakingChange: (isSpeaking: boolean) => void,
	options?: { threshold?: number; fps?: number },
): Avatar2dLipSyncController {
	let cachedBlob: Blob | null = null;
	let cachedFrames: boolean[] | null = null;
	let timerId: ReturnType<typeof setInterval> | null = null;
	let lastSpeaking = false;
	let activeSession = 0;

	const threshold = options?.threshold ?? 0.02;
	const fps = options?.fps ?? 60;
	const tickIntervalMs = Math.max(8, Math.floor(1000 / fps));

	const prepare = async (blob: Blob): Promise<void> => {
		if (cachedBlob === blob && cachedFrames) return;
		try {
			const decoded = await decodeAudioBlob(blob);
			cachedBlob = blob;
			cachedFrames = computeSpeakingFrames(decoded.samples, decoded.sampleRate, fps, threshold);
		} catch {
			cachedBlob = null;
			cachedFrames = null;
		}
	};

	let externalTick: (() => void) | undefined;

	const start = async (blob: Blob, clock?: Avatar2dAudioClock): Promise<void> => {
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
			if (lastSpeaking) {
				lastSpeaking = false;
				onSpeakingChange(false);
			}
			return;
		}

		const startTime = performance.now();
		const getElapsedSeconds = clock ?? (() => (performance.now() - startTime) / 1000);

		const finish = () => {
			if (timerId !== null) {
				clearInterval(timerId);
				timerId = null;
			}
			if (lastSpeaking) {
				lastSpeaking = false;
				onSpeakingChange(false);
			}
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
			const current = frames[frameIdx] ?? false;
			if (current !== lastSpeaking) {
				lastSpeaking = current;
				onSpeakingChange(current);
			}
		};

		externalTick = tick;

		// Emitir primer fotograma inmediatamente (0ms)
		const initial = frames[0] ?? false;
		lastSpeaking = initial;
		onSpeakingChange(initial);

		timerId = setInterval(tick, tickIntervalMs);
	};

	const stop = () => {
		activeSession++;
		if (timerId !== null) {
			clearInterval(timerId);
			timerId = null;
		}
		if (lastSpeaking) {
			lastSpeaking = false;
		}
		onSpeakingChange(false);
	};

	const handler = (async (blob: Blob, clock?: Avatar2dAudioClock) => {
		await start(blob, clock);
	}) as unknown as Avatar2dLipSyncController;

	handler.prepare = prepare;
	handler.start = start;
	handler.stop = stop;
	Object.defineProperty(handler, 'tick', {
		get: () => externalTick,
	});

	return handler;
}
