import { getResponseGemini } from '@/api/fetchGemini';
import { type LocalAiConfig, streamLocalCompletion } from '@/api/localAi';
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
 * Solo el proveedor local transmite de verdad: Gemini y OpenRouter se resuelven
 * en el backend (`POST /gemini`), que responde con el mensaje completo. Para esos
 * se emite un único delta, de modo que el resto del sistema —troceo en frases y
 * síntesis encadenada— funciona igual sin ramificar en cada punto.
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

	const response = await getResponseGemini(request.message);
	yield typeof response === 'string' ? response : String(response ?? '');
}
