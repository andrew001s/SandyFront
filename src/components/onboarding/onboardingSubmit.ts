import { saveSettings, type SettingsPayload } from '@/api/settings';
import type { OnboardingFlowData } from '@/components/onboarding/onboarding.types';

export function buildOnboardingSettingsPayload(flowData: OnboardingFlowData): SettingsPayload {
	const payload: SettingsPayload = {};

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
	}

	if (flowData.voiceId !== undefined) {
		payload.voice_id = flowData.voiceId;
	}

	if (flowData.sttProvider !== undefined) {
		payload.stt_provider = flowData.sttProvider;
	}

	return payload;
}

export async function submitOnboardingSettings(flowData: OnboardingFlowData, token?: string | null) {
	const payload = buildOnboardingSettingsPayload(flowData);

	if (Object.keys(payload).length === 0) {
		return null;
	}

	return saveSettings(payload, { token });
}
