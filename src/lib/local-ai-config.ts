import type { SettingsPayload } from '@/api/settings';

/**
 * La URL del modelo local se guarda también en el navegador, igual que ya se hace
 * con `sandy_ai_provider` y `sandy_stt_provider`. El backend no devuelve estos
 * campos en `GET /settings`, así que sin esta copia el valor se pierde en cuanto
 * se recarga la configuración y la validación cree que no hay motor configurado.
 */
const LOCAL_AI_URL_KEY = 'sandy_local_ai_url';
const LOCAL_AI_MODEL_KEY = 'sandy_local_ai_model';

export type LocalAiSettings = {
	baseUrl: string;
	model: string;
};

const read = (key: string): string => {
	if (typeof window === 'undefined') {
		return '';
	}

	try {
		return window.localStorage.getItem(key)?.trim() ?? '';
	} catch {
		return '';
	}
};

const write = (key: string, value: string): void => {
	if (typeof window === 'undefined') {
		return;
	}

	try {
		if (value.trim()) {
			window.localStorage.setItem(key, value.trim());
		} else {
			window.localStorage.removeItem(key);
		}
	} catch {
		return;
	}
};

export function getStoredLocalAiSettings(): LocalAiSettings {
	return {
		baseUrl: read(LOCAL_AI_URL_KEY),
		model: read(LOCAL_AI_MODEL_KEY),
	};
}

export function storeLocalAiSettings(settings: LocalAiSettings): void {
	write(LOCAL_AI_URL_KEY, settings.baseUrl);
	write(LOCAL_AI_MODEL_KEY, settings.model);
}

/** Lo guardado en el navegador manda; el backend solo sirve de respaldo. */
export function resolveLocalAiSettings(settings: SettingsPayload | null): LocalAiSettings {
	const stored = getStoredLocalAiSettings();

	return {
		baseUrl: stored.baseUrl || (settings?.local_api_url ?? ''),
		model: stored.model || (settings?.local_model ?? ''),
	};
}
