import { AiResponseError, VOICE_PROVIDER } from '@/lib/ai-errors';
import type { EdgeTtsConfig } from '@/lib/tts-provider';

export async function getVoiceEdge(
	message: string,
	config: EdgeTtsConfig,
	options: { signal?: AbortSignal } = {},
): Promise<Blob> {
	const trimmed = message.trim();
	if (!trimmed) {
		return new Blob([], { type: 'audio/mpeg' });
	}

	try {
		const response = await fetch('/api/tts/edge', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				text: trimmed,
				voice: config.voice,
				rate: config.rate,
				pitch: config.pitch,
			}),
			signal: options.signal,
		});

		if (!response.ok) {
			const errorText = await response.text().catch(() => '');
			console.error(`[EdgeTTS] Error ${response.status}: ${errorText}`);
			throw new AiResponseError({
				code: response.status === 429 ? 'error.rate-limit' : 'error.provider-unavailable',
				provider: VOICE_PROVIDER,
			});
		}

		const blob = await response.blob();
		return blob;
	} catch (error) {
		if (error instanceof AiResponseError) {
			throw error;
		}
		if (error instanceof DOMException && error.name === 'AbortError') {
			throw error;
		}

		console.error('[EdgeTTS] Error de red o conexión:', error);
		throw new AiResponseError({
			code: 'error.provider-unavailable',
			provider: VOICE_PROVIDER,
			retryable: true,
		});
	}
}
