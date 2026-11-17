import posthog from 'posthog-js';

export type AiResponseMode = 'text' | 'voice';
export type AiResponseTiming = {
	llmLatencyMs?: number;
	ttsGenerationMs?: number;
	totalLatencyMs?: number;
	ttsProvider?: string;
};

/** Reglas compartidas para medir respuestas completas sin incluir su contenido. */
export function shouldTrackAiSuccess(text: string): boolean {
	return text.trim().length > 0;
}

/** El evento se emite solo después de completar el stream con texto no vacío. */
export function trackAiResponseSucceeded(
	text: string,
	provider: string,
	mode: AiResponseMode,
	interactionType: string,
	timing: AiResponseTiming = {},
): boolean {
	if (!shouldTrackAiSuccess(text)) return false;
	const llmLatencyMs = timing.llmLatencyMs;
	const ttsGenerationMs = timing.ttsGenerationMs;
	const totalLatencyMs = timing.totalLatencyMs;

	try {
		posthog.capture('ai_response_succeeded', {
			provider,
			mode,
			interaction_type: interactionType,
			...(typeof llmLatencyMs === 'number' && Number.isFinite(llmLatencyMs) && llmLatencyMs >= 0
				? { llm_latency_ms: Math.round(llmLatencyMs) }
				: {}),
			...(typeof ttsGenerationMs === 'number' &&
			Number.isFinite(ttsGenerationMs) &&
			ttsGenerationMs >= 0
				? { tts_generation_ms: Math.round(ttsGenerationMs) }
				: {}),
			...(typeof totalLatencyMs === 'number' &&
			Number.isFinite(totalLatencyMs) &&
			totalLatencyMs >= 0
				? { total_latency_ms: Math.round(totalLatencyMs) }
				: {}),
			...(timing.ttsProvider ? { tts_provider: timing.ttsProvider } : {}),
		});
	} catch {
		// Analytics failures must not turn a completed interaction into an error.
	}
	return true;
}

/** Registrar el inicio solo cuando el backend confirme que está activo. */
export function shouldTrackVtuberStart(wasRunning: boolean, confirmedRunning: boolean): boolean {
	return !wasRunning && confirmedRunning;
}

/** Capture the activation event only for a backend-confirmed inactive-to-active transition. */
export function trackVtuberStart(wasRunning: boolean, confirmedRunning: boolean): boolean {
	if (!shouldTrackVtuberStart(wasRunning, confirmedRunning)) return false;
	try {
		posthog.capture('vtuber_session_started');
	} catch {
		// Analytics failures must not affect the confirmed service state.
	}
	return true;
}
