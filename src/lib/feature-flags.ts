export type FeatureFlagKey =
	| 'chat_replies'
	| 'voice_replies'
	| 'events'
	| 'rewards'
	| 'moderation'
	| 'assist';

export type FeatureFlags = Record<FeatureFlagKey, boolean>;

export const FEATURE_FLAG_KEYS: FeatureFlagKey[] = [
	'chat_replies',
	'voice_replies',
	'events',
	'rewards',
	'moderation',
	'assist',
];

export const FEATURE_FLAG_LABELS: Record<FeatureFlagKey, { label: string; description: string }> = {
	chat_replies: {
		label: 'Respuestas al chat',
		description: 'Activa o desactiva las respuestas al chat de Twitch.',
	},
	voice_replies: {
		label: 'Respuestas por voz',
		description: 'Marca si la respuesta debe ir a voz o solo a texto.',
	},
	events: {
		label: 'Eventos',
		description: 'Seguidores, subs, raids, cheers y otros eventos.',
	},
	rewards: {
		label: 'Recompensas',
		description: 'Recompensas del canal (channel points).',
	},
	moderation: {
		label: 'Moderación',
		description: 'Filtro de moderación de mensajes.',
	},
	assist: {
		label: 'Asistente',
		description: 'Lógica asistida para interpretar órdenes del canal.',
	},
};

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
	chat_replies: true,
	voice_replies: true,
	events: true,
	rewards: true,
	moderation: true,
	assist: true,
};

/**
 * Parte de los valores por defecto y solo pisa las claves conocidas que vengan
 * como booleano, así un flag ausente o corrupto no apaga una función por error.
 */
export function normalizeFeatureFlags(input: unknown): FeatureFlags {
	const flags: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS };

	if (!input || typeof input !== 'object') {
		return flags;
	}

	const source = input as Record<string, unknown>;
	for (const key of FEATURE_FLAG_KEYS) {
		if (typeof source[key] === 'boolean') {
			flags[key] = source[key];
		}
	}

	return flags;
}
