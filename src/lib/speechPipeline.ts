import { type FishAudioConfig, getVoiceSandy } from '@/api/fetchFishAudio';
import { getVoiceEdge } from '@/api/fetchEdgeTts';
import { getVoiceLocal } from '@/api/fetchLocalTts';
import { AudioQueueManager } from '@/lib/audioQueueSingleton';
import { createSentenceChunker } from '@/lib/sentenceChunker';
import {
	type EdgeTtsConfig,
	type LocalTtsConfig,
	type TtsProvider,
	getStoredEdgeTtsConfig,
	getStoredLocalTtsConfig,
	getStoredTtsProvider,
} from '@/lib/tts-provider';

export type SpeechPipelineOptions = {
	provider?: TtsProvider;
	fish?: FishAudioConfig;
	edge?: EdgeTtsConfig;
	local?: LocalTtsConfig;
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
 * Limpia asteriscos de rol (*sonríe*, **negrita**), enlaces y marcas markdown
 * para que los motores TTS lean el texto con naturalidad y sin deletrear símbolos.
 */
export function cleanSegmentForSpeech(text: string): string {
	return text
		.replace(/\*\*([^*]+)\*\*/g, '$1')
		.replace(/\*([^*]+)\*/g, '$1')
		.replace(/__([^_]+)__/g, '$1')
		.replace(/_([^_]+)_/g, '$1')
		.replace(/`([^`]+)`/g, '$1')
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * Determina si el texto tiene contenido pronunciable (letras o números).
 * Evita llamadas estériles a TTS para signos aislados como "...", "---" o emojis.
 */
export function hasSpeakableContent(text: string): boolean {
	return /[\p{L}\p{N}]/u.test(text);
}

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
	const {
		provider,
		fish,
		edge,
		local,
		onSegment,
		onSegmentError,
		signal,
		concurrency = 2,
	} = options;

	const effectiveProvider: TtsProvider = provider ?? getStoredTtsProvider();
	const edgeConfig = edge ?? getStoredEdgeTtsConfig();
	const localConfig = local ?? getStoredLocalTtsConfig();
	const chunker = createSentenceChunker();
	const queue = AudioQueueManager.getInstance();
	const limit = createLimiter(concurrency);

	let fullText = '';
	let chain: Promise<void> = Promise.resolve();

	const synthesizeAudio = async (text: string): Promise<Blob | null> => {
		const cleaned = cleanSegmentForSpeech(text);
		if (!hasSpeakableContent(cleaned)) {
			return null;
		}

		switch (effectiveProvider) {
			case 'edge_tts':
				return getVoiceEdge(cleaned, edgeConfig, { signal });
			case 'local_tts':
				return getVoiceLocal(cleaned, localConfig, { signal });
			case 'fish_audio':
				if (!fish?.apiKey || !fish?.voiceId) {
					throw new Error('Faltan las credenciales de Fish Audio');
				}
				return getVoiceSandy(cleaned, fish, { latency: 'low', signal });
			default:
				return getVoiceEdge(cleaned, edgeConfig, { signal });
		}
	};

	const enqueueSegment = (segment: string) => {
		onSegment?.(segment);

		const synthesis = limit(() => synthesizeAudio(segment)).catch((error) => {
			onSegmentError?.(segment, error);
			return null;
		});

		chain = chain.then(async () => {
			if (signal?.aborted) return;
			const blob = await synthesis;
			if (blob && blob.size > 0 && !signal?.aborted) {
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
