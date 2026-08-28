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
	'error.storage-unavailable':
		'No se pudo acceder a la base de datos. Inténtalo de nuevo en unos minutos.',
	'error.not-found': 'No se encontró el recurso solicitado.',
};

const FALLBACK = AI_ERROR_MESSAGES['error.unknown'];

/**
 * Error de IA que ya viene clasificado por el backend. Lo usa el cliente de
 * streaming, donde el fallo llega como evento SSE y no como respuesta de axios.
 */
export class AiResponseError extends Error {
	readonly payload: AiErrorPayload;

	constructor(payload: AiErrorPayload) {
		super(payload.message ?? 'No se pudo generar una respuesta');
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
	const known = AI_ERROR_MESSAGES[payload.code as AiErrorCode];
	return known ?? payload.message ?? FALLBACK;
}

export function isAiErrorRetryable(error: unknown): boolean {
	return extractPayload(error)?.retryable === true;
}
