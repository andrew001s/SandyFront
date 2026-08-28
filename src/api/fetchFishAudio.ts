import axios from 'axios';

export type FishAudioConfig = {
	apiKey: string;
	voiceId: string;
};

export type FishAudioRequestOptions = {
	/** 'low' prioriza tiempo hasta el primer byte; 'normal' prioriza calidad. */
	latency?: 'low' | 'normal' | 'balanced';
	format?: 'wav' | 'pcm' | 'mp3' | 'opus';
	signal?: AbortSignal;
};

export async function getVoiceSandy(
	message: string,
	config: FishAudioConfig,
	options: FishAudioRequestOptions = {},
): Promise<Blob> {
	const { apiKey, voiceId } = config;
	if (!apiKey || !voiceId) {
		throw new Error('Fish Audio no está configurado');
	}

	const headers = {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${apiKey}`,
	};
	const response = await axios.post(
		'/fish-api/v1/tts',
		{
			text: message,
			reference_id: voiceId,
			latency: options.latency ?? 'normal',
			format: options.format ?? 'mp3',
		},
		{
			headers: headers,
			responseType: 'blob',
			signal: options.signal,
		},
	);

	if (response.status !== 200) {
		throw new Error('Error al obtener el audio');
	}

	return response.data as Blob;
}
