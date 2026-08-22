import axios from 'axios';

export type FishAudioConfig = {
	apiKey: string;
	voiceId: string;
};

export async function getVoiceSandy(message: string, config: FishAudioConfig): Promise<Blob> {
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
		},
		{
			headers: headers,
			responseType: 'blob',
		},
	);

	if (response.status !== 200) {
		throw new Error('Error al obtener el audio');
	}

	return response.data as Blob;
}
