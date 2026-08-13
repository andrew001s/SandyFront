export const ONBOARDING_PERSISTENCE_KEY = 'onboardjs:sandy-vtuber';
export const ONBOARDING_COMPLETE_KEY = 'sandy:onboarding:complete';
export const ONBOARDING_DISMISSED_KEY = 'sandy:onboarding:dismissed';

export function isOnboardingComplete(): boolean {
	if (typeof window === 'undefined') return false;
	try {
		return window.localStorage.getItem(ONBOARDING_COMPLETE_KEY) === '1';
	} catch {
		return false;
	}
}

export function isOnboardingDismissed(): boolean {
	if (typeof window === 'undefined') return false;
	try {
		return window.localStorage.getItem(ONBOARDING_DISMISSED_KEY) === '1';
	} catch {
		return false;
	}
}
