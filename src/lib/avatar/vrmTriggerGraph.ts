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
	| { type: 'expression'; expression: string }
	| { type: 'idle'; enabled: boolean }
	| { type: 'throw_object'; kind?: VrmDropObjectKind }
	| { type: 'slime'; enabled: boolean; durationSeconds?: number; color?: string };

export interface VrmTriggerRule {
	id: string;
	enabled: boolean;
	trigger: VrmTriggerName;
	rewardId?: string;
	contains?: string;
	action: VrmTriggerAction;
}

const STORAGE_KEY = 'sandy_vrm_trigger_graph_v1';

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
	if (typeof window === 'undefined') return [];
	try {
		const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
		return Array.isArray(value) ? (value as VrmTriggerRule[]) : [];
	} catch {
		return [];
	}
}

export function saveVrmTriggerRules(rules: VrmTriggerRule[]): void {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
	} catch {
		// Keep graph editing available if browser storage is full or disabled.
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
