export interface YoutubeProfile {
	id: string;
	username: string;
	email: string;
	picProfile: string;
	channel_title: string;
	custom_url: string;
	description: string;
	subscriber_count: string;
	view_count: string;
	video_count: string;
	uploads_playlist_id: string;
	live_chat_id: string;
	broadcast_id: string;
}

export interface YoutubeTokenInfo {
	provider: string;
	authenticated: boolean;
	user_id: string;
	expires_at: number;
	scopes: string[];
	email: string;
	provider_account_id: string;
}

export interface YoutubeTokensResponse {
	tokens: YoutubeTokenInfo | null;
	authenticated: boolean;
	message?: string;
}

export interface YoutubeAuthStartResponse {
	authorization_url: string;
	state: string;
	redirect_uri: string;
	scopes: string;
}

export interface YoutubeServiceStatus {
	user_id: string;
	running: boolean;
	armed: boolean;
	monitor_active: boolean;
	last_known_live: boolean | null;
	last_activity: string | null;
	youtube_channel_id: string;
	youtube_channel_title: string;
	youtube_broadcast_id: string;
	youtube_live_chat_id: string;
	status: 'active' | 'inactive';
}

export interface YoutubeBroadcastItem {
	id: string;
	title: string;
	description: string;
	privacy_status: string;
	status: string;
	scheduled_start_time?: string;
	scheduled_end_time?: string;
}

export interface YoutubeBroadcastsResponse {
	broadcasts: {
		items: YoutubeBroadcastItem[];
	};
}

export type YoutubeBroadcastStatus = 'active' | 'all' | 'completed' | 'upcoming';

export interface YoutubeBroadcastPayload {
	broadcast_id: string;
	title?: string;
	description?: string;
	privacy_status?: 'public' | 'private' | 'unlisted';
	scheduled_start_time?: string;
	scheduled_end_time?: string;
}

export interface YoutubeChatPayload {
	message: string;
	live_chat_id?: string;
}

export interface YoutubeTransitionPayload {
	broadcast_id: string;
	status: 'testing' | 'live' | 'complete';
}

export interface YoutubeStats {
	channelId: string;
	title: string;
	description: string;
	customUrl: string;
	thumbnail: string;
	uploadsPlaylistId: string;
	subscriberCount: string;
	viewCount: string;
	videoCount: string;
}
