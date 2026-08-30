import { type FishAudioConfig, getVoiceSandy } from '@/api/fetchFishAudio';
import { AudioQueueManager } from '@/lib/audioQueueSingleton';
import { cleanSpokenText, turnMarkerIndex } from '@/lib/replyCleanup';
import { createSentenceChunker } from '@/lib/sentenceChunker';

export type SpeechPipelineOptions = {
	fish: FishAudioConfig;
	/** Se llama con cada segmento en cuanto se corta, antes de sintetizarlo. */
	onSegment?: (segment: string) => void;
	onSegmentError?: (segment: string, error: unknown) => void;
	signal?: AbortSignal;
	/** Peticiones de TTS simultáneas. Más alto no acelera y arriesga rate limit. */
	concurrency?: number;
	/**
	 * Etiquetas con las que el modelo abre un turno que no le toca escribir
	 * ("user:", el nombre del personaje...). Al encontrarlas se corta ahí y se
	 * deja de hablar. Sin esto, un modelo local que sigue la conversación solo
	 * acaba leyendo en voz alta el turno del espectador.
	 */
	stopMarkers?: string[];
};

/** Semáforo mínimo para no disparar una petición por cada frase a la vez. */
const createLimiter = (limit: number) => {
	let active = 0;
	const waiting: (() => void)[] = [];

	const release = () => {
		active--;
		waiting.shift()?.();
	};

	return async <T>(task: () => Promise<T>): Promise<T> => {
		if (active >= limit) {
			await new Promise<void>((resolve) => waiting.push(resolve));
		}
		active++;
		try {
			return await task();
		} finally {
			release();
		}
	};
};

/**
 * Consume un flujo de texto y va encolando audio a medida que se completan frases.
 *
 * La síntesis de cada segmento arranca en cuanto el segmento existe (en paralelo,
 * hasta `concurrency`), pero el encolado se serializa con una cadena de promesas
 * para que la reproducción respete el orden del texto aunque una petición termine
 * antes que la anterior.
 *
 * Devuelve el texto completo, para poder registrarlo en el chat.
 */
export async function speakTextStream(
	stream: AsyncIterable<string>,
	options: SpeechPipelineOptions,
): Promise<string> {
	const { fish, onSegment, onSegmentError, signal, concurrency = 2, stopMarkers = [] } = options;
	const chunker = createSentenceChunker();
	const queue = AudioQueueManager.getInstance();
	const limit = createLimiter(concurrency);

	let fullText = '';
	let chain: Promise<void> = Promise.resolve();

	const enqueueSegment = (segment: string) => {
		onSegment?.(segment);

		const synthesis = limit(() => getVoiceSandy(segment, fish, { latency: 'low', signal })).catch(
			(error) => {
				onSegmentError?.(segment, error);
				return null;
			},
		);

		chain = chain.then(async () => {
			if (signal?.aborted) return;
			const blob = await synthesis;
			if (blob && !signal?.aborted) {
				await queue.addToQueue(blob);
			}
		});
	};

	// Se limpia la frase YA cortada, no cada trozo suelto: así las marcas llegan
	// completas (`*acción*`, `**negrita**`) y no cuesta latencia, porque el
	// segmento ya estaba listo para mandarse a voz.
	let cortado = false;
	const procesar = (segment: string): void => {
		const corte = turnMarkerIndex(segment, stopMarkers);
		const util = corte >= 0 ? segment.slice(0, corte) : segment;
		if (corte >= 0) {
			cortado = true;
		}
		const limpio = cleanSpokenText(util);
		if (!limpio) return;
		fullText += fullText ? ` ${limpio}` : limpio;
		enqueueSegment(limpio);
	};

	for await (const delta of stream) {
		if (signal?.aborted || cortado) break;
		for (const segment of chunker.push(delta)) {
			procesar(segment);
			if (cortado) break;
		}
	}

	if (!cortado && !signal?.aborted) {
		const tail = chunker.flush();
		if (tail) {
			procesar(tail);
		}
	}

	await chain;
	return fullText;
}

/** Adaptador para proveedores que devuelven la respuesta completa de una vez. */
export async function* singleChunkStream(text: string): AsyncGenerator<string> {
	yield text;
}
