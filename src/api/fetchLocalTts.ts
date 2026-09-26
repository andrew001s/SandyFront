import { AiResponseError, VOICE_PROVIDER } from '@/lib/ai-errors';
import type { LocalTtsConfig } from '@/lib/tts-provider';
import axios from 'axios';

export function buildLocalSpeechUrl(baseUrl: string): string {
	const trimmed = baseUrl.trim().replace(/\/+$/, '');
	if (!trimmed) {
		throw new Error('La URL del servidor TTS local está vacía');
	}
	if (/\/audio\/speech$/.test(trimmed)) {
		return trimmed;
	}
	if (/\/v1$/.test(trimmed)) {
		return `${trimmed}/audio/speech`;
	}
	return `${trimmed}/v1/audio/speech`;
}

export async function getVoiceLocal(
	message: string,
	config: LocalTtsConfig,
	options: { signal?: AbortSignal } = {},
): Promise<Blob> {
	if (!config.baseUrl?.trim()) {
		throw new AiResponseError({
			code: 'error.missing-config',
			provider: VOICE_PROVIDER,
		});
	}

	const trimmed = message.trim();
	if (!trimmed) {
		return new Blob([], { type: 'audio/mpeg' });
	}

	const url = buildLocalSpeechUrl(config.baseUrl);

	try {
		const response = await axios.post(
			url,
			{
				model: 'tts-1',
				input: trimmed,
				voice: config.voice?.trim() || 'sandy',
				response_format: 'mp3',
			},
			{
				responseType: 'blob',
				signal: options.signal,
				timeout: 25000,
			},
		);

		if (response.status !== 200) {
			throw new AiResponseError({
				code: 'error.unknown',
				provider: VOICE_PROVIDER,
			});
		}

		return response.data as Blob;
	} catch (error) {
		if (axios.isCancel(error)) {
			throw error;
		}

		const status = (error as { response?: { status?: number } }).response?.status;
		console.error(`[LocalTTS] Error al conectar a ${url}:`, error);
		throw new AiResponseError({
			code: status ? 'error.provider-unavailable' : 'error.provider-unavailable',
			provider: VOICE_PROVIDER,
			retryable: true,
		});
	}
}
