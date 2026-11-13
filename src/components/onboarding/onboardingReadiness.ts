import type { OnboardingFlowData } from './onboarding.types';

export function voiceSignature(data: OnboardingFlowData) {
	const value = JSON.stringify([
		data.ttsProvider ?? 'edge_tts',
		data.ttsProvider === 'fish_audio'
			? [data.voiceId, data.fishAudioKey]
			: data.ttsProvider === 'local_tts'
				? data.localTts
				: data.edgeTts,
	]);
	let fingerprint = 0;
	for (const character of value)
		fingerprint = (Math.imul(fingerprint, 31) + character.charCodeAt(0)) | 0;
	return fingerprint.toString(16);
}

export function onboardingReadiness(data: OnboardingFlowData) {
	const ai =
		data.aiProvider === 'local'
			? Boolean(data.localApiUrl?.trim())
			: data.aiProvider === 'openrouter'
				? Boolean(data.openrouterApiKey?.trim())
				: Boolean(data.geminiApiKey?.trim());
	const voice =
		data.ttsProvider === 'edge_tts' ||
		(data.ttsProvider === 'local_tts'
			? Boolean(data.localTts?.baseUrl?.trim() && data.localTts.voice.trim())
			: Boolean(data.fishAudioKey?.trim() && data.voiceId?.trim()));
	return [
		{
			step: 'ai',
			label: 'Respuestas de IA',
			status: ai ? 'Datos completos, sin probar' : 'Faltan datos',
		},
		{
			step: 'voice',
			label: 'Voz de Sandy',
			status:
				voice && data.voiceTestSignature === voiceSignature(data)
					? 'Prueba de voz realizada'
					: voice
						? 'Configurada, sin probar'
						: 'Faltan datos',
		},
		{
			step: 'speech',
			label: 'Hablar con Sandy',
			status:
				data.sttProvider === 'browser'
					? 'Navegador elegido, falta probar el micrófono'
					: data.sttProvider === 'azure' && data.azureSpeechKey?.trim() && data.azureRegion
						? 'Datos completos, sin probar'
						: 'Decidir después',
		},
		{
			step: 'vtube-studio',
			label: 'Avatar',
			status: data.avatarMode
				? `${{ pngtuber: 'PNGTuber', live2d: 'Live2D', vrm: 'VRM' }[data.avatarMode]} elegido, se prepara en el estudio`
				: 'Elegir en el estudio',
		},
		{
			step: 'connections',
			label: 'Chat del directo',
			status:
				data.twitchConnected || data.kickConnected || data.youtubeConnected
					? 'Conexión detectada en este recorrido'
					: 'Sin conexión comprobada',
		},
	];
}
