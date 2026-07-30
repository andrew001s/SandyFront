import { backendClient } from '@/api/backendClient';
import type { TokensInterface } from '@/interfaces/tokensInterface';

interface Auth {
	token: string;
	refresh_token: string;
	bot: boolean;
}

export async function postAuth(message: Auth) {
	const response = await backendClient.post('/auth', message);
	return response.data.message;
}

export async function getTokens(bot: boolean): Promise<TokensInterface> {
	const response = await backendClient.get('/tokens', {
		params: {
			bot,
		},
	});
	return response.data;
}

export async function saveTokens(bot: boolean, tokens: TokensInterface) {
	const response = await backendClient.put('/tokens', tokens.tokens, {
		params: {
			bot,
		},
	});
	return response.data.message;
}
