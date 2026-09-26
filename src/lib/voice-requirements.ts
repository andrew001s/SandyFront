import { isValidLocalAiUrl } from '@/api/localAi';
import type { SettingsPayload } from '@/api/settings';
import type { AiProvider } from '@/lib/ai-provider';
import type { LocalAiSettings } from '@/lib/local-ai-config';
import type { SttProvider } from '@/lib/stt-provider';
import { getStoredLocalTtsConfig, getStoredTtsProvider } from '@/lib/tts-provider';

export const SETTINGS_AI_TAB_HREF = '/settings?tab=ai';
export const SETTINGS_SPEECH_TAB_HREF = '/settings?tab=speech';
export const SETTINGS_VOICE_TAB_HREF = '/settings?tab=voice';

export type VoiceRequirementId = 'ai-model' | 'speech-recognition' | 'tts-voice';

export type VoiceRequirement = {
	id: VoiceRequirementId;
	title: string;
	description: string;
	href: string;
	actionLabel: string;
};

type VoiceRequirementsInput = {
	settings: SettingsPayload | null;
	/** Resuelto por quien llama, igual que `sttProvider`: la elección vive en el
	 *  navegador y el backend no siempre la devuelve. */
	aiProvider: AiProvider;
	localAi: LocalAiSettings;
	sttProvider: SttProvider | string;
	browserSupportsSpeechRecognition: boolean;
};

const hasValue = (value?: string | null) => Boolean(value?.trim());

/**
 * Devuelve los pasos de configuración que faltan para poder encender el micrófono.
 * Un array vacío significa que se puede empezar a escuchar.
 */
export function getMissingVoiceRequirements({
	settings,
	aiProvider,
	localAi,
	sttProvider,
	browserSupportsSpeechRecognition,
}: VoiceRequirementsInput): VoiceRequirement[] {
	const missing: VoiceRequirement[] = [];
	const isAiConfigured =
		aiProvider === 'openrouter'
			? hasValue(settings?.openrouter_api_key) && hasValue(settings?.openrouter_model)
			: aiProvider === 'local'
				? isValidLocalAiUrl(localAi.baseUrl)
				: hasValue(settings?.gemini_api_key);

	if (!isAiConfigured) {
		missing.push({
			id: 'ai-model',
			title: 'Configura el modelo de IA',
			description:
				aiProvider === 'openrouter'
					? 'Falta tu API key de OpenRouter o el modelo que quieres usar. Sin eso tu VTuber no puede responder a lo que digas.'
					: aiProvider === 'local'
						? 'Falta la URL de tu modelo local, o no es una URL válida. Sin eso tu VTuber no puede responder a lo que digas.'
						: 'Falta tu API key de Gemini. Sin eso tu VTuber no puede responder a lo que digas.',
			href: SETTINGS_AI_TAB_HREF,
			actionLabel: 'Configurar IA',
		});
	}

	const isSpeechConfigured =
		sttProvider === 'browser'
			? browserSupportsSpeechRecognition
			: hasValue(settings?.azure_speech_key) && hasValue(settings?.azure_region);

	if (!isSpeechConfigured) {
		missing.push({
			id: 'speech-recognition',
			title: 'Configura el reconocimiento de voz',
			description:
				sttProvider === 'browser'
					? 'El reconocimiento gratuito del navegador solo funciona en Chrome y otros navegadores basados en Chromium. Cambia a Azure Speech o abre Sandy Studio en Chrome.'
					: 'Faltan la clave o la región de Azure Speech. Sin eso no se puede transcribir lo que dices.',
			href: SETTINGS_SPEECH_TAB_HREF,
			actionLabel: 'Configurar reconocimiento',
		});
	}

	// La voz solo hace falta si las respuestas por voz están activas.
	const needsVoiceReplies = settings?.feature_flags?.voice_replies !== false;
	const ttsProvider = getStoredTtsProvider();

	if (needsVoiceReplies) {
		if (ttsProvider === 'fish_audio') {
			const isFishConfigured = hasValue(settings?.fish_audio_key) && hasValue(settings?.voice_id);
			if (!isFishConfigured) {
				missing.push({
					id: 'tts-voice',
					title: 'Configura la voz de Sandy (Fish Audio)',
					description:
						'Faltan tu API key de Fish Audio o el Voice ID. Sin eso Sandy no puede hablar con voz de nube. Puedes cambiar a Edge TTS (gratuito) en Ajustes > Voz.',
					href: SETTINGS_VOICE_TAB_HREF,
					actionLabel: 'Configurar voz',
				});
			}
		} else if (ttsProvider === 'local_tts') {
			const localConfig = getStoredLocalTtsConfig();
			if (!hasValue(localConfig.baseUrl)) {
				missing.push({
					id: 'tts-voice',
					title: 'Configura el servidor TTS local',
					description:
						'Falta la URL de tu servidor TTS local (XTTS-v2 / Kokoro). Asegúrate de tener el servidor encendido o cambia a Edge TTS en Ajustes > Voz.',
					href: SETTINGS_VOICE_TAB_HREF,
					actionLabel: 'Configurar TTS local',
				});
			}
		}
		// edge_tts está siempre configurado por defecto y no requiere credenciales
	}

	return missing;
}
