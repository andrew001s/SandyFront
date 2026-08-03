import axios from 'axios';

const FISH_AUDIO_COVER_BASE_URL = 'https://public-platform.r2.fish.audio/cdn-cgi/image/width=128,format=webp/';

export type FishAudioModel = {
	_id: string;
	title: string;
	description?: string;
	cover_image?: string;
	author?: {
		nickname?: string;
		avatar?: string;
	};
	tags?: string[];
	created_at?: string;
	updated_at?: string;
	samples?: Array<{
		filename?: string;
		duration_ms?: number;
	}>;
};

export function resolveFishAudioCoverImageUrl(coverImage?: string) {
	if (!coverImage) {
		return null;
	}

	const trimmed = coverImage.trim();

	if (!trimmed) {
		return null;
	}

	try {
		return new URL(trimmed).toString();
	} catch {
		const normalizedPath = trimmed.replace(/^\/+/, '');
		return `${FISH_AUDIO_COVER_BASE_URL}${normalizedPath}`;
	}
}

export function buildFishAudioCoverImageProxySrc(coverImage?: string) {
	const url = resolveFishAudioCoverImageUrl(coverImage);
	return url ? `/api/fish-cover?src=${encodeURIComponent(url)}` : null;
}

type FishAudioModelListResponse = {
	total?: number;
	items?: FishAudioModel[];
	has_more?: boolean;
};

type FishAudioModelSearchOptions = {
	apiKey: string;
	query: string;
	pageSize?: number;
	pageNumber?: number;
	sortBy?: 'score' | 'task_count' | 'created_at';
};

export async function searchFishAudioModels({
	apiKey,
	query,
	pageSize = 12,
	pageNumber = 1,
	sortBy = 'score',
}: FishAudioModelSearchOptions): Promise<FishAudioModelListResponse> {
	if (!apiKey) {
		throw new Error('Fish Audio no está configurado');
	}

	const response = await axios.get<FishAudioModelListResponse>('/fish-api/model', {
		params: {
			title: query.trim() || undefined,
			page_size: pageSize,
			page_number: pageNumber,
			sort_by: sortBy,
		},
		headers: {
			Authorization: `Bearer ${apiKey}`,
		},
	});

	return response.data;
}

export async function getFishAudioModel({
	apiKey,
	voiceId,
}: {
	apiKey: string;
	voiceId: string;
}): Promise<FishAudioModel> {
	if (!apiKey) {
		throw new Error('Fish Audio no está configurado');
	}

	const trimmedVoiceId = voiceId.trim();

	if (!trimmedVoiceId) {
		throw new Error('Voice ID vacío');
	}

	const response = await axios.get<FishAudioModel>(`/fish-api/model/${encodeURIComponent(trimmedVoiceId)}`, {
		headers: {
			Authorization: `Bearer ${apiKey}`,
		},
	});

	return response.data;
}
