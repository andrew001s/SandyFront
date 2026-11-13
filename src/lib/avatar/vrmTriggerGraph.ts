export type VrmTriggerName =
	| 'chat_message'
	| 'follow'
	| 'subscribe'
	| 'subscription_message'
	| 'sub_gift'
	| 'cheer'
	| 'raid'
	| 'channel_point_reward';

export type VrmDropObjectKind =
	| 'random'
	| 'ball'
	| 'rubber_duck'
	| 'sneaker'
	| 'apple'
	| 'donut'
	| 'heart'
	| 'star';
export const DEFAULT_VRM_SLIME_COLOR = '#8bdc43';

export type VrmTriggerAction =
	| { type: 'expression'; expression: string; durationSeconds?: number }
	| { type: 'idle'; enabled: boolean; durationSeconds?: number }
	| { type: 'bone_pose'; bone: string; rotation: number; durationSeconds: number }
	| { type: 'bone_scale'; bone: string; scale: number; durationSeconds: number }
	| {
			type: 'emoji_rain';
			amount: number;
			radius: number;
			size: number;
			gravity: number;
			durationSeconds: number;
	  }
	| { type: 'throw_object'; kind?: VrmDropObjectKind; strength?: number }
	| { type: 'slime'; enabled: boolean; durationSeconds?: number; color?: string };

export interface VrmTriggerRule {
	id: string;
	enabled: boolean;
	trigger: VrmTriggerName;
	rewardId?: string;
	contains?: string;
	matchMode?: 'contains' | 'exact';
	caseSensitive?: boolean;
	userContains?: string;
	minAmount?: number;
	maxAmount?: number;
	action: VrmTriggerAction;
}

const STORAGE_KEY = 'sandy_vrm_trigger_graph_v1';
const MIGRATED_STORAGE_KEY = 'sandy_vrm_trigger_graph_migrated_v1';
let currentRules: VrmTriggerRule[] = [];

export const VRM_TRIGGER_NAMES: Array<{ id: VrmTriggerName; label: string }> = [
	{ id: 'chat_message', label: 'Mensaje del chat' },
	{ id: 'follow', label: 'Nuevo follow' },
	{ id: 'subscribe', label: 'Suscripción' },
	{ id: 'subscription_message', label: 'Mensaje de suscripción' },
	{ id: 'sub_gift', label: 'Regalo de suscripción' },
	{ id: 'cheer', label: 'Cheer / bits' },
	{ id: 'raid', label: 'Raid' },
	{ id: 'channel_point_reward', label: 'Canje de puntos' },
];

export function getVrmTriggerRules(): VrmTriggerRule[] {
	return currentRules;
}

export function setVrmTriggerRules(rules: VrmTriggerRule[]): void {
	currentRules = Array.isArray(rules) ? [...rules] : [];
}

export function getLegacyVrmTriggerRules(): VrmTriggerRule[] {
	if (typeof window === 'undefined') return [];
	try {
		const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
		return Array.isArray(value)
			? (value.filter((rule) => rule?.action?.type !== 'gesture') as VrmTriggerRule[])
			: [];
	} catch {
		return [];
	}
}

export function hasMigratedVrmTriggerRules(): boolean {
	if (typeof window === 'undefined') return false;
	try {
		return window.localStorage.getItem(MIGRATED_STORAGE_KEY) === '1';
	} catch {
		return false;
	}
}

export function claimLegacyVrmTriggerRules(userId: string): boolean {
	if (typeof window === 'undefined') return false;
	try {
		const owner = window.localStorage.getItem(MIGRATED_STORAGE_KEY);
		if (owner === '1' || (owner && owner !== userId)) return false;
		window.localStorage.setItem(MIGRATED_STORAGE_KEY, userId);
		return true;
	} catch {
		return false;
	}
}

export function releaseLegacyVrmTriggerRules(userId: string): void {
	if (typeof window === 'undefined') return;
	try {
		if (window.localStorage.getItem(MIGRATED_STORAGE_KEY) === userId) {
			window.localStorage.removeItem(MIGRATED_STORAGE_KEY);
		}
	} catch {
		// Keep the local rules available for a later migration attempt.
	}
}

export function markVrmTriggerRulesMigrated(): void {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem(MIGRATED_STORAGE_KEY, '1');
	} catch {
		// Account settings remain authoritative if local storage is unavailable.
	}
}

export function clearLegacyVrmTriggerRules(): void {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.removeItem(STORAGE_KEY);
	} catch {
		// The account copy remains authoritative if local storage is unavailable.
	}
}

export function addVrmTriggerRule(): VrmTriggerRule {
	return {
		id: crypto.randomUUID(),
		enabled: true,
		trigger: 'channel_point_reward',
		contains: '',
		action: { type: 'throw_object', kind: 'random' },
	};
}

export function matchesVrmTriggerFilter(
	rule: VrmTriggerRule,
	eventData: Record<string, unknown>,
): boolean {
	if (rule.userContains?.trim()) {
		const user = String(eventData.user ?? '').toLocaleLowerCase();
		if (!user.includes(rule.userContains.trim().toLocaleLowerCase())) return false;
	}

	if (rule.minAmount !== undefined || rule.maxAmount !== undefined) {
		const rawAmount = eventData.bits ?? eventData.amount ?? eventData.count;
		const amount = Number(rawAmount);
		if (!Number.isFinite(amount)) return false;
		if (rule.minAmount !== undefined && amount < rule.minAmount) return false;
		if (rule.maxAmount !== undefined && amount > rule.maxAmount) return false;
	}

	if (!rule.contains?.trim()) return true;
	const needle = rule.contains.trim();
	const text = String(
		eventData.message ?? eventData.input ?? eventData.rewardTitle ?? eventData.user ?? '',
	);
	const candidate = rule.caseSensitive ? text : text.toLocaleLowerCase();
	const filter = rule.caseSensitive ? needle : needle.toLocaleLowerCase();
	switch (rule.matchMode ?? 'contains') {
		case 'exact':
			return candidate.trim() === filter;
		default:
			return candidate.includes(filter);
	}
}
