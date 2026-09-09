export type TtsProvider = 'edge_tts' | 'local_tts' | 'fish_audio';

const TTS_PROVIDER_KEY = 'sandy_tts_provider';
const EDGE_VOICE_KEY = 'sandy_edge_voice';
const EDGE_RATE_KEY = 'sandy_edge_rate';
const EDGE_PITCH_KEY = 'sandy_edge_pitch';
const LOCAL_TTS_URL_KEY = 'sandy_local_tts_url';
const LOCAL_TTS_VOICE_KEY = 'sandy_local_tts_voice';

export const DEFAULT_EDGE_VOICE = 'es-ES-ElviraNeural';
export const DEFAULT_LOCAL_TTS_URL = 'http://localhost:8020';
export const DEFAULT_LOCAL_TTS_VOICE = 'sandy';

export type EdgeVoiceOption = {
	id: string;
	name: string;
	lang: string;
	gender: 'female' | 'male';
};

export const EDGE_VOICE_PRESETS: EdgeVoiceOption[] = [
	{
		id: 'es-ES-ElviraNeural',
		name: 'España - Elvira (Recomendada)',
		lang: 'es-ES',
		gender: 'female',
	},
	{ id: 'es-ES-AlvaroNeural', name: 'España - Álvaro', lang: 'es-ES', gender: 'male' },
	{ id: 'es-MX-DaliaNeural', name: 'México - Dalia', lang: 'es-MX', gender: 'female' },
	{ id: 'es-MX-JorgeNeural', name: 'México - Jorge', lang: 'es-MX', gender: 'male' },
	{ id: 'es-CO-SalomeNeural', name: 'Colombia - Salomé', lang: 'es-CO', gender: 'female' },
	{ id: 'es-AR-ElenaNeural', name: 'Argentina - Elena', lang: 'es-AR', gender: 'female' },
	{ id: 'es-CL-CatalinaNeural', name: 'Chile - Catalina', lang: 'es-CL', gender: 'female' },
	{ id: 'es-US-PalomaNeural', name: 'EE.UU. - Paloma', lang: 'es-US', gender: 'female' },
	{ id: 'en-US-JennyNeural', name: 'English US - Jenny', lang: 'en-US', gender: 'female' },
	{ id: 'en-US-GuyNeural', name: 'English US - Guy', lang: 'en-US', gender: 'male' },
	{
		id: 'ja-JP-NanamiNeural',
		name: 'Japón - Nanami (VTuber style)',
		lang: 'ja-JP',
		gender: 'female',
	},
];

export type EdgeTtsConfig = {
	voice: string;
	rate?: string;
	pitch?: string;
};

export type LocalTtsConfig = {
	baseUrl: string;
	voice: string;
};

const readStorage = (key: string): string => {
	if (typeof window === 'undefined') return '';
	try {
		return window.localStorage.getItem(key)?.trim() ?? '';
	} catch {
		return '';
	}
};

const writeStorage = (key: string, value: string): void => {
	if (typeof window === 'undefined') return;
	try {
		if (value.trim()) {
			window.localStorage.setItem(key, value.trim());
		} else {
			window.localStorage.removeItem(key);
		}
	} catch {
		// Ignore storage write errors.
	}
};

export function getStoredTtsProvider(): TtsProvider {
	const val = readStorage(TTS_PROVIDER_KEY);
	if (val === 'edge_tts' || val === 'local_tts' || val === 'fish_audio') {
		return val;
	}
	return 'edge_tts';
}

export function storeTtsProvider(provider: TtsProvider): void {
	writeStorage(TTS_PROVIDER_KEY, provider);
}

export function getStoredEdgeTtsConfig(): EdgeTtsConfig {
	return {
		voice: readStorage(EDGE_VOICE_KEY) || DEFAULT_EDGE_VOICE,
		rate: readStorage(EDGE_RATE_KEY) || '+0%',
		pitch: readStorage(EDGE_PITCH_KEY) || '+0Hz',
	};
}

export function storeEdgeTtsConfig(config: Partial<EdgeTtsConfig>): void {
	if (config.voice !== undefined) writeStorage(EDGE_VOICE_KEY, config.voice);
	if (config.rate !== undefined) writeStorage(EDGE_RATE_KEY, config.rate);
	if (config.pitch !== undefined) writeStorage(EDGE_PITCH_KEY, config.pitch);
}

export function getStoredLocalTtsConfig(): LocalTtsConfig {
	return {
		baseUrl: readStorage(LOCAL_TTS_URL_KEY) || DEFAULT_LOCAL_TTS_URL,
		voice: readStorage(LOCAL_TTS_VOICE_KEY) || DEFAULT_LOCAL_TTS_VOICE,
	};
}

export function storeLocalTtsConfig(config: Partial<LocalTtsConfig>): void {
	if (config.baseUrl !== undefined) writeStorage(LOCAL_TTS_URL_KEY, config.baseUrl);
	if (config.voice !== undefined) writeStorage(LOCAL_TTS_VOICE_KEY, config.voice);
}
