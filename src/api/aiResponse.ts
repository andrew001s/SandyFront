import { type LocalAiConfig, streamLocalCompletion } from '@/api/localAi';
import { streamResponseGemini } from '@/api/streamGemini';
import type { AiProvider } from '@/lib/ai-provider';

export type AiStreamRequest = {
	provider: AiProvider;
	message: string;
	local?: LocalAiConfig;
	signal?: AbortSignal;
};

/**
 * Devuelve la respuesta del motor de IA como flujo de deltas de texto.
 *
 * Los tres proveedores transmiten de verdad: el local contra su propio
 * servidor, y Gemini y OpenRouter contra `POST /gemini/stream`, que entrega el
 * texto por frases según lo genera el modelo.
 */
export async function* streamAiResponse(request: AiStreamRequest): AsyncGenerator<string> {
	if (request.provider === 'local') {
		if (!request.local?.baseUrl) {
			throw new Error('Falta la URL del modelo local');
		}

		yield* streamLocalCompletion(request.local, {
			message: request.message,
			signal: request.signal,
		});
		return;
	}

	yield* streamResponseGemini(request.message, request.signal);
}
