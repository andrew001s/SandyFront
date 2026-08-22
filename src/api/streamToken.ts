import { backendClient } from '@/api/backendClient';
import axios from 'axios';

export interface StreamTokenResponse {
	token: string;
	expiresIn: number;
	streamUrl: string;
}

type RequestAuthOptions = {
	token?: string | null;
};

/**
 * Pide un token efímero (HMAC firmado, ~300s) para abrir `/stream` o `/ws`.
 *
 * El backend solo valida el token al abrir la conexión: una conexión ya establecida
 * no se cae al expirar. Por eso hay que pedir un token nuevo en cada intento de
 * conexión en lugar de guardarlo al montar el componente.
 */
export async function fetchStreamToken(
	options: RequestAuthOptions = {},
): Promise<StreamTokenResponse> {
	let response: Awaited<ReturnType<typeof backendClient.get<Partial<StreamTokenResponse>>>>;

	try {
		response = await backendClient.get<Partial<StreamTokenResponse>>('/stream/token', {
			headers: options.token ? { Authorization: `Bearer ${options.token}` } : undefined,
		});
	} catch (error) {
		const status = axios.isAxiosError(error) ? error.response?.status : undefined;
		throw new Error(`No se pudo pedir el token efímero${status ? ` (${status})` : ''}`);
	}

	const token = response.data?.token;
	if (!token) {
		throw new Error('La respuesta de /stream/token no incluyó token');
	}

	return {
		token,
		expiresIn: response.data?.expiresIn ?? 300,
		streamUrl: response.data?.streamUrl ?? '/stream',
	};
}
