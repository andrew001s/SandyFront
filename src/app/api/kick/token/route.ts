import axios from 'axios';
import { NextResponse } from 'next/server';

type KickTokenResponse = {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	scope: string[];
	token_type: string;
};

type TokenRequestBody = {
	grant_type?: 'authorization_code' | 'refresh_token';
	code?: string;
	refresh_token?: string;
	code_verifier?: string;
};

const requireEnv = (value: string | undefined, name: string) => {
	if (!value) {
		throw new Error(`Falta la variable de entorno ${name}`);
	}

	return value;
};

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as TokenRequestBody;
		const clientId = requireEnv(
			process.env.NEXT_PUBLIC_KICK_CLIENT_ID ?? process.env.KICK_CLIENT_ID,
			'NEXT_PUBLIC_KICK_CLIENT_ID',
		);
		const clientSecret = requireEnv(
			process.env.KICK_CLIENT_SECRET ?? process.env.NEXT_PUBLIC_KICK_CLIENT_SECRET,
			'KICK_CLIENT_SECRET',
		);
		const redirectUri = requireEnv(
			process.env.NEXT_PUBLIC_KICK_REDIRECT_URI ?? process.env.KICK_REDIRECT_URI,
			'NEXT_PUBLIC_KICK_REDIRECT_URI',
		);

		if (body.grant_type !== 'authorization_code' && body.grant_type !== 'refresh_token') {
			return NextResponse.json({ error: 'grant_type inválido' }, { status: 400 });
		}

		const params =
			body.grant_type === 'authorization_code'
				? {
						client_id: clientId,
						client_secret: clientSecret,
						code: requireEnv(body.code, 'code'),
						code_verifier: requireEnv(body.code_verifier, 'code_verifier'),
						grant_type: 'authorization_code',
						redirect_uri: redirectUri,
					}
				: {
						client_id: clientId,
						client_secret: clientSecret,
						grant_type: 'refresh_token',
						refresh_token: requireEnv(body.refresh_token, 'refresh_token'),
					};

		const response = await axios.post<KickTokenResponse>('https://id.kick.com/oauth/token', null, {
			params,
		});

		return NextResponse.json(response.data);
	} catch (error) {
		console.error('Error intercambiando token de Kick:', error);
		return NextResponse.json({ error: 'Error al obtener el token de Kick' }, { status: 500 });
	}
}
