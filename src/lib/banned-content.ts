/**
 * Listas de moderación. En el modelo del cliente van agrupadas; el backend las
 * sigue esperando planas como `custom_banned_words` / `_symbols` / `_links`,
 * así que la conversión vive en `toBannedContentPayload`.
 */
export type BannedContent = {
	words?: string[];
	symbols?: string[];
	links?: string[];
};

export type BannedContentPayload = {
	custom_banned_words?: string[];
	custom_banned_symbols?: string[];
	custom_banned_links?: string[];
};

const asStringArray = (value: unknown): string[] | undefined => {
	if (!Array.isArray(value)) {
		return undefined;
	}

	const items = value.filter((item): item is string => typeof item === 'string');
	return items.length > 0 ? items : undefined;
};

/**
 * Acepta tanto el objeto agrupado (`banned_content`) como las claves planas del
 * backend y de las plantillas antiguas.
 */
export function normalizeBannedContent(input: unknown): BannedContent {
	if (!input || typeof input !== 'object') {
		return {};
	}

	const source = input as Record<string, unknown>;
	const grouped = source.banned_content;

	if (grouped && typeof grouped === 'object') {
		const nested = grouped as Record<string, unknown>;
		return {
			words: asStringArray(nested.words),
			symbols: asStringArray(nested.symbols),
			links: asStringArray(nested.links),
		};
	}

	return {
		words: asStringArray(source.custom_banned_words),
		symbols: asStringArray(source.custom_banned_symbols),
		links: asStringArray(source.custom_banned_links),
	};
}

export function toBannedContentPayload(content: BannedContent): BannedContentPayload {
	return {
		custom_banned_words: content.words,
		custom_banned_symbols: content.symbols,
		custom_banned_links: content.links,
	};
}
