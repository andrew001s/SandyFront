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
