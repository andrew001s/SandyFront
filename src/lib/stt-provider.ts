const STT_PROVIDER_KEY = 'sandy_stt_provider';

export type SttProvider = 'azure' | 'browser';

export function getStoredSttProvider(): SttProvider | null {
	if (typeof window === 'undefined') {
		return null;
	}

	try {
		const value = window.localStorage.getItem(STT_PROVIDER_KEY);
		return value === 'browser' || value === 'azure' ? value : null;
	} catch {
		return null;
	}
}

export function storeSttProvider(provider: SttProvider): void {
	if (typeof window === 'undefined') {
		return;
	}

	try {
		window.localStorage.setItem(STT_PROVIDER_KEY, provider);
	} catch {
		return;
	}
}
