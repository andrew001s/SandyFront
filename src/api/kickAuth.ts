import axios from 'axios';
import { generatePkcePair } from '@/lib/pkce';

interface KickTokenResponse {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	scope: string[];
	token_type: string;
}

const KICK_CLIENT_ID = process.env.NEXT_PUBLIC_KICK_CLIENT_ID;
const KICK_REDIRECT_URI = process.env.NEXT_PUBLIC_KICK_REDIRECT_URI;

const requireEnv = (value: string | undefined, name: string) => {
	if (!value) {
		throw new Error(`Falta la variable de entorno ${name}`);
	}

	return value;
};

export const getKickAuthUrl = async () => {
	const clientId = requireEnv(KICK_CLIENT_ID, 'NEXT_PUBLIC_KICK_CLIENT_ID');
	const redirectUri = requireEnv(KICK_REDIRECT_URI, 'NEXT_PUBLIC_KICK_REDIRECT_URI');
	const { codeVerifier, codeChallenge } = await generatePkcePair();
	const state = crypto.randomUUID();
	const scope = 'user:read channel:read channel:write chat:write events:subscribe streamkey:read';

	return {
		authUrl: `https://id.kick.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&code_challenge=${codeChallenge}&code_challenge_method=S256&state=${state}`,
		codeVerifier,
		state,
	};
};

export const getKickAccessToken = async (
	code: string,
	codeVerifier: string,
): Promise<KickTokenResponse> => {
	try {
		const response = await axios.post('/api/kick/token', {
			code,
			code_verifier: codeVerifier,
			grant_type: 'authorization_code',
		});

		return response.data;
	} catch (error) {
		console.error('Error obteniendo el token de acceso de Kick:', error);
		throw new Error('Error al obtener el token de acceso de Kick');
	}
};

export const refreshKickAccessToken = async (refreshToken: string): Promise<KickTokenResponse> => {
	try {
		const response = await axios.post('/api/kick/token', {
			grant_type: 'refresh_token',
			refresh_token: refreshToken,
		});

		return response.data;
	} catch (error) {
		console.error('Error refrescando el token de Kick:', error);
		throw new Error('Error al refrescar el token de Kick');
	}
};
