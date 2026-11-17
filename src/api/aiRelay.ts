import { backendClient } from '@/api/backendClient';

export type AiRelayRequest = {
	requestId: string;
	/** 'text' genera respuesta, 'structured' pide JSON, 'moderation' evalúa un mensaje. */
	kind: string;
	message: string;
	systemInstruction: string;
	stop: string[];
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
		kind: typeof data.kind === 'string' ? data.kind : 'text',
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

export type AiTask = {
	/** Identificador generado por backend para ignorar reenvíos del mismo SSE. */
	id: string | null;
	/** 'chat', 'reaction' o 'speech': de dónde vino el evento. */
	kind: string;
	message: string;
	systemInstruction: string;
	stop: string[];
};

/** Recuerda IDs SSE para que una reconexión no procese dos veces la misma tarea. */
export function isDuplicateAiTask(taskId: string | null, seen: Set<string>): boolean {
	if (!taskId) return false;
	if (seen.has(taskId)) return true;
	seen.add(taskId);
	if (seen.size > 256) {
		const oldest = seen.values().next().value;
		if (oldest) seen.delete(oldest);
	}
	return false;
}

export function parseAiTask(raw: unknown): AiTask | null {
	if (!raw || typeof raw !== 'object') {
		return null;
	}
	const data = raw as Record<string, unknown>;
	if (typeof data.message !== 'string') {
		return null;
	}
	return {
		id: typeof data.id === 'string' ? data.id : null,
		kind: typeof data.kind === 'string' ? data.kind : 'chat',
		message: data.message,
		systemInstruction: typeof data.systemInstruction === 'string' ? data.systemInstruction : '',
		stop: Array.isArray(data.stop) ? (data.stop as string[]) : [],
	};
}

/** Devuelve el texto final para que el backend lo limpie y lo guarde. */
export async function sendTaskResult(message: string, response: string): Promise<void> {
	await backendClient.post('/ai/local/task-result', { message, response });
}
