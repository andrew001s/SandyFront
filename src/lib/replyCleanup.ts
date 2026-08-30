/**
 * Deja una respuesta lista para leer en voz alta.
 *
 * Es el equivalente de `strip_formatting` en `app/services/gemini.py`, que sigue
 * siendo la versión autoritativa: el backend la necesita igual para lo que
 * guarda en el historial y para lo que escribe en el chat de Twitch.
 *
 * Aquí vive la red de seguridad de lo que llega a la VOZ, y cubre a los tres
 * proveedores. Con Gemini y OpenRouter el backend ya limpia y esto no cambia
 * nada; con el modelo local el navegador habla directo con el modelo y este era
 * el único punto donde se podía limpiar.
 */

const BACKTICKS = /`+/g;
const MD_LINK = /\[([^\]]+)\]\([^)]*\)/g;
const LINE_PREFIX = /^[ \t]{0,3}(?:#{1,6}[ \t]+|>[ \t]?|[-*+][ \t]+|\d+[.)][ \t]+)/gm;
const BOLD = /\*\*([^*]+)\*\*|__([^_]+)__/g;
/** Asteriscos simples: es roleo narrado y se va entero, no solo las marcas. */
const ROLEPLAY = /\*[^*\n]+\*/g;
const ITALIC = /_([^_\n]+)_/g;
const DASHES = /[\u2014\u2013\u2015]/g;
const LEFTOVER = /[*_`#>]/g;
const SPACE_BEFORE_PUNCT = /\s+([,.;:!?…])/g;
const WHITESPACE = /\s+/g;

/**
 * Emojis y pictogramas.
 *
 * Rangos concretos en vez de "todo lo que no sea ASCII", que se llevaría por
 * delante las tildes, las eñes y los signos de apertura del español.
 */
const EMOJI =
	/[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\u2600-\u26FF\u2700-\u27BF\u2B00-\u2BFF\u2190-\u21FF\u3030\u303D\u3297\u3299\uFE00-\uFE0F\u200D\u20E3]+/gu;

export function cleanSpokenText(text: string): string {
	if (!text) return '';

	return text
		.replace(BACKTICKS, '')
		.replace(MD_LINK, '$1')
		.replace(LINE_PREFIX, '')
		.replace(BOLD, (_m, a, b) => a ?? b)
		.replace(ROLEPLAY, ' ')
		.replace(ITALIC, '$1')
		.replace(DASHES, ' ')
		.replace(EMOJI, ' ')
		.replace(LEFTOVER, '')
		.replace(WHITESPACE, ' ')
		.replace(SPACE_BEFORE_PUNCT, '$1')
		.replace(/^[\s,;:-]+|[\s,;:-]+$/g, '');
}

/**
 * ¿Dónde empieza el turno que el modelo no debería haber escrito?
 *
 * Los modelos locales siguen la conversación solos y escriben "user: ..." o su
 * propio nombre otra vez. Sin secuencias de parada que los corten, eso llegaba
 * entero a la voz. Devuelve -1 si no hay nada que cortar.
 */
export function turnMarkerIndex(text: string, markers: string[]): number {
	const lowered = text.toLowerCase();
	let corte = -1;
	for (const marker of markers) {
		const limpio = marker.trim().toLowerCase();
		if (!limpio) continue;
		const i = lowered.indexOf(limpio);
		if (i >= 0 && (corte === -1 || i < corte)) corte = i;
	}
	return corte;
}
