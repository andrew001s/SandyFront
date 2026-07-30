import axios from 'axios';

const rawBackendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const normalizeBackendUrl = (url: string) => url.replace(/\/+$/, '');

export const getBackendUrl = () => normalizeBackendUrl(rawBackendUrl);

type ClerkSessionLike = {
	getToken?: () => Promise<string | null> | string | null;
};

type ClerkWindow = Window & {
	Clerk?: {
		session?: ClerkSessionLike | null;
	} | null;
};

export const getClerkSessionToken = async () => {
	if (typeof window === 'undefined') {
		return null;
	}

	const clerkWindow = window as ClerkWindow;
	const session = clerkWindow.Clerk?.session;

	if (!session?.getToken) {
		return null;
	}

	const token = await session.getToken();
	return typeof token === 'string' && token.length > 0 ? token : null;
};

export const backendClient = axios.create({
	baseURL: getBackendUrl(),
});

backendClient.interceptors.request.use(async (config) => {
	const token = await getClerkSessionToken();

	if (token) {
		config.headers = {
			...config.headers,
			Authorization: `Bearer ${token}`,
		};
	}

	return config;
});

