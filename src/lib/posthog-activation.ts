/** Reglas puras de instrumentación; no llaman a PostHog ni a servicios externos. */
export function shouldTrackAiSuccess(text: string): boolean {
  return text.trim().length > 0;
}

/** El éxito de IA significa texto completo; los errores TTS se miden por separado. */
export function aiSuccessProperties(provider: string, mode: 'text' | 'voice') {
  return { provider, mode };
}

/** Registrar el inicio solo cuando el backend confirme que está activo. */
export function shouldTrackVtuberStart(wasRunning: boolean, confirmedRunning: boolean): boolean {
  return !wasRunning && confirmedRunning;
}
