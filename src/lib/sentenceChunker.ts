/**
 * Corta un flujo de texto en segmentos "hablables".
 *
 * El objetivo es latencia: en cuanto hay una frase completa se puede mandar a
 * TTS sin esperar al resto de la respuesta. Los límites están para que el primer
 * segmento salga pronto pero sin trocear tanto que la voz suene entrecortada.
 */
const HARD_STOPS = /[.!?…]/;
const SOFT_STOPS = /[,;:]/;

export type SentenceChunkerOptions = {
	/** Por debajo de esto no se corta, para no sintetizar "Ah." suelto. */
	minLength?: number;
	/** A partir de aquí vale cortar por coma o punto y coma. */
	softLength?: number;
	/** Corte forzado aunque no haya puntuación, para texto sin puntuar. */
	maxLength?: number;
	/**
	 * Umbrales solo para el PRIMER segmento, que es el que decide cuándo empieza
	 * a sonar la voz. Con los normales, una respuesta breve —que es lo que pide
	 * el prompt— daba un único segmento cortado al final: el audio no arrancaba
	 * hasta que el modelo había terminado de generar.
	 */
	firstMinLength?: number;
	firstSoftLength?: number;
	firstMaxLength?: number;
};

export type SentenceChunker = {
	/** Añade texto y devuelve los segmentos que ya están completos. */
	push: (text: string) => string[];
	/** Devuelve lo que quede pendiente y vacía el buffer. */
	flush: () => string | null;
};

export function createSentenceChunker(options: SentenceChunkerOptions = {}): SentenceChunker {
	const {
		minLength = 12,
		softLength = 60,
		maxLength = 220,
		firstMinLength = 8,
		firstSoftLength = 15,
		firstMaxLength = 70,
	} = options;
	let buffer = '';
	// Solo el primer corte va con prisa. A partir de ahí ya suena audio, así que
	// se vuelve a los umbrales largos para que la voz no salga entrecortada.
	let primero = true;

	const takeUpTo = (index: number): string => {
		const segment = buffer.slice(0, index + 1).trim();
		buffer = buffer.slice(index + 1);
		return segment;
	};

	const nextCut = (): number => {
		const min = primero ? firstMinLength : minLength;
		const soft = primero ? firstSoftLength : softLength;
		const max = primero ? firstMaxLength : maxLength;

		for (let i = 0; i < buffer.length; i++) {
			const char = buffer[i];
			const length = i + 1;

			if (char === '\n' && length >= min) {
				return i;
			}

			if (HARD_STOPS.test(char) && length >= min) {
				// No cortar dentro de "3.14" ni de puntos suspensivos a medias.
				const next = buffer[i + 1];
				if (next && !/[\s"'”’)\]]/.test(next)) {
					continue;
				}
				return i;
			}

			if (SOFT_STOPS.test(char) && length >= soft) {
				return i;
			}

			if (length >= max) {
				// Retroceder al último espacio para no partir una palabra.
				const lastSpace = buffer.lastIndexOf(' ', i);
				return lastSpace > min ? lastSpace : i;
			}
		}

		return -1;
	};

	return {
		push(text: string): string[] {
			buffer += text;
			const segments: string[] = [];

			let cut = nextCut();
			while (cut !== -1) {
				const segment = takeUpTo(cut);
				if (segment) {
					segments.push(segment);
					primero = false;
				}
				cut = nextCut();
			}

			return segments;
		},

		flush(): string | null {
			const remaining = buffer.trim();
			buffer = '';
			return remaining || null;
		},
	};
}
