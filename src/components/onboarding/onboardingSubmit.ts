import { type SettingsUpdate, saveSettings } from '@/api/settings';
import type { OnboardingFlowData } from '@/components/onboarding/onboarding.types';
import { storeAiProvider } from '@/lib/ai-provider';
import { AVATAR_SOFTWARE_STORAGE_KEY } from '@/lib/avatar/constants';
import { type BannedContentPayload, toBannedContentPayload } from '@/lib/banned-content';
import { getStoredLocalAiSettings, storeLocalAiSettings } from '@/lib/local-ai-config';
import { storeSttProvider } from '@/lib/stt-provider';
import { storeEdgeTtsConfig, storeLocalTtsConfig, storeTtsProvider } from '@/lib/tts-provider';

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

	if (flowData.localApiUrl !== undefined) {
		payload.local_api_url = flowData.localApiUrl;
	}

	if (flowData.localModel !== undefined) {
		payload.local_model = flowData.localModel;
	}

	if (flowData.fishAudioKey !== undefined) {
		payload.fish_audio_key = flowData.fishAudioKey;
	}

	if (flowData.voiceId !== undefined) {
		payload.voice_id = flowData.voiceId;
	}
	if (flowData.ttsProvider !== undefined) payload.tts_provider = flowData.ttsProvider;
	else if (flowData.fishAudioKey !== undefined || flowData.voiceId !== undefined)
		payload.tts_provider = 'fish_audio';

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
	if (flowData.personaProfile !== undefined) payload.persona_profile = flowData.personaProfile;

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
	complete = false,
) {
	const payload = buildOnboardingSettingsPayload(flowData);
	if (flowData.avatarMode) localStorage.setItem(AVATAR_SOFTWARE_STORAGE_KEY, flowData.avatarMode);

	if (complete) payload.onboarding_completed = true;
	const result = Object.keys(payload).length ? await saveSettings(payload, { token }) : null;
	if (flowData.aiProvider) storeAiProvider(flowData.aiProvider);
	if (flowData.localApiUrl !== undefined || flowData.localModel !== undefined) {
		const stored = getStoredLocalAiSettings();
		storeLocalAiSettings({
			baseUrl: flowData.localApiUrl ?? stored.baseUrl,
			model: flowData.localModel ?? stored.model,
		});
	}
	if (flowData.ttsProvider) storeTtsProvider(flowData.ttsProvider);
	if (flowData.edgeTts) storeEdgeTtsConfig(flowData.edgeTts);
	if (flowData.localTts) storeLocalTtsConfig(flowData.localTts);
	if (flowData.sttProvider) storeSttProvider(flowData.sttProvider);
	return result;
}
