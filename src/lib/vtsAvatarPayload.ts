export type AvatarEmotion =
	| 'neutral'
	| 'happy'
	| 'sad'
	| 'angry'
	| 'surprised'
	| 'excited'
	| 'sleepy'
	| 'thinking'
	| 'confused'
	| 'shy';

export type AvatarMessageType = 'speech' | 'reaction' | 'idle' | 'action' | 'system';

export interface AvatarMouthState {
	open?: number;
	smile?: number;
}

export interface AvatarMetadata {
	source?: string;
	language?: string;
	confidence?: number;
	messageId?: string;
	[key: string]: unknown;
}

export interface AvatarBackendPayload {
	id?: string;
	type: AvatarMessageType | string;
	text?: string;
	emotion?: AvatarEmotion | string;
	intensity?: number;
	durationMs?: number;
	speechStyle?: string;
	gesture?: string;
	mouth?: AvatarMouthState;
	priority?: number;
	interrupt?: boolean;
	expression?: string | null;
	hotkey?: string | null;
	scene?: string;
	metadata?: AvatarMetadata;
	timestamp?: string;
	response?: string;
	message?: string;
}

export interface ResolvedAvatarPose {
	open: number;
	smile: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const normalizeAvatarText = (payload: AvatarBackendPayload): string => {
	return (payload.text ?? payload.response ?? payload.message ?? '').trim();
};

export const resolveAvatarPose = (payload: AvatarBackendPayload): ResolvedAvatarPose => {
	const emotion = String(payload.emotion ?? 'neutral').toLowerCase();
	const intensity = clamp01(payload.intensity ?? 0.5);
	const mouthOpen = payload.mouth?.open;
	const mouthSmile = payload.mouth?.smile;

	const fallbackByEmotion: Record<string, ResolvedAvatarPose> = {
		happy: { open: 0.35, smile: 0.75 },
		excited: { open: 0.55, smile: 0.55 },
		surprised: { open: 0.82, smile: 0.08 },
		sad: { open: 0.2, smile: 0.1 },
		angry: { open: 0.28, smile: 0.02 },
		shy: { open: 0.22, smile: 0.18 },
		sleepy: { open: 0.12, smile: 0.05 },
		thinking: { open: 0.18, smile: 0.08 },
		confused: { open: 0.3, smile: 0.05 },
		neutral: { open: 0.18, smile: 0.08 },
	};

	const defaults = fallbackByEmotion[emotion] ?? fallbackByEmotion.neutral;
	const open = mouthOpen ?? defaults.open * (0.75 + intensity * 0.5);
	const smile = mouthSmile ?? defaults.smile * (0.7 + intensity * 0.5);

	return {
		open: clamp01(open),
		smile: clamp01(smile),
	};
};

export const resolveAvatarHotkey = (payload: AvatarBackendPayload): string | null => {
	return (payload.hotkey ?? payload.gesture ?? null)?.trim?.() || null;
};

export const resolveAvatarExpression = (payload: AvatarBackendPayload): string | null => {
	const expression = (payload.expression ?? payload.emotion ?? '').toString().trim();
	return expression.length > 0 ? expression : null;
};
