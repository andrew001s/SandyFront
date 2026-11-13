const automaticReactionMappings: Record<string, string> = {};

export type AutomaticReactionConfig = {
	expressions: string[];
	intensity: number;
	enabled?: boolean;
};

export function getAutomaticReactionMappings(): Record<string, string> {
	return { ...automaticReactionMappings };
}

export function parseAutomaticReactionConfig(stored: string | undefined): AutomaticReactionConfig {
	if (!stored) return { expressions: [], intensity: 1 };

	try {
		const parsed = JSON.parse(stored) as Partial<AutomaticReactionConfig>;
		if (Array.isArray(parsed.expressions)) {
			return {
				...(parsed.enabled === false ? { enabled: false } : {}),
				expressions: parsed.expressions.filter((item): item is string => typeof item === 'string'),
				intensity:
					typeof parsed.intensity === 'number' ? Math.min(1, Math.max(0, parsed.intensity)) : 1,
			};
		}
	} catch {
		// Los perfiles antiguos guardan un solo id de expresión como texto plano.
	}

	return { expressions: [stored], intensity: 1 };
}

export function getAutomaticReactionConfig(reaction: string): AutomaticReactionConfig {
	return parseAutomaticReactionConfig(automaticReactionMappings[reaction]);
}

export function getScopedAutomaticReactionConfig(
	reaction: string,
	scope: string,
): AutomaticReactionConfig {
	const config = parseAutomaticReactionConfig(
		automaticReactionMappings[`${scope}:${reaction}`] ?? automaticReactionMappings[reaction],
	);
	return config.enabled === false ? { ...config, expressions: [] } : config;
}

export function getAutomaticReactionMapping(reaction: string): string | undefined {
	return getAutomaticReactionConfig(reaction).expressions[0];
}

export function setAutomaticReactionMapping(reaction: string, expressionId: string | null): void {
	if (expressionId) {
		automaticReactionMappings[reaction] = expressionId;
	} else {
		delete automaticReactionMappings[reaction];
	}
}

export function setAutomaticReactionConfig(
	reaction: string,
	config: AutomaticReactionConfig | null,
	scope?: string,
): void {
	if (scope) {
		for (const [legacyReaction, value] of Object.entries(automaticReactionMappings)) {
			if (legacyReaction.includes(':')) continue;
			automaticReactionMappings[`${scope}:${legacyReaction}`] = value;
			delete automaticReactionMappings[legacyReaction];
		}
	}

	const key = scope ? `${scope}:${reaction}` : reaction;
	const expressions = config?.expressions.filter(Boolean) ?? [];
	if (config?.enabled === false) {
		automaticReactionMappings[key] = JSON.stringify({
			expressions,
			intensity: Math.min(1, Math.max(0, config.intensity)),
			enabled: false,
		});
		return;
	}
	if (expressions.length === 0) {
		if (scope) {
			automaticReactionMappings[key] = JSON.stringify({ expressions: [], intensity: 1 });
		} else {
			delete automaticReactionMappings[key];
		}
		return;
	}

	const intensity = Math.min(1, Math.max(0, config?.intensity ?? 1));
	automaticReactionMappings[key] =
		expressions.length === 1 && intensity === 1
			? expressions[0]
			: JSON.stringify({ expressions, intensity });
}
