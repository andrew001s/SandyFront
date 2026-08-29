import { backendClient } from '@/api/backendClient';
import { type LocalAiConfig, streamLocalCompletion } from '@/api/localAi';

/** Lo que el clasificador puede decidir sobre un mensaje del creador. */
export type LocalIntent =
	| { type: 'orden'; orderName: string; orderObjective: string | null }
	| { type: 'statistics' }
	| { type: 'interaccion' };

/** Órdenes que el backend sabe ejecutar. Sirve para descartar inventos del modelo. */
const ORDENES = new Set([
	'title',
	'game',
	'category',
	'clip',
	'only_followers',
	'only_subs',
	'only_emotes',
	'slow',
]);

const sinAcentos = (valor: string) =>
	valor.normalize('NFKD').replace(/\p{M}/gu, '').trim().toLowerCase();

/**
 * Extrae el JSON de la respuesta del modelo.
 *
 * Los modelos locales pequeños rara vez devuelven JSON limpio: lo envuelven en
 * ```json, lo preceden de una frase o añaden texto después. Se busca el primer
 * objeto equilibrado en vez de confiar en que toda la salida sea JSON.
 */
function extraerJson(texto: string): unknown {
	const inicio = texto.indexOf('{');
	if (inicio < 0) return null;

	let profundidad = 0;
	let enCadena = false;
	let escapado = false;

	for (let i = inicio; i < texto.length; i++) {
		const c = texto[i];
		if (enCadena) {
			if (escapado) escapado = false;
			else if (c === '\\') escapado = true;
			else if (c === '"') enCadena = false;
			continue;
		}
		if (c === '"') enCadena = true;
		else if (c === '{') profundidad++;
		else if (c === '}') {
			profundidad--;
			if (profundidad === 0) {
				try {
					return JSON.parse(texto.slice(inicio, i + 1));
				} catch {
					return null;
				}
			}
		}
	}
	return null;
}

/** Traduce la salida del modelo a una intención, o a charla si no está claro. */
export function parseIntent(texto: string): LocalIntent {
	const datos = extraerJson(texto) as Record<string, unknown> | null;
	if (!datos) return { type: 'interaccion' };

	const tipo = sinAcentos(String(datos.type ?? ''));

	if (tipo === 'orden') {
		const nombre = sinAcentos(String(datos.order_name ?? ''));
		// Una orden que no reconocemos no se manda al backend: ante la duda, se
		// responde hablando en vez de tocar el canal por error.
		if (!ORDENES.has(nombre)) return { type: 'interaccion' };
		const objetivo = datos.order_objective;
		return {
			type: 'orden',
			orderName: nombre,
			orderObjective: typeof objetivo === 'string' && objetivo.trim() ? objetivo.trim() : null,
		};
	}

	if (tipo === 'statistics') return { type: 'statistics' };
	return { type: 'interaccion' };
}

/**
 * Clasifica el mensaje con el modelo local antes de responder.
 *
 * Es el mismo paso que el backend hace con Gemini y OpenRouter; aquí ocurre en
 * el navegador porque con proveedor local el backend nunca ve el mensaje.
 */
export async function classifyLocalMessage(
	config: LocalAiConfig,
	message: string,
	assistPrompt: string,
	signal?: AbortSignal,
): Promise<LocalIntent> {
	if (!assistPrompt) return { type: 'interaccion' };

	try {
		let salida = '';
		for await (const delta of streamLocalCompletion(config, {
			message: assistPrompt + message,
			signal,
		})) {
			salida += delta;
			// El JSON de una orden es corto; si el modelo se enrolla, no lo es.
			if (salida.length > 600) break;
		}
		return parseIntent(salida);
	} catch (error) {
		// Si la clasificación falla, se sigue como conversación normal: perder una
		// orden es molesto, pero quedarse sin responder lo es más.
		console.error('No se pudo clasificar el mensaje:', error);
		return { type: 'interaccion' };
	}
}

/** Pide al backend que aplique la orden: el token de Twitch solo vive allí. */
export async function executeLocalOrder(
	intent: Extract<LocalIntent, { type: 'orden' }>,
	signal?: AbortSignal,
): Promise<boolean> {
	const response = await backendClient.post<{ executed?: boolean }>(
		'/ai/local/order',
		{ order_name: intent.orderName, order_objective: intent.orderObjective },
		{ signal },
	);
	return response.data?.executed === true;
}

/** Datos del canal para que el modelo local pueda contarlos. */
export async function fetchLocalStats(signal?: AbortSignal): Promise<string> {
	const response = await backendClient.get<{ stats?: string }>('/ai/local/stats', { signal });
	return response.data?.stats ?? '';
}
