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

export type PersonaProfile = {
	name?: string;
	age?: string;
	nationality?: string;
	archetype?: string;
	core_traits?: string[];
	speech_style?: {
		tone?: string;
		mannerisms?: string[];
		catchphrases?: string[];
		modismos?: string[];
	};
	relationships?: Record<string, string>;
	background_vibe?: string;
	favorites?: {
		food?: string;
		music?: string;
	};
	rules?: string[];
};

export type PromptOverrides = {
	mod?: string;
	statistics?: string;
	vtuber?: string;
	vtuber_shandrew?: string;
	rewards?: string;
	events?: string;
	assist?: string;
};

export type SandyCoreConfig = {
	persona_profile?: PersonaProfile;
	prompt_overrides?: PromptOverrides;
	feature_flags: FeatureFlags;
	custom_banned_words?: string[];
	custom_banned_symbols?: string[];
	custom_banned_links?: string[];
};

export const SANDY_CORE_TEMPLATE: SandyCoreConfig = {
	persona_profile: {
		name: 'VTuber independiente',
		age: '',
		nationality: 'latinoamericana',
		archetype: 'VTuber carismática, sarcástica y cercana con su comunidad',
		core_traits: [
			'Responde con naturalidad y personalidad propia',
			'Puede ser bromista o provocadora sin cruzar límites innecesarios',
			'Se adapta al contexto del canal y al gusto del usuario',
			'Mantiene el tono definido por el creador si existe un perfil cargado',
		],
		speech_style: {
			tone: 'natural, directo y expresivo',
			mannerisms: [
				'Usa frases cortas cuando el contexto lo pida',
				'Evita sonar robótica',
				'Puede tener muletillas o modismos si el perfil los define',
			],
			catchphrases: [],
			modismos: [],
		},
		relationships: {},
		background_vibe:
			'Streamer virtual que interactúa con su chat, reacciona a eventos y mantiene un estilo coherente con su marca.',
		favorites: {},
		rules: [
			'Si faltan datos del perfil, responde con un estilo neutral y flexible.',
			'No inventes una historia demasiado específica si el usuario no la cargó.',
		],
	},
	prompt_overrides: {
		vtuber: 'Responde como una VTuber amable, sarcástica y breve.',
		assist: 'Devuelve JSON válido y nada más.',
	},
	feature_flags: {
		...DEFAULT_FEATURE_FLAGS,
	},
	custom_banned_words: ['spam'],
	custom_banned_symbols: ['🔞'],
	custom_banned_links: ['discord.gg/'],
};

const PERSONA_PROFILE_KEYS = [
	'name',
	'age',
	'nationality',
	'archetype',
	'core_traits',
	'speech_style',
	'relationships',
	'background_vibe',
	'favorites',
	'rules',
] as const;

const asStringArray = (value: unknown): string[] | undefined => {
	if (!Array.isArray(value)) {
		return undefined;
	}

	const items = value.filter((item): item is string => typeof item === 'string');
	return items.length > 0 ? items : undefined;
};

function pickPersonaProfile(obj: Record<string, unknown>): PersonaProfile | undefined {
	const wrapped = obj.persona_profile;
	if (wrapped && typeof wrapped === 'object') {
		return wrapped as PersonaProfile;
	}

	const hasProfileFields = PERSONA_PROFILE_KEYS.some((key) => obj[key] !== undefined);
	if (!hasProfileFields) {
		return undefined;
	}

	const profile: Record<string, unknown> = {};
	for (const key of PERSONA_PROFILE_KEYS) {
		if (obj[key] !== undefined) {
			profile[key] = obj[key];
		}
	}
	return profile as PersonaProfile;
}

export function normalizeSandyCoreConfig(input: unknown): SandyCoreConfig {
	const obj = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;

	const flags: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS };
	const inputFlags = obj.feature_flags;
	if (inputFlags && typeof inputFlags === 'object') {
		for (const key of FEATURE_FLAG_KEYS) {
			const value = (inputFlags as Record<string, unknown>)[key];
			if (typeof value === 'boolean') {
				flags[key] = value;
			}
		}
	}

	return {
		persona_profile: pickPersonaProfile(obj),
		prompt_overrides:
			obj.prompt_overrides && typeof obj.prompt_overrides === 'object'
				? (obj.prompt_overrides as PromptOverrides)
				: undefined,
		feature_flags: flags,
		custom_banned_words: asStringArray(obj.custom_banned_words),
		custom_banned_symbols: asStringArray(obj.custom_banned_symbols),
		custom_banned_links: asStringArray(obj.custom_banned_links),
	};
}

export function downloadSandyCoreTemplate(): void {
	const blob = new Blob([JSON.stringify(SANDY_CORE_TEMPLATE, null, 2)], {
		type: 'application/json',
	});
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = 'sandy-core-config.json';
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}
