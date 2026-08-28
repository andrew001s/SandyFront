import { streamResponseGemini } from '@/api/streamGemini';
import type { AiProvider } from '@/lib/ai-provider';

export type AiStreamRequest = {
	provider: AiProvider;
	message: string;
	signal?: AbortSignal;
};

/**
 * Devuelve la respuesta del motor de IA como flujo de deltas de texto.
 *
 * Los tres proveedores pasan por `POST /gemini/stream`. El modelo local también:
 * el backend es el dueño de la persona, las reglas, el historial y las órdenes,
 * y delega solo la inferencia en el navegador a través del bus SSE. Llamarlo
 * directo desde aquí dejaba al modelo sin nada de eso.
 */
export async function* streamAiResponse(request: AiStreamRequest): AsyncGenerator<string> {
	yield* streamResponseGemini(request.message, request.signal);
}
