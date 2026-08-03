import { backendClient } from '@/api/backendClient';
import type {
	YoutubeAuthStartResponse,
	YoutubeBroadcastPayload,
	YoutubeBroadcastStatus,
	YoutubeBroadcastsResponse,
	YoutubeChatPayload,
	YoutubeProfile,
	YoutubeServiceStatus,
	YoutubeStats,
	YoutubeTokensResponse,
	YoutubeTransitionPayload,
} from '@/interfaces/youtubeInterface';

const buildAuthHeaders = (token?: string | null) =>
	token
		? {
				Authorization: `Bearer ${token}`,
			}
		: undefined;

export async function startYoutubeAuth(): Promise<YoutubeAuthStartResponse> {
	const response = await backendClient.get<YoutubeAuthStartResponse>('/youtube/auth/start');
	return response.data;
}

export async function deleteYoutubeAuth() {
	const response = await backendClient.delete('/youtube/auth');
	return response.data;
}

export async function getYoutubeProfile(
	options: { token?: string | null } = {},
): Promise<YoutubeProfile | null> {
	const response = await backendClient.get<{
		profile: YoutubeProfile | null;
		authenticated: boolean;
	}>('/youtube/profile', { headers: buildAuthHeaders(options.token) });
	return response.data.profile;
}

export async function getYoutubeTokens(): Promise<YoutubeTokensResponse> {
	const response = await backendClient.get<YoutubeTokensResponse>('/youtube/tokens');
	return response.data;
}

export async function getYoutubeServiceStatus(): Promise<YoutubeServiceStatus | null> {
	const response = await backendClient.get<{ service: YoutubeServiceStatus | null }>(
		'/youtube/service-status',
	);
	return response.data.service;
}

export async function startYoutube() {
	const response = await backendClient.get('/youtube/start');
	return response.data;
}

export async function stopYoutube() {
	const response = await backendClient.get('/youtube/stop');
	return response.data;
}

export async function getYoutubeBroadcasts(
	broadcastStatus: YoutubeBroadcastStatus = 'active',
): Promise<YoutubeBroadcastsResponse> {
	const response = await backendClient.get<YoutubeBroadcastsResponse>('/youtube/broadcasts', {
		params: {
			broadcast_status: broadcastStatus,
		},
	});
	return response.data;
}

export async function getYoutubeStats(): Promise<YoutubeStats | null> {
	const response = await backendClient.get<{ stats: YoutubeStats | null }>('/youtube/stats');
	return response.data.stats;
}

export async function updateYoutubeBroadcast(payload: YoutubeBroadcastPayload) {
	const response = await backendClient.put('/youtube/broadcast', payload);
	return response.data;
}

export async function postYoutubeChat(payload: YoutubeChatPayload) {
	const response = await backendClient.post('/youtube/chat', payload);
	return response.data;
}

export async function updateYoutubeTransition(payload: YoutubeTransitionPayload) {
	const response = await backendClient.put('/youtube/transition', payload);
	return response.data;
}
