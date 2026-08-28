import { getBackendUrl, getClerkSessionToken } from '@/api/backendClient';
import { type AiErrorPayload, AiResponseError } from '@/lib/ai-errors';

type SseFrame = { event: string; data: Record<string, unknown> };

/** Un frame SSE: líneas `event:` y `data:` separadas del siguiente por una línea en blanco. */
function parseFrame(frame: string): SseFrame | null {
	let event = 'message';
	const data: string[] = [];

	for (const line of frame.split('\n')) {
		if (line.startsWith(':')) {
			continue; // comentario o ping
		}
		if (line.startsWith('event:')) {
			event = line.slice(6).trim();
		} else if (line.startsWith('data:')) {
			data.push(line.slice(5).trim());
		}
	}

	if (data.length === 0) {
		return null;
	}
	try {
		return { event, data: JSON.parse(data.join('\n')) };
	} catch {
		return null;
	}
}

async function payloadFromResponse(response: Response): Promise<AiErrorPayload> {
	try {
		const body = await response.json();
		const error = body?.error;
		if (error && typeof error.code === 'string') {
			return error as AiErrorPayload;
		}
	} catch {
		// respuesta sin cuerpo JSON
	}
	return { code: 'error.unknown' };
}

/**
 * Consume `POST /gemini/stream` y va entregando el texto según lo genera el
 * modelo, en vez de esperar a la respuesta completa.
 *
 * Concatenar todos los deltas reproduce exactamente el texto final, así que el
 * consumidor puede unirlos sin añadir separadores.
 */
export async function* streamResponseGemini(
	message: string,
	signal?: AbortSignal,
): AsyncGenerator<string> {
	const token = await getClerkSessionToken();
	const response = await fetch(`${getBackendUrl()}/gemini/stream`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify({ message }),
		signal,
	});

	// Un fallo anterior al stream (401, 429, 402...) llega como JSON con el
	// mismo contrato de códigos que el endpoint no-streaming.
	if (!response.ok || !response.body) {
		throw new AiResponseError(await payloadFromResponse(response));
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				break;
			}
			buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');

			let separator = buffer.indexOf('\n\n');
			while (separator !== -1) {
				const frame = parseFrame(buffer.slice(0, separator));
				buffer = buffer.slice(separator + 2);

				if (frame?.event === 'delta' && typeof frame.data.text === 'string') {
					yield frame.data.text;
				} else if (frame?.event === 'error') {
					throw new AiResponseError(frame.data as AiErrorPayload);
				}
				// 'done' no aporta nada: su texto ya salió en los deltas.

				separator = buffer.indexOf('\n\n');
			}
		}
	} finally {
		await reader.cancel().catch(() => undefined);
	}
}
