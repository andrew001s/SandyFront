import { backendClient } from '@/api/backendClient';

export type LocalAiContext = {
	/** Prompt listo para el `system` del modelo local: reglas, persona e historial. */
	systemPrompt: string;
	personaName: string;
	stop: string[];
	history: string;
};

type ContextResponse = {
	context?: {
		system_prompt?: string;
		persona_name?: string;
		stop?: string[];
		history?: string;
	};
};

/**
 * Trae del backend los prompts y la personalidad cargada del usuario.
 *
 * Con Gemini y OpenRouter el backend los inyecta por su cuenta. Con el modelo
 * local el navegador llama directo, así que necesita pedirlos aquí y ponerlos
 * en el system prompt; si no, el modelo responde sin personaje ni reglas.
 *
 * El historial cambia en cada turno, así que conviene pedirlo antes de cada
 * mensaje en vez de guardarlo.
 */
export async function fetchLocalAiContext(signal?: AbortSignal): Promise<LocalAiContext> {
	const response = await backendClient.get<ContextResponse>('/ai/local/context', { signal });
	const context = response.data?.context ?? {};

	return {
		systemPrompt: context.system_prompt ?? '',
		personaName: context.persona_name ?? '',
		stop: context.stop ?? [],
		history: context.history ?? '',
	};
}
