import type { OnboardingFlowData } from './onboarding.types';

const validUrl = (value?: string) => {
	try {
		return ['http:', 'https:'].includes(new URL(value ?? '').protocol);
	} catch {
		return false;
	}
};

export function onboardingStepError(
	step: string | undefined,
	data: OnboardingFlowData,
): string | null {
	if (step === 'ai') {
		if (data.aiProvider === 'local')
			return validUrl(data.localApiUrl)
				? null
				: 'Introduce la URL de tu servidor de IA, empezando por http:// o https://.';
		if (data.aiProvider === 'openrouter')
			return data.openrouterApiKey?.trim()
				? null
				: 'Introduce tu clave de API de OpenRouter o elige Decidir después.';
		return data.geminiApiKey?.trim()
			? null
			: 'Introduce tu clave de API de Gemini o elige Decidir después.';
	}
	if (step === 'voice') {
		if (data.ttsProvider === 'fish_audio' && (!data.fishAudioKey?.trim() || !data.voiceId?.trim()))
			return 'Fish Audio necesita una clave de API y una voz. Completa ambos datos o elige Decidir después.';
		if (
			data.ttsProvider === 'local_tts' &&
			(!validUrl(data.localTts?.baseUrl) || !data.localTts?.voice.trim())
		)
			return 'Introduce una URL válida y el identificador de voz del servidor local.';
	}
	if (
		step === 'speech' &&
		data.sttProvider === 'azure' &&
		(!data.azureSpeechKey?.trim() || !data.azureRegion)
	)
		return 'Azure Speech necesita una clave y la región del mismo recurso. También puedes elegir el navegador o decidir después.';
	if (step === 'speech' && data.sttProvider === 'browser' && typeof window !== 'undefined') {
		const browser = window as Window & {
			SpeechRecognition?: unknown;
			webkitSpeechRecognition?: unknown;
		};
		if (!browser.SpeechRecognition && !browser.webkitSpeechRecognition)
			return 'Este navegador no ofrece reconocimiento de voz. Usa Azure Speech, cambia de navegador o elige Decidir después.';
	}
	return null;
}
