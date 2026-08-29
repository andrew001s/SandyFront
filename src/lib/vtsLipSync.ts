export type VTSInjectParameters = (params: { id: string; value: number }[]) => Promise<void>;

/** Posición del audio que suena, en segundos. */
export type VTSAudioClock = () => number;

let activeSession = 0;

/** ~60 Hz. El worker mantiene el pulso aunque la pestaña esté en segundo plano. */
const TICK_MS = 16;

/**
 * Temporizador en un worker.
 *
 * `requestAnimationFrame` no se ejecuta cuando el documento no es visible: al
 * minimizar o cambiar de pestaña el bucle se congelaba y la boca del modelo se
 * quedaba clavada en su último valor, que es justo lo que se ve en el directo
 * porque VTube Studio sigue capturado en OBS. Un worker no depende de la
 * visibilidad del documento.
 */
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
		// Sin workers se cae a un temporizador normal: en segundo plano el
		// navegador lo limita a ~1 Hz, pero sigue avanzando y la boca acaba
		// cerrándose en vez de quedarse abierta.
		const id = setInterval(onTick, TICK_MS);
		return () => clearInterval(id);
	}

	const url = URL.createObjectURL(new Blob([TICKER_SOURCE], { type: 'text/javascript' }));
	const worker = new Worker(url);
	worker.onmessage = onTick;
	worker.postMessage({ type: 'start', interval: TICK_MS });

	return () => {
		worker.postMessage({ type: 'stop' });
		worker.terminate();
		URL.revokeObjectURL(url);
	};
};

const stopMouth = async (injectParameters: VTSInjectParameters) => {
	try {
		await injectParameters([
			{ id: 'SandyLipOpen', value: 0 },
			{ id: 'SandyLipSmile', value: 0 },
		]);
	} catch {
		// Ignore transient plugin errors during cleanup.
	}
};

export const stopVtsLipSync = () => {
	activeSession += 1;
};

export const createVtsLipSyncHandler = (injectParameters: VTSInjectParameters) => {
	return async (audioBlob: Blob, clock?: () => number) => {
		const session = ++activeSession;
		let audioContext: AudioContext | null = null;

		try {
			const buffer = await audioBlob.arrayBuffer();
			audioContext = new AudioContext();
			if (audioContext.state === 'suspended') {
				await audioContext.resume();
			}

			const audioBuffer = await audioContext.decodeAudioData(buffer);
			const sampleRate = audioBuffer.sampleRate;
			const channel = audioBuffer.getChannelData(0);
			const frameSize = Math.max(1, Math.floor(sampleRate / 60));
			// Sin reloj del audio se cae al cronómetro de pared, que es lo que
			// había antes: sirve para quien invoque el handler por su cuenta.
			const startTime = performance.now();
			const elapsedSeconds = clock ?? (() => (performance.now() - startTime) / 1000);
			let mouthValue = 0;
			let stopTicker: (() => void) | null = null;

			const finish = () => {
				stopTicker?.();
				stopTicker = null;
				void stopMouth(injectParameters);
				if (audioContext) {
					void audioContext.close();
					audioContext = null;
				}
			};

			const tick = () => {
				if (session !== activeSession) {
					finish();
					return;
				}

				const samplePos = Math.floor(elapsedSeconds() * sampleRate);

				if (samplePos >= channel.length) {
					finish();
					return;
				}

				let sumSq = 0;
				let zeroCrossings = 0;
				const start = samplePos;
				const end = Math.min(samplePos + frameSize, channel.length);
				const len = end - start;

				if (len > 0) {
					let prev = channel[start];
					for (let i = start; i < end; i += 1) {
						const sample = channel[i];
						sumSq += sample * sample;
						if (i > start && sample >= 0 !== prev >= 0) {
							zeroCrossings += 1;
						}
						prev = sample;
					}

					const rms = Math.sqrt(sumSq / len);
					const rawVolume = Math.min(rms * 10, 1);
					const target = rawVolume > 0.01 ? Math.max(rawVolume, 0.15) : 0;
					const rawFrequency = Math.min((zeroCrossings / len) * 24, 1);
					mouthValue += (target - mouthValue) * 0.5;

					void injectParameters([
						{ id: 'SandyLipOpen', value: mouthValue },
						{ id: 'SandyLipSmile', value: rawFrequency },
					]).catch(() => {
						// Ignore transient plugin errors while animating lips.
					});
				} else {
					mouthValue *= 0.9;
					void injectParameters([
						{ id: 'SandyLipOpen', value: mouthValue },
						{ id: 'SandyLipSmile', value: 0 },
					]).catch(() => {
						// Ignore transient plugin errors while animating lips.
					});
				}
			};

			stopTicker = createTicker(tick);
		} catch {
			await stopMouth(injectParameters);
			if (audioContext) {
				try {
					await audioContext.close();
				} catch {
					// Ignore close errors.
				}
			}
		}
	};
};
