import { type SettingsUpdate, TTS_PROVIDER, saveSettings } from '@/api/settings';
import type { OnboardingFlowData } from '@/components/onboarding/onboarding.types';
import { type BannedContentPayload, toBannedContentPayload } from '@/lib/banned-content';

export function buildOnboardingSettingsPayload(flowData: OnboardingFlowData): SettingsUpdate {
	const payload: SettingsUpdate = {};

	if (flowData.aiProvider !== undefined) {
		payload.ai_provider = flowData.aiProvider;
	}

	if (flowData.geminiApiKey !== undefined) {
		payload.gemini_api_key = flowData.geminiApiKey;
	}

	if (flowData.openrouterApiKey !== undefined) {
		payload.openrouter_api_key = flowData.openrouterApiKey;
	}

	if (flowData.openrouterModel !== undefined) {
		payload.openrouter_model = flowData.openrouterModel;
	}

	if (flowData.fishAudioKey !== undefined) {
		payload.fish_audio_key = flowData.fishAudioKey;
		payload.tts_provider = TTS_PROVIDER;
	}

	if (flowData.voiceId !== undefined) {
		payload.voice_id = flowData.voiceId;
		payload.tts_provider = TTS_PROVIDER;
	}

	if (flowData.sttProvider !== undefined) {
		payload.stt_provider = flowData.sttProvider;
	}

	if (flowData.azureSpeechKey !== undefined) {
		payload.azure_speech_key = flowData.azureSpeechKey;
	}

	if (flowData.azureRegion !== undefined) {
		payload.azure_region = flowData.azureRegion;
	}

	if (flowData.language !== undefined) {
		payload.language = flowData.language;
	}

	if (flowData.sandyCoreConfig?.persona_profile !== undefined) {
		payload.persona_profile = flowData.sandyCoreConfig.persona_profile;
	}

	if (flowData.sandyCoreConfig?.feature_flags !== undefined) {
		payload.feature_flags = flowData.sandyCoreConfig.feature_flags;
	}

	const banned = flowData.sandyCoreConfig?.banned_content;
	if (banned) {
		const bannedPayload = toBannedContentPayload(banned);
		for (const [key, value] of Object.entries(bannedPayload)) {
			if (value !== undefined) {
				payload[key as keyof BannedContentPayload] = value;
			}
		}
	}

	return payload;
}

export async function submitOnboardingSettings(
	flowData: OnboardingFlowData,
	token?: string | null,
) {
	const payload = buildOnboardingSettingsPayload(flowData);

	if (Object.keys(payload).length === 0) {
		return null;
	}

	return saveSettings(payload, { token });
}
