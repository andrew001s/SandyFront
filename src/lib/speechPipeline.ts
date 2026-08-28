import { type FishAudioConfig, getVoiceSandy } from '@/api/fetchFishAudio';
import { AudioQueueManager } from '@/lib/audioQueueSingleton';
import { createSentenceChunker } from '@/lib/sentenceChunker';

export type SpeechPipelineOptions = {
	fish: FishAudioConfig;
	/** Se llama con cada segmento en cuanto se corta, antes de sintetizarlo. */
	onSegment?: (segment: string) => void;
	onSegmentError?: (segment: string, error: unknown) => void;
	signal?: AbortSignal;
	/** Peticiones de TTS simultáneas. Más alto no acelera y arriesga rate limit. */
	concurrency?: number;
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
	const { fish, onSegment, onSegmentError, signal, concurrency = 2 } = options;
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

	for await (const delta of stream) {
		if (signal?.aborted) break;
		fullText += delta;
		for (const segment of chunker.push(delta)) {
			enqueueSegment(segment);
		}
	}

	const tail = chunker.flush();
	if (tail && !signal?.aborted) {
		enqueueSegment(tail);
	}

	await chain;
	return fullText;
}

/** Adaptador para proveedores que devuelven la respuesta completa de una vez. */
export async function* singleChunkStream(text: string): AsyncGenerator<string> {
	yield text;
}
