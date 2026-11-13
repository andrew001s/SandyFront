export function normalizeExpressionIntensity(value: number | undefined, fallback = 1): number {
	return typeof value === 'number' && Number.isFinite(value)
		? Math.min(1, Math.max(0, value))
		: fallback;
}

export function expressionWeights(
	names: string[],
	intensity: number,
	weights?: Record<string, number>,
): Record<string, number> {
	return Object.fromEntries(
		names.map((name) => [
			name,
			normalizeExpressionIntensity(weights?.[name], normalizeExpressionIntensity(intensity)),
		]),
	);
}

export function scopedExpressionIntensities(
	values: Record<string, number>,
	scope: string,
): Record<string, number> {
	const prefix = `${scope}:`;
	return Object.fromEntries(
		Object.entries(values)
			.filter(([key]) => key.startsWith(prefix))
			.map(([key, value]) => [key.slice(prefix.length), normalizeExpressionIntensity(value)]),
	);
}
