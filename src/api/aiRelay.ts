import { backendClient } from '@/api/backendClient';

export type AiRelayRequest = {
	requestId: string;
	kind: 'text' | 'structured';
	message: string;
	systemInstruction: string;
	stop?: string[];
};

/** Convierte el evento SSE crudo en una petición, o null si no lo es. */
export function parseRelayRequest(raw: unknown): AiRelayRequest | null {
	if (!raw || typeof raw !== 'object') {
		return null;
	}
	const data = raw as Record<string, unknown>;
	if (typeof data.requestId !== 'string' || typeof data.message !== 'string') {
		return null;
	}
	return {
		requestId: data.requestId,
		kind: data.kind === 'structured' ? 'structured' : 'text',
		message: data.message,
		systemInstruction: typeof data.systemInstruction === 'string' ? data.systemInstruction : '',
		stop: Array.isArray(data.stop) ? (data.stop as string[]) : [],
	};
}

/**
 * Entrega texto al backend. Con `partial` la petición sigue abierta y se pueden
 * mandar más trozos; el último envío va sin él y la cierra.
 */
export async function sendRelayResult(
	requestId: string,
	text: string,
	partial = false,
): Promise<void> {
	await backendClient.post('/ai/local/result', { request_id: requestId, text, partial });
}

export async function sendRelayError(
	requestId: string,
	code: string,
	message: string,
): Promise<void> {
	await backendClient.post('/ai/local/result', {
		request_id: requestId,
		error_code: code,
		error_message: message,
	});
}
