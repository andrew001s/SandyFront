import { backendClient } from '@/api/backendClient';

/** Los prompts que el backend compone y el navegador no puede reconstruir. */
export type LocalAiPrompts = {
	/** Clasificador: decide si el mensaje es una orden, stats o charla. */
	assist: string;
	/** La VTuber respondiendo al chat. Se usa tras ejecutar una orden. */
	vtuber: string;
	/** La VTuber respondiendo a quien lleva el canal. */
	vtuberShandrew: string;
	/** La VTuber contando los datos del stream. */
	statistics: string;
};

export type LocalAiContext = {
	/** Prompt listo para el `system` del modelo local: reglas, persona e historial. */
	systemPrompt: string;
	personaName: string;
	stop: string[];
	history: string;
	prompts: LocalAiPrompts;
};

type ContextResponse = {
	context?: {
		system_prompt?: string;
		persona_name?: string;
		stop?: string[];
		history?: string;
		prompts?: Record<string, string>;
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

	const prompts = context.prompts ?? {};

	return {
		systemPrompt: context.system_prompt ?? '',
		personaName: context.persona_name ?? '',
		stop: context.stop ?? [],
		history: context.history ?? '',
		prompts: {
			assist: prompts.assist ?? '',
			vtuber: prompts.vtuber ?? '',
			vtuberShandrew: prompts.vtuber_shandrew ?? '',
			statistics: prompts.statistics ?? '',
		},
	};
}
