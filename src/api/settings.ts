import { backendClient } from '@/api/backendClient';
import type { FeatureFlags, PersonaProfile, PromptOverrides } from '@/lib/sandycore-config';

export type SettingsPayload = {
	twitch_channel?: string;
	twitch_client_id?: string;
	twitch_client_secret?: string;
	redirect_uri?: string;
	gemini_api_key?: string;
	twitch_bot_account?: string;
	ai_provider?: 'gemini' | 'openrouter';
	openrouter_api_key?: string;
	openrouter_model?: string;
	stt_provider?: string;
	tts_provider?: string;
	azure_speech_key?: string;
	azure_region?: string;
	language?: string;
	fish_audio_key?: string;
	voice_id?: string;
	persona_profile?: PersonaProfile;
	prompt_overrides?: PromptOverrides;
	feature_flags?: FeatureFlags;
	custom_banned_words?: string[];
	custom_banned_symbols?: string[];
	custom_banned_links?: string[];
	service_mode?: 'manual' | 'hybrid';
	auto_start_on_live?: boolean;
	auto_stop_on_offline?: boolean;
	idle_timeout_minutes?: number;
	chunk_size?: number;
};

export type SettingsResponse = {
	settings: SettingsPayload | null;
};

type RequestAuthOptions = {
	token?: string | null;
};

const buildAuthHeaders = (token?: string | null) =>
	token
		? {
				Authorization: `Bearer ${token}`,
			}
		: undefined;

export async function getSettings(options: RequestAuthOptions = {}): Promise<SettingsResponse> {
	const response = await backendClient.get('/settings', {
		headers: buildAuthHeaders(options.token),
	});
	return response.data;
}

export async function saveSettings(
	payload: SettingsPayload,
	options: RequestAuthOptions = {},
): Promise<SettingsResponse> {
	const response = await backendClient.put('/settings', payload, {
		headers: buildAuthHeaders(options.token),
	});
	return response.data;
}
