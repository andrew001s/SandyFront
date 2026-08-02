import { backendClient } from '@/api/backendClient';
import type { TokensInterface } from '@/interfaces/tokensInterface';
import type { ServiceStatus } from '@/api/sandycore';
import type { ProfileModel } from '@/interfaces/profileInterface';

type Auth = {
	token: string;
	refresh_token: string;
	bot: false;
};

const buildAuthHeaders = (token?: string | null) =>
	token
		? {
				Authorization: `Bearer ${token}`,
			}
		: undefined;

export async function postKickAuth(message: Auth) {
	const response = await backendClient.post('/kick/auth', message);
	return response.data.message;
}

export async function deleteKickAuth() {
	const response = await backendClient.delete('/kick/auth');
	return response.data;
}

export async function getKickTokens(): Promise<TokensInterface> {
	const response = await backendClient.get('/kick/tokens');
	return response.data;
}

export async function saveKickTokens(tokens: TokensInterface) {
	const response = await backendClient.put('/kick/tokens', tokens.tokens);
	return response.data.message;
}

export async function getKickProfileInfo(options: { token?: string | null } = {}): Promise<ProfileModel> {
	const response = await backendClient.get('/kick/profile', {
		params: {
			bot: false,
		},
		headers: buildAuthHeaders(options.token),
	});
	return response.data.profile;
}

export async function startKick() {
	const response = await backendClient.get('/kick/start', {
		params: {
			bot: false,
		},
	});
	return response.data;
}

export async function stopKick() {
	const response = await backendClient.get('/kick/stop', {
		params: {
			bot: false,
		},
	});
	return response.data;
}

export async function getKickServiceStatus() {
	const response = await backendClient.get('/kick/service-status');
	return response.data.service as ServiceStatus;
}

