import { backendClient } from '@/api/backendClient';
import type { AiProvider } from '@/lib/ai-provider';
import type { FeatureFlags } from '@/lib/feature-flags';
import type { PersonaProfile } from '@/lib/persona-profile';

/**
 * Único proveedor de TTS soportado. El onboarding antiguo guardaba 'fish', así que
 * el valor se normaliza a esta constante al leer y al escribir para no arrastrarlo.
 */
export const TTS_PROVIDER = 'fish_audio';

export type SettingsPayload = {
	twitch_channel?: string;
	twitch_client_id?: string;
	twitch_client_secret?: string;
	redirect_uri?: string;
	gemini_api_key?: string;
	twitch_bot_account?: string;
	ai_provider?: AiProvider;
	openrouter_api_key?: string;
	openrouter_model?: string;
	local_api_url?: string;
	local_model?: string;
	stt_provider?: string;
	tts_provider?: string;
	azure_speech_key?: string;
	azure_region?: string;
	language?: string;
	fish_audio_key?: string;
	voice_id?: string;
	persona_profile?: PersonaProfile;
	feature_flags?: FeatureFlags;
	custom_banned_words?: string[];
	custom_banned_symbols?: string[];
	custom_banned_links?: string[];
	chunk_size?: number;
};

/**
 * Payload de escritura. `tts_provider` va estrechado a la constante para que un
 * literal suelto ('fish') no compile; la lectura sigue aceptando lo que haya
 * guardado el backend en perfiles antiguos.
 */
export type SettingsUpdate = Omit<SettingsPayload, 'tts_provider'> & {
	tts_provider?: typeof TTS_PROVIDER;
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
	payload: SettingsUpdate,
	options: RequestAuthOptions = {},
): Promise<SettingsResponse> {
	const response = await backendClient.put('/settings', payload, {
		headers: buildAuthHeaders(options.token),
	});
	return response.data;
}
