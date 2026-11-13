import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildOnboardingSettingsPayload, submitOnboardingSettings } from './onboardingSubmit';

const saveSettings = vi.hoisted(() => vi.fn());
vi.mock('@/api/settings', () => ({ saveSettings }));

beforeEach(() => {
	localStorage.clear();
	saveSettings.mockReset();
});

describe('onboarding settings', () => {
	it('keeps credentials for the chosen provider without clearing another provider', () => {
		expect(
			buildOnboardingSettingsPayload({ aiProvider: 'gemini', geminiApiKey: 'placeholder-key' }),
		).toEqual({ ai_provider: 'gemini', gemini_api_key: 'placeholder-key' });
	});
	it('saves Edge TTS even when a Fish voice was configured earlier', () => {
		expect(
			buildOnboardingSettingsPayload({
				ttsProvider: 'edge_tts',
				fishAudioKey: 'previous',
				voiceId: 'previous-voice',
			}).tts_provider,
		).toBe('edge_tts');
	});
	it('does not mark completion when an intermediate save fails', async () => {
		saveSettings.mockRejectedValueOnce(new Error('offline'));
		await expect(
			submitOnboardingSettings({ aiProvider: 'gemini', geminiApiKey: 'placeholder-key' }, 'token'),
		).rejects.toThrow('offline');
		expect(saveSettings.mock.calls[0][0]).not.toHaveProperty('onboarding_completed');
		expect(localStorage.getItem('sandy_ai_provider')).toBeNull();
	});
	it('submits final configuration and its completion flag together', async () => {
		saveSettings.mockResolvedValueOnce({ settings: {} });
		await submitOnboardingSettings(
			{ ttsProvider: 'edge_tts', edgeTts: { voice: 'es-MX-DaliaNeural' }, avatarMode: 'vrm' },
			'token',
			true,
		);
		expect(saveSettings).toHaveBeenCalledOnce();
		expect(saveSettings).toHaveBeenCalledWith(
			{ tts_provider: 'edge_tts', onboarding_completed: true },
			{ token: 'token' },
		);
		expect(localStorage.getItem('sandy_edge_voice')).toBe('es-MX-DaliaNeural');
		expect(localStorage.getItem('sandy_avatar_software')).toBe('vrm');
	});
});
