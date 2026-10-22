import type { AiProvider } from '@/lib/ai-provider';
import type { TtsProvider } from '@/lib/tts-provider';

export type SettingsFormState = {
	ai_provider: AiProvider;
	gemini_api_key: string;
	openrouter_api_key: string;
	openrouter_model: string;
	local_api_url: string;
	local_model: string;
	stt_provider: string;
	tts_provider: TtsProvider;
	azure_speech_key: string;
	azure_region: string;
	language: string;
	fish_audio_key: string;
	voice_id: string;
	chunk_size: number;
	chat_trigger_mode: ChatTriggerMode;
	chat_command: string;
};

/**
 * Cómo se activa la respuesta del bot en el chat (Twitch, YouTube y Kick):
 * - 'batch': agrupa `chunk_size` mensajes y responde al lote.
 * - 'command': solo responde a los mensajes que empiezan por `chat_command`.
 */
export type ChatTriggerMode = 'batch' | 'command';

export type OpenRouterModel = {
	id: string;
	name: string;
	pricing?: {
		prompt?: string;
		completion?: string;
		request?: string;
	};
	architecture?: {
		modality?: string;
		output_modalities?: string[];
	};
	context_length?: number;
	created?: number;
	description?: string;
};

export type OpenRouterSort =
	| 'most-popular'
	| 'newest'
	| 'pricing-low-to-high'
	| 'pricing-high-to-low'
	| 'context-high-to-low'
	| 'latency-low-to-high'
	| 'throughput-high-to-low'
	| 'free-only';

export type DropdownOption = {
	flag?: string;
	label: string;
	value: string;
};
