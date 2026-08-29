/**
 * Códigos de error que devuelve el backend, para IA y para el resto de módulos.
 *
 * Todo endpoint responde un fallo con la misma forma:
 *   { error: { code, message, provider, model, retryable } }
 *
 * Aquí se decide el texto que ve el usuario a partir del `code`. Los mensajes
 * crudos de Twitch, Kick, YouTube o el proveedor de IA cambian sin aviso y no
 * sirven como contrato.
 *
 * Nota: 401 queda reservado para la sesión de Clerk. Los estados de "falta un
 * paso previo" (sin vincular, hay que reautorizar, falta canal) llegan con 409.
 */

export type AiErrorCode =
	// Proveedor de IA
	| 'error.rate-limit'
	| 'error.insufficient-credits'
	| 'error.invalid-api-key'
	| 'error.forbidden'
	| 'error.model-not-found'
	| 'error.invalid-request'
	| 'error.provider-unavailable'
	| 'error.timeout'
	| 'error.content-blocked'
	| 'error.empty-response'
	// Integraciones de plataforma y configuración
	| 'error.not-connected'
	| 'error.reauth-required'
	| 'error.no-active-user'
	| 'error.missing-config'
	| 'error.channel-not-configured'
	| 'error.no-broadcast'
	| 'error.service-not-running'
	| 'error.storage-unavailable'
	| 'error.order-failed'
	| 'error.category-not-found'
	// Genéricos
	| 'error.not-found'
	| 'error.unknown';

export type AiErrorPayload = {
	code: AiErrorCode | string;
	message?: string;
	provider?: string | null;
	model?: string | null;
	retryable?: boolean;
};

export const AI_ERROR_MESSAGES: Record<AiErrorCode, string> = {
	'error.rate-limit':
		'Superaste el límite de llamadas al modelo. Espera un momento o cambia a otro modelo en Ajustes.',
	'error.insufficient-credits':
		'No hay créditos suficientes en tu proveedor de IA. Recarga tu cuenta o usa un modelo gratuito.',
	'error.invalid-api-key': 'Tu API key del proveedor de IA no es válida. Revísala en Ajustes.',
	'error.forbidden': 'Tu API key no tiene permiso para usar este modelo.',
	'error.model-not-found': 'El modelo configurado ya no está disponible. Elige otro en Ajustes.',
	'error.invalid-request': 'La petición al proveedor de IA no es válida.',
	'error.provider-unavailable':
		'El proveedor de IA no está respondiendo. Inténtalo de nuevo en unos minutos.',
	'error.timeout': 'El proveedor de IA tardó demasiado en responder.',
	'error.content-blocked': 'El proveedor bloqueó la respuesta por sus filtros de contenido.',
	'error.empty-response': 'El proveedor de IA devolvió una respuesta vacía.',
	'error.unknown': 'No se pudo generar una respuesta con el proveedor de IA.',
	'error.not-connected':
		'Esta plataforma no está conectada todavía. Vincúlala desde el panel para continuar.',
	'error.reauth-required':
		'La sesión con la plataforma caducó. Vuelve a autorizar la cuenta desde el panel.',
	'error.no-active-user': 'No hay una cuenta activa para esta operación.',
	'error.missing-config':
		'Falta configuración del servidor para esta integración. Avisa al administrador.',
	'error.channel-not-configured':
		'Falta configurar el canal. Guarda la configuración o vuelve a vincular la cuenta.',
	'error.no-broadcast': 'No hay una transmisión activa en este momento.',
	'error.service-not-running': 'El servicio no está en marcha. Inícialo desde el panel.',
	'error.order-failed':
		'No se pudo aplicar la orden en tu canal. Revisa que Twitch siga conectado.',
	'error.category-not-found':
		'Twitch no tiene ninguna categoría con ese nombre. Prueba a decirlo tal cual aparece en Twitch.',
	'error.storage-unavailable':
		'No se pudo acceder a la base de datos. Inténtalo de nuevo en unos minutos.',
	'error.not-found': 'No se encontró el recurso solicitado.',
};

/**
 * Textos específicos de la síntesis de voz.
 *
 * El catálogo general habla del "modelo" y del "proveedor de IA", que despista
 * cuando lo que falla es Fish Audio: el usuario tiene que saber que la respuesta
 * se generó bien y lo que no salió fue la voz.
 */
export const VOICE_ERROR_MESSAGES: Partial<Record<AiErrorCode, string>> = {
	'error.invalid-api-key':
		'Tu API key de Fish Audio no es válida. Revísala en Ajustes; la VTuber responderá por texto mientras tanto.',
	'error.insufficient-credits':
		'Te quedaste sin créditos en Fish Audio. Recarga tu cuenta para que la VTuber vuelva a hablar.',
	'error.rate-limit':
		'Fish Audio está limitando las peticiones de voz. Espera un momento antes de seguir.',
	'error.provider-unavailable':
		'Fish Audio no está respondiendo. La VTuber sigue generando texto pero no puede hablar.',
	'error.forbidden': 'Tu cuenta de Fish Audio no tiene permiso para usar esa voz.',
	'error.not-found': 'La voz configurada ya no existe en Fish Audio. Elige otra en Ajustes.',
	'error.missing-config':
		'Falta tu API key de Fish Audio o el Voice ID. Configúralos en Ajustes → Voz, o apaga «Respuestas por voz» si solo quieres texto.',
	'error.unknown': 'No se pudo generar la voz con Fish Audio.',
};

export const VOICE_PROVIDER = 'fish_audio';

const FALLBACK = AI_ERROR_MESSAGES['error.unknown'];

/**
 * Error de IA que ya viene clasificado por el backend. Lo usa el cliente de
 * streaming, donde el fallo llega como evento SSE y no como respuesta de axios.
 */
function resolveMessage(payload: AiErrorPayload): string {
	const code = payload.code as AiErrorCode;
	if (payload.provider === VOICE_PROVIDER) {
		const voice = VOICE_ERROR_MESSAGES[code];
		if (voice) {
			return voice;
		}
	}
	return AI_ERROR_MESSAGES[code] ?? AI_ERROR_MESSAGES['error.unknown'];
}

export class AiResponseError extends Error {
	readonly payload: AiErrorPayload;

	constructor(payload: AiErrorPayload) {
		// El texto del catálogo también en `message`: si no, tanto la consola como
		// Rollbar mostraban "No se pudo generar una respuesta" y había que abrir el
		// contexto para saber qué pasó de verdad.
		super(payload.message ?? resolveMessage(payload));
		this.name = 'AiResponseError';
		this.payload = payload;
	}
}

function isPayload(value: unknown): value is AiErrorPayload {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as AiErrorPayload).code === 'string'
	);
}

function extractPayload(error: unknown): AiErrorPayload | null {
	if (!error || typeof error !== 'object') {
		return null;
	}
	// Se detecta por forma, no con `instanceof`: si el módulo acaba cargado dos
	// veces (bundles distintos), la comprobación de clase falla en silencio y el
	// error clasificado se degradaría a 'error.unknown'.
	const direct = (error as { payload?: unknown }).payload;
	if (isPayload(direct)) {
		return direct;
	}
	// Forma de axios: error.response.data.error
	const data = (error as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
	if (data && typeof data === 'object' && 'code' in data) {
		return data as AiErrorPayload;
	}
	return null;
}

export function getAiErrorCode(error: unknown): AiErrorCode | string {
	return extractPayload(error)?.code ?? 'error.unknown';
}

/**
 * Texto para el usuario. Prioriza el catálogo local; si el backend estrena un
 * código que este cliente todavía no conoce, usa el mensaje que venga en la
 * respuesta antes de caer al genérico.
 */
export function getAiErrorMessage(error: unknown): string {
	const payload = extractPayload(error);
	if (!payload) {
		return FALLBACK;
	}
	const code = payload.code as AiErrorCode;
	if (payload.provider === VOICE_PROVIDER) {
		const voice = VOICE_ERROR_MESSAGES[code];
		if (voice) {
			return voice;
		}
	}
	const known = AI_ERROR_MESSAGES[code];
	return known ?? payload.message ?? FALLBACK;
}

export function isAiErrorRetryable(error: unknown): boolean {
	return extractPayload(error)?.retryable === true;
}
