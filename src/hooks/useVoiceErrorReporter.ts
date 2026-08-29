'use client';

import { getAiErrorCode, getAiErrorMessage } from '@/lib/ai-errors';
import { useRollbar } from '@rollbar/react';
import posthog from 'posthog-js';
import { useCallback, useRef } from 'react';
import { toast } from 'sonner';

/**
 * Reporte único de los fallos de síntesis de voz.
 *
 * Vive aquí y no en cada componente porque hay más de un sitio que sintetiza
 * —el micrófono y las tareas que llegan del backend— y basta con que uno se
 * olvide para que el usuario se quede sin voz y sin explicación.
 */
export function useVoiceErrorReporter() {
	const rollbar = useRollbar();
	// Un fallo de Fish Audio se repite en cada frase de la misma respuesta: se
	// avisa una vez por código, no una por segmento.
	const reported = useRef(new Set<string>());

	const report = useCallback(
		(segment: string, error: unknown) => {
			const code = getAiErrorCode(error);

			if (reported.current.has(code)) {
				return;
			}
			reported.current.add(code);

			toast.error(getAiErrorMessage(error));
			posthog.capture('tts_request_failed', { code, provider: 'fish_audio' });
			rollbar.error('Fallo de síntesis de voz (Fish Audio)', error as Error, {
				code,
				segment: segment.slice(0, 120),
			});
		},
		[rollbar],
	);

	/** Se llama al empezar una locución nueva para volver a avisar si repite. */
	const reset = useCallback(() => {
		reported.current.clear();
	}, []);

	return { report, reset };
}
