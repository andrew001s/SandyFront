import { type AiErrorCode, AiResponseError, VOICE_PROVIDER } from '@/lib/ai-errors';
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

/** Fish Audio explica el motivo en el cuerpo; con responseType blob hay que leerlo. */
async function readErrorDetail(data: unknown): Promise<string> {
	try {
		if (data instanceof Blob) {
			return (await data.text()).slice(0, 300);
		}
		if (typeof data === 'string') {
			return data.slice(0, 300);
		}
		if (data) {
			return JSON.stringify(data).slice(0, 300);
		}
	} catch {
		// Cuerpo ilegible: el estado HTTP ya basta para clasificar.
	}
	return '';
}

function codeForStatus(status: number | undefined, detail: string): AiErrorCode {
	const lowered = detail.toLowerCase();
	if (/insufficient|no credit|not enough|balance|payment/.test(lowered)) {
		return 'error.insufficient-credits';
	}
	if (/invalid.*(key|token)|unauthorized|api key/.test(lowered)) {
		return 'error.invalid-api-key';
	}

	if (status === undefined) {
		return 'error.provider-unavailable';
	}
	if (status === 401 || status === 403) {
		return 'error.invalid-api-key';
	}
	if (status === 402) {
		return 'error.insufficient-credits';
	}
	if (status === 404) {
		return 'error.not-found';
	}
	if (status === 429) {
		return 'error.rate-limit';
	}
	if (status >= 500) {
		return 'error.provider-unavailable';
	}
	return 'error.invalid-request';
}

/**
 * Llama a Fish Audio y traduce el fallo al mismo catálogo de códigos que usa el
 * resto de la app, para que el usuario reciba un motivo y no un silencio.
 */
async function requestTts(
	url: string,
	body: unknown,
	config: Parameters<typeof axios.post>[2],
): Promise<{ status: number; data: unknown }> {
	try {
		return await axios.post(url, body, config);
	} catch (error) {
		if (axios.isCancel(error)) {
			throw error;
		}
		const response = (error as { response?: { status?: number; data?: unknown } }).response;
		const detail = await readErrorDetail(response?.data);
		throw new AiResponseError({
			code: codeForStatus(response?.status, detail),
			provider: VOICE_PROVIDER,
			retryable: response?.status === undefined || (response.status ?? 0) >= 500,
		});
	}
}

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
	const response = await requestTts(
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
		throw new AiResponseError({ code: 'error.unknown', provider: VOICE_PROVIDER });
	}

	return response.data as Blob;
}
