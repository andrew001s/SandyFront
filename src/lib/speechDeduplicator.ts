/**
 * Deduplicador de voz y oraciones recientes.
 *
 * Evita la duplicidad en cascada cuando el mismo mensaje se sintetiza
 * en streaming (frase por frase desde Dictaphone o IA local) y simultáneamente
 * llega como evento global SSE desde el backend (/stream en Chat.tsx).
 */
export function normalizeSpeechText(text: string): string {
	return text
		.toLowerCase()
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.replace(/[^\p{L}\p{N}\s]/gu, '')
		.replace(/\s+/g, ' ')
		.trim();
}

interface SpeechEntry {
	text: string;
	normalized: string;
	timestamp: number;
}

export class SpeechDeduplicator {
	private recent: SpeechEntry[] = [];
	private windowMs: number;

	constructor(windowMs = 25_000) {
		this.windowMs = windowMs;
	}

	private cleanup(now: number): void {
		this.recent = this.recent.filter((entry) => now - entry.timestamp <= this.windowMs);
	}

	/**
	 * Comprueba si un texto (o una porción significativa del mismo) ya fue
	 * sintetizado o recibido recientemente.
	 */
	isDuplicateOrRecent(text: string): boolean {
		const now = Date.now();
		this.cleanup(now);

		const norm = normalizeSpeechText(text);
		if (norm.length < 3) return false;

		for (const entry of this.recent) {
			// Coincidencia exacta
			if (entry.normalized === norm) {
				return true;
			}
			// Coincidencia por contención (subcadena) para textos largos (oraciones)
			const minLen = Math.min(norm.length, entry.normalized.length);
			if (minLen >= 25) {
				if (norm.includes(entry.normalized) || entry.normalized.includes(norm)) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Registra un texto o segmento como hablado recientemente.
	 */
	record(text: string): void {
		const now = Date.now();
		this.cleanup(now);

		const norm = normalizeSpeechText(text);
		if (norm.length < 3) return;

		this.recent.push({ text, normalized: norm, timestamp: now });
	}

	/**
	 * Si es duplicado devuelve true. Si no, lo registra y devuelve false.
	 */
	checkAndRecord(text: string): boolean {
		if (this.isDuplicateOrRecent(text)) {
			return true;
		}
		this.record(text);
		return false;
	}

	/** Limpia todo el historial de duplicados. */
	clear(): void {
		this.recent = [];
	}
}

export const speechDeduplicator = new SpeechDeduplicator();
