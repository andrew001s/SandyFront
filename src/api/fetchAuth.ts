import { TokensInterface } from '@/interfaces/tokensInterface';
import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Auth {
	token: string;
	refresh_token: string;
	bot: boolean;
}

export async function postAuth(message: Auth) {
	const response = await axios.post(`${baseURL}/auth`, message);
	return response.data.message;
}

export async function getTokens(bot: boolean): Promise<TokensInterface> {
	const response = await axios.get(`${baseURL}/tokens?bot=${bot}`);
	return response.data;
}

export async function saveTokens(bot: boolean, tokens: TokensInterface) {
	const response = await axios.put(`${baseURL}/tokens?bot=${bot}`, tokens.tokens);
	return response.data.message;
}
