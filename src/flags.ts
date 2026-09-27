/**
 * Cliente de Feature Flags de Railway compatible con Edge Runtime (Next.js Middleware).
 *
 * Consulta exclusivamente el sistema de Feature Flags de Railway vía GraphQL API
 * sin dependencias de módulos Node.js para ser 100% compatible con Edge y Server Components.
 */

export type FlagContext = {
	key?: string;
	[key: string]: string | number | boolean | undefined;
};

type RailwaySignal = {
	name: string;
	type: string;
	default: unknown;
	rules?: Array<{
		id?: string;
		source?: {
			type?: string;
			value?: unknown;
		};
	}>;
	version?: string;
};

// Caché en memoria para optimizar lecturas consecutivas en el middleware
let cachedSignals: Map<string, RailwaySignal> | null = null;
let lastFetchTimestamp = 0;
const CACHE_TTL_MS = 15_000; // 15 segundos

/**
 * Consulta la API GraphQL de Railway para obtener los Feature Flags del proyecto.
 * Usa fetch() nativo, compatible al 100% con Edge Runtime.
 */
async function fetchRailwaySignals(): Promise<Map<string, RailwaySignal> | null> {
	const now = Date.now();
	if (cachedSignals && now - lastFetchTimestamp < CACHE_TTL_MS) {
		return cachedSignals;
	}

	const token = process.env.RAILWAY_TOKEN || process.env.RAILWAY_API_TOKEN;
	if (!token) {
		return null;
	}

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		Accept: 'application/json',
	};

	if (process.env.RAILWAY_TOKEN) {
		headers['project-access-token'] = process.env.RAILWAY_TOKEN;
	} else if (process.env.RAILWAY_API_TOKEN) {
		headers.Authorization = `Bearer ${process.env.RAILWAY_API_TOKEN}`;
	}

	const projectId = process.env.RAILWAY_PROJECT_ID;
	const hasOwner = Boolean(projectId && !process.env.RAILWAY_TOKEN);

	const query = hasOwner
		? `query RailwaySignalsWithOwner($owner: String!) {
				signals(owner: $owner) {
					name
					type
					default
					rules
					version
				}
			}`
		: `query RailwaySignalsInferred {
				signals {
					name
					type
					default
					rules
					version
				}
			}`;

	const variables = hasOwner ? { owner: `project:${projectId}` } : {};

	try {
		const res = await fetch('https://backboard.railway.com/graphql/v2', {
			method: 'POST',
			headers,
			body: JSON.stringify({ query, variables }),
			cache: 'no-store',
		});

		if (!res.ok) {
			return cachedSignals;
		}

		const json = await res.json();
		const signalsList: RailwaySignal[] = json?.data?.signals;

		if (Array.isArray(signalsList)) {
			const map = new Map<string, RailwaySignal>();
			for (const s of signalsList) {
				map.set(s.name, s);
			}
			cachedSignals = map;
			lastFetchTimestamp = now;
			return map;
		}
	} catch (err) {
		console.error('[Railway Flags] Error al sincronizar flags:', err);
	}

	return cachedSignals;
}

/**
 * Resuelve el valor booleano de un flag en base a su valor por defecto y reglas.
 */
function resolveBooleanSignal(signal: RailwaySignal, fallback = false): boolean {
	if (typeof signal.default === 'boolean') {
		if (Array.isArray(signal.rules) && signal.rules.length > 0) {
			for (const rule of signal.rules) {
				if (rule?.source?.type === 'literal' && typeof rule.source.value === 'boolean') {
					return rule.source.value;
				}
			}
		}
		return signal.default;
	}
	return fallback;
}

/**
 * Evalúa el estado del modo mantenimiento ("mantain") consultando
 * exclusivamente el feature flag configurado en Railway.
 */
export async function mantainFlag(_ctx?: FlagContext): Promise<boolean> {
	const signals = await fetchRailwaySignals();
	if (signals) {
		const signal = signals.get('mantain') ?? signals.get('maintain');
		if (signal) {
			return resolveBooleanSignal(signal, false);
		}
	}

	return false;
}
