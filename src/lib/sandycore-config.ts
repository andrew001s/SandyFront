import {
	type BannedContent,
	type BannedContentPayload,
	normalizeBannedContent,
	toBannedContentPayload,
} from '@/lib/banned-content';
import {
	DEFAULT_FEATURE_FLAGS,
	type FeatureFlags,
	normalizeFeatureFlags,
} from '@/lib/feature-flags';
import {
	DEFAULT_PERSONA_PROFILE,
	type PersonaProfile,
	normalizePersonaProfile,
} from '@/lib/persona-profile';

/**
 * Composición de las tres piezas de configuración. Cada una vive en su propio
 * módulo (`persona-profile`, `feature-flags`, `banned-content`); aquí solo se
 * arman juntas y se traducen al formato plano que espera el backend.
 */
export type SandyCoreConfig = {
	persona_profile?: PersonaProfile;
	feature_flags: FeatureFlags;
	banned_content: BannedContent;
};

export type SandyCorePayload = BannedContentPayload & {
	persona_profile?: PersonaProfile;
	feature_flags?: FeatureFlags;
};

export const SANDY_CORE_TEMPLATE: SandyCoreConfig = {
	persona_profile: DEFAULT_PERSONA_PROFILE,
	feature_flags: { ...DEFAULT_FEATURE_FLAGS },
	banned_content: {
		words: ['spam'],
		symbols: ['🔞'],
		links: ['discord.gg/'],
	},
};

export function normalizeSandyCoreConfig(input: unknown): SandyCoreConfig {
	const source = input && typeof input === 'object' ? input : {};

	return {
		persona_profile: normalizePersonaProfile(source),
		feature_flags: normalizeFeatureFlags((source as Record<string, unknown>).feature_flags),
		banned_content: normalizeBannedContent(source),
	};
}

/** Aplana la configuración al formato que viaja a `PUT /settings`. */
export function toSandyCorePayload(config: SandyCoreConfig): SandyCorePayload {
	return {
		persona_profile: config.persona_profile,
		feature_flags: config.feature_flags,
		...toBannedContentPayload(config.banned_content),
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
