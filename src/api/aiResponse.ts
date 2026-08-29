import { type LocalAiConfig, streamLocalCompletion } from '@/api/localAi';
import { fetchLocalAiContext } from '@/api/localAiContext';
import { classifyLocalMessage, executeLocalOrder, fetchLocalStats } from '@/api/localOrders';
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
 * personalidad e historial, y de paso clasifica el mensaje para ejecutar las
 * órdenes del stream. El modelo local se llama directo desde aquí —así el
 * streaming es nativo y sin saltos intermedios—, de modo que esos dos pasos que
 * el navegador no puede hacer solo se piden al backend: los prompts por un lado
 * y la ejecución de la orden por otro.
 */
export async function* streamAiResponse(request: AiStreamRequest): AsyncGenerator<string> {
	if (request.provider === 'local') {
		if (!request.local?.baseUrl) {
			throw new Error('Falta la URL del modelo local');
		}

		// Si el backend no responde, se sigue adelante sin personaje antes que
		// dejar al usuario sin respuesta.
		let contexto = null;
		try {
			contexto = await fetchLocalAiContext(request.signal);
		} catch (error) {
			console.error('No se pudo cargar la personalidad para el modelo local:', error);
		}

		let systemPrompt = contexto?.systemPrompt ?? '';
		let entrada = request.message;

		// Mismo paso que el backend hace con Gemini y OpenRouter: decidir si el
		// creador está pidiendo cambiar algo del canal en vez de charlando.
		const intencion = await classifyLocalMessage(
			request.local,
			request.message,
			contexto?.prompts.assist ?? '',
			request.signal,
		);

		if (intencion.type === 'orden') {
			// Si la orden no se aplica, el error sube: es preferible a que la
			// VTuber diga que cambió el título cuando no ha cambiado nada.
			await executeLocalOrder(intencion, request.signal);
			systemPrompt = contexto?.prompts.vtuber || systemPrompt;
		} else if (intencion.type === 'statistics') {
			entrada = await fetchLocalStats(request.signal);
			systemPrompt = contexto?.prompts.statistics || systemPrompt;
		}

		yield* streamLocalCompletion(request.local, {
			message: entrada,
			systemPrompt,
			signal: request.signal,
		});
		return;
	}

	yield* streamResponseGemini(request.message, request.signal);
}
