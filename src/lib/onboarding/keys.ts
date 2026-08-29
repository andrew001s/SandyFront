import { getSettings, saveSettings } from '@/api/settings';

/**
 * Marca el onboarding como visto en la cuenta del usuario.
 *
 * El localStorage se mantiene como caché para no parpadear mientras cargan los
 * ajustes, pero la fuente de verdad es el backend: si no, el onboarding
 * reaparecía en cada dispositivo, en incógnito y al limpiar el navegador.
 */
export async function markOnboardingCompleteRemote(token?: string | null): Promise<void> {
	await saveSettings({ onboarding_completed: true }, { token });
}

/** Devuelve null si no se pudo consultar, para no decidir a ciegas. */
export async function fetchOnboardingCompleted(token?: string | null): Promise<boolean | null> {
	try {
		const { settings } = await getSettings({ token });
		return settings?.onboarding_completed === true;
	} catch {
		return null;
	}
}

const ONBOARDING_PERSISTENCE_PREFIX = 'onboardjs:sandy-vtuber';
const ONBOARDING_COMPLETE_PREFIX = 'sandy:onboarding:complete';
const ONBOARDING_DISMISSED_PREFIX = 'sandy:onboarding:dismissed';

const buildScopedKey = (prefix: string, userId?: string | null) =>
	userId ? `${prefix}:${userId}` : prefix;

export function getOnboardingPersistenceKey(userId?: string | null) {
	return buildScopedKey(ONBOARDING_PERSISTENCE_PREFIX, userId);
}

export function getOnboardingCompleteKey(userId?: string | null) {
	return buildScopedKey(ONBOARDING_COMPLETE_PREFIX, userId);
}

export function getOnboardingDismissedKey(userId?: string | null) {
	return buildScopedKey(ONBOARDING_DISMISSED_PREFIX, userId);
}

export function isOnboardingComplete(userId?: string | null): boolean {
	if (typeof window === 'undefined' || !userId) return false;
	try {
		return window.localStorage.getItem(getOnboardingCompleteKey(userId)) === '1';
	} catch {
		return false;
	}
}

export function isOnboardingDismissed(userId?: string | null): boolean {
	if (typeof window === 'undefined' || !userId) return false;
	try {
		return window.localStorage.getItem(getOnboardingDismissedKey(userId)) === '1';
	} catch {
		return false;
	}
}

export function markOnboardingComplete(userId?: string | null) {
	if (typeof window === 'undefined' || !userId) return;
	try {
		window.localStorage.setItem(getOnboardingCompleteKey(userId), '1');
		window.localStorage.removeItem(getOnboardingDismissedKey(userId));
	} catch {
		// ignore storage errors
	}
}

export function markOnboardingDismissed(userId?: string | null) {
	if (typeof window === 'undefined' || !userId) return;
	try {
		window.localStorage.setItem(getOnboardingDismissedKey(userId), '1');
	} catch {
		// ignore storage errors
	}
}
