export type SettingsFormState = {
	ai_provider: 'gemini' | 'openrouter';
	gemini_api_key: string;
	openrouter_api_key: string;
	openrouter_model: string;
	stt_provider: string;
	tts_provider: string;
	azure_speech_key: string;
	azure_region: string;
	language: string;
	fish_audio_key: string;
	voice_id: string;
	service_mode: 'manual' | 'hybrid';
	auto_start_on_live: boolean;
	auto_stop_on_offline: boolean;
	idle_timeout_minutes: number;
	chunk_size: number;
};

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
