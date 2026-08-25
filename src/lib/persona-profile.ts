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

export const PERSONA_PROFILE_KEYS = [
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

export const DEFAULT_PERSONA_PROFILE: PersonaProfile = {
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
};

/**
 * Acepta el perfil envuelto en `persona_profile` o sus campos sueltos en la raíz,
 * que es como quedan algunas plantillas que edita el usuario a mano.
 */
export function normalizePersonaProfile(input: unknown): PersonaProfile | undefined {
	if (!input || typeof input !== 'object') {
		return undefined;
	}

	const source = input as Record<string, unknown>;
	const wrapped = source.persona_profile;

	if (wrapped && typeof wrapped === 'object') {
		return wrapped as PersonaProfile;
	}

	const hasProfileFields = PERSONA_PROFILE_KEYS.some((key) => source[key] !== undefined);
	if (!hasProfileFields) {
		return undefined;
	}

	const profile: Record<string, unknown> = {};
	for (const key of PERSONA_PROFILE_KEYS) {
		if (source[key] !== undefined) {
			profile[key] = source[key];
		}
	}

	return profile as PersonaProfile;
}
