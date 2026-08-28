const AI_PROVIDER_KEY = 'sandy_ai_provider';

export type AiProvider = 'gemini' | 'openrouter' | 'local';

const AI_PROVIDERS: AiProvider[] = ['gemini', 'openrouter', 'local'];

export function getStoredAiProvider(): AiProvider | null {
	if (typeof window === 'undefined') {
		return null;
	}

	try {
		const value = window.localStorage.getItem(AI_PROVIDER_KEY);
		return AI_PROVIDERS.includes(value as AiProvider) ? (value as AiProvider) : null;
	} catch {
		return null;
	}
}

export function storeAiProvider(provider: AiProvider): void {
	if (typeof window === 'undefined') {
		return;
	}

	try {
		window.localStorage.setItem(AI_PROVIDER_KEY, provider);
	} catch {
		return;
	}
}
