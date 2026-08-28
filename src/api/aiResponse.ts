import { type LocalAiConfig, streamLocalCompletion } from '@/api/localAi';
import { fetchLocalAiContext } from '@/api/localAiContext';
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
 * Gemini y OpenRouter se resuelven en el backend, que ya inyecta prompts,
 * personalidad e historial. El modelo local se llama directo desde aquí —así el
 * streaming es nativo y sin saltos intermedios—, pero antes se piden esos mismos
 * prompts al backend para ponerlos en el system prompt: es lo único que el
 * navegador no puede componer por su cuenta.
 */
export async function* streamAiResponse(request: AiStreamRequest): AsyncGenerator<string> {
	if (request.provider === 'local') {
		if (!request.local?.baseUrl) {
			throw new Error('Falta la URL del modelo local');
		}

		// Si el backend no responde, se sigue adelante sin personaje antes que
		// dejar al usuario sin respuesta.
		let systemPrompt = '';
		try {
			systemPrompt = (await fetchLocalAiContext(request.signal)).systemPrompt;
		} catch (error) {
			console.error('No se pudo cargar la personalidad para el modelo local:', error);
		}

		yield* streamLocalCompletion(request.local, {
			message: request.message,
			systemPrompt,
			signal: request.signal,
		});
		return;
	}

	yield* streamResponseGemini(request.message, request.signal);
}
