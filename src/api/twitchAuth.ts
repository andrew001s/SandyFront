import axios from 'axios';

interface TwitchTokenResponse {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	scope: string[];
	token_type: string;
}

const TWITCH_CLIENT_ID = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI;

const requireEnv = (value: string | undefined, name: string) => {
	if (!value) {
		throw new Error(`Falta la variable de entorno ${name}`);
	}

	return value;
};

export const getTwitchAuthUrl = () => {
	const clientId = requireEnv(TWITCH_CLIENT_ID, 'NEXT_PUBLIC_TWITCH_CLIENT_ID');
	const redirectUri = requireEnv(REDIRECT_URI, 'NEXT_PUBLIC_REDIRECT_URI');
	const scope =
		'chat:read chat:edit channel:moderate moderator:manage:chat_messages moderator:read:chat_messages moderation:read channel:read:redemptions channel:manage:redemptions channel:manage:broadcast user:bot user:write:chat channel:bot clips:edit user:read:email moderator:manage:chat_settings moderator:read:chatters moderator:read:followers channel:read:subscriptions bits:read';
	const state = crypto.randomUUID(); // Genera un identificador único para seguridad
	return `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}&force_verify=true`;
};

export const getAccessToken = async (code: string): Promise<TwitchTokenResponse> => {
	try {
		const response = await axios.post('/api/twitch/token', {
			code,
			grant_type: 'authorization_code',
		});

		return response.data;
	} catch (error) {
		console.error('Error obteniendo el token de acceso:', error);
		throw new Error('Error al obtener el token de acceso de Twitch');
	}
};

export const refreshAccessToken = async (refreshToken: string): Promise<TwitchTokenResponse> => {
	try {
		const response = await axios.post('/api/twitch/token', {
			grant_type: 'refresh_token',
			refresh_token: refreshToken,
		});

		return response.data;
	} catch (error) {
		console.error('Error refrescando el token:', error);
		throw new Error('Error al refrescar el token de Twitch');
	}
};

export const validateToken = async (accessToken: string) => {
	try {
		const response = await axios.get('https://id.twitch.tv/oauth2/validate', {
			headers: {
				Authorization: `OAuth ${accessToken}`,
			},
		});
		return response.data;
	} catch (error) {
		console.error('Error validando el token:', error);
		throw new Error('Token inválido');
	}
};

export const revokeToken = async (accessToken: string) => {
	try {
		const clientId = requireEnv(TWITCH_CLIENT_ID, 'NEXT_PUBLIC_TWITCH_CLIENT_ID');
		await axios.post('https://id.twitch.tv/oauth2/revoke', null, {
			params: {
				client_id: clientId,
				token: accessToken,
			},
		});
		return true;
	} catch (error) {
		console.error('Error revocando el token:', error);
		throw new Error('Error al revocar el token');
	}
};
