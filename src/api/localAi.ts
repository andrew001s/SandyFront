/**
 * Cliente para un modelo servido en local (Ollama, LM Studio, llama.cpp, vLLM...).
 *
 * Todos exponen la API compatible con OpenAI, así que solo hace falta la URL base.
 * A diferencia de Gemini y OpenRouter —que pasan por el backend— aquí el navegador
 * habla directo con el servidor del usuario, y por eso este es el único proveedor
 * que puede transmitir token a token sin tocar el backend.
 */
export type LocalAiConfig = {
	baseUrl: string;
	model?: string;
};

export type LocalCompletionRequest = {
	message: string;
	systemPrompt?: string;
	signal?: AbortSignal;
};

/** Acepta la raíz (`http://localhost:11434`) o la ruta completa ya escrita. */
export function buildLocalCompletionsUrl(baseUrl: string): string {
	const trimmed = baseUrl.trim().replace(/\/+$/, '');
	if (!trimmed) {
		throw new Error('La URL del modelo local está vacía');
	}
	if (/\/chat\/completions$/.test(trimmed)) {
		return trimmed;
	}
	if (/\/v\d+$/.test(trimmed)) {
		return `${trimmed}/chat/completions`;
	}
	return `${trimmed}/v1/chat/completions`;
}

export function isValidLocalAiUrl(value?: string | null): boolean {
	if (!value?.trim()) return false;
	try {
		const url = new URL(value.trim());
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
}

/**
 * Transmite la respuesta del modelo local como deltas de texto.
 *
 * El servidor responde en SSE (`data: {...}`), que puede partirse por la mitad
 * entre dos lecturas del stream: por eso se acumula en un buffer y solo se
 * procesan las líneas completas.
 */
export async function* streamLocalCompletion(
	config: LocalAiConfig,
	request: LocalCompletionRequest,
): AsyncGenerator<string> {
	const messages: Array<{ role: string; content: string }> = [];
	if (request.systemPrompt) {
		messages.push({ role: 'system', content: request.systemPrompt });
	}
	messages.push({ role: 'user', content: request.message });

	const response = await fetch(buildLocalCompletionsUrl(config.baseUrl), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			model: config.model?.trim() || 'local-model',
			messages,
			stream: true,
		}),
		signal: request.signal,
	});

	if (!response.ok || !response.body) {
		throw new Error(`El modelo local respondió ${response.status}`);
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() ?? '';

			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed.startsWith('data:')) continue;

				const data = trimmed.slice(5).trim();
				if (data === '[DONE]') return;

				try {
					const parsed = JSON.parse(data);
					const delta = parsed?.choices?.[0]?.delta?.content;
					if (typeof delta === 'string' && delta) {
						yield delta;
					}
				} catch {
					// Línea de keep-alive o JSON partido: se ignora.
				}
			}
		}
	} finally {
		await reader.cancel().catch(() => {
			// El stream ya podía estar cerrado por el servidor o por el abort.
		});
	}
}
