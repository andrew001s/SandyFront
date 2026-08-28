import { TTS_PROVIDER, type SettingsPayload } from '@/api/settings';
import type {
	OpenRouterModel,
	OpenRouterSort,
	SettingsFormState,
} from '@/components/Settings/settings.types';

export const initialSettingsFormState: SettingsFormState = {
	ai_provider: 'gemini',
	gemini_api_key: '',
	openrouter_api_key: '',
	openrouter_model: '',
	local_api_url: '',
	local_model: '',
	stt_provider: 'azure',
	tts_provider: TTS_PROVIDER,
	azure_speech_key: '',
	azure_region: '',
	language: 'es-ES',
	fish_audio_key: '',
	voice_id: '',
	service_mode: 'manual',
	auto_start_on_live: false,
	auto_stop_on_offline: true,
	idle_timeout_minutes: 60,
	chunk_size: 3,
};

export const azureRegions = [
	{ label: 'East US', value: 'eastus' },
	{ label: 'East US 2', value: 'eastus2' },
	{ label: 'West US', value: 'westus' },
	{ label: 'West US 2', value: 'westus2' },
	{ label: 'Central US', value: 'centralus' },
	{ label: 'Brazil South', value: 'brazilsouth' },
	{ label: 'North Europe', value: 'northeurope' },
	{ label: 'West Europe', value: 'westeurope' },
	{ label: 'Southeast Asia', value: 'southeastasia' },
];

export const azureLanguages = [
	{ label: 'Español (España)', value: 'es-ES', flag: 'ES' },
	{ label: 'Español (México)', value: 'es-MX', flag: 'MX' },
	{ label: 'English (US)', value: 'en-US', flag: 'US' },
	{ label: 'English (UK)', value: 'en-GB', flag: 'GB' },
	{ label: 'Português (Brasil)', value: 'pt-BR', flag: 'BR' },
	{ label: 'Français (France)', value: 'fr-FR', flag: 'FR' },
];

export const openRouterSortOptions: Array<{ label: string; value: OpenRouterSort }> = [
	{ label: 'Más populares', value: 'most-popular' },
	{ label: 'Más recientes', value: 'newest' },
	{ label: 'Precio: menor a mayor', value: 'pricing-low-to-high' },
	{ label: 'Precio: mayor a menor', value: 'pricing-high-to-low' },
	{ label: 'Solo gratis', value: 'free-only' },
	{ label: 'Contexto más grande', value: 'context-high-to-low' },
	{ label: 'Más veloces', value: 'throughput-high-to-low' },
	{ label: 'Menor latencia', value: 'latency-low-to-high' },
];

export const currencyFormatter = new Intl.NumberFormat('en-US', {
	currency: 'USD',
	maximumFractionDigits: 2,
	minimumFractionDigits: 0,
	style: 'currency',
});

export const compactNumberFormatter = new Intl.NumberFormat('en-US', {
	compactDisplay: 'short',
	maximumFractionDigits: 1,
	notation: 'compact',
});

export const normalizeSettings = (settings?: SettingsPayload | null): SettingsFormState => ({
	ai_provider: settings?.ai_provider ?? 'gemini',
	gemini_api_key: settings?.gemini_api_key ?? '',
	openrouter_api_key: settings?.openrouter_api_key ?? '',
	openrouter_model: settings?.openrouter_model ?? '',
	local_api_url: settings?.local_api_url ?? '',
	local_model: settings?.local_model ?? '',
	stt_provider: settings?.stt_provider ?? 'azure',
	// Se ignora lo que venga del backend: los perfiles viejos traen 'fish'.
	tts_provider: TTS_PROVIDER,
	azure_speech_key: settings?.azure_speech_key ?? '',
	azure_region: settings?.azure_region ?? '',
	language: settings?.language ?? 'es-ES',
	fish_audio_key: settings?.fish_audio_key ?? '',
	voice_id: settings?.voice_id ?? '',
	service_mode: settings?.service_mode ?? 'manual',
	auto_start_on_live: settings?.auto_start_on_live ?? false,
	auto_stop_on_offline: settings?.auto_stop_on_offline ?? true,
	idle_timeout_minutes: settings?.idle_timeout_minutes ?? 60,
	chunk_size: settings?.chunk_size ?? 3,
});

export const getOpenRouterTokenCost = (model: OpenRouterModel) => {
	const prompt = Number(model.pricing?.prompt ?? '0');
	const completion = Number(model.pricing?.completion ?? '0');
	const request = Number(model.pricing?.request ?? '0');

	return {
		prompt: Number.isFinite(prompt) ? prompt : 0,
		completion: Number.isFinite(completion) ? completion : 0,
		request: Number.isFinite(request) ? request : 0,
	};
};

export const formatOpenRouterPrice = (cost: number) => {
	if (cost <= 0) {
		return 'Gratis';
	}

	return `${currencyFormatter.format(cost * 1_000_000)} / 1M tokens`;
};

export const formatOpenRouterContext = (model: OpenRouterModel) => {
	const context = model.context_length ?? 0;

	if (context <= 0) {
		return 'Contexto no indicado';
	}

	const compactContext = compactNumberFormatter.format(context).replace(/\s+/g, '');
	if (context < 16_000) {
		return `Memoria corta · ${compactContext}`;
	}

	if (context < 64_000) {
		return `Memoria media · ${compactContext}`;
	}

	if (context < 200_000) {
		return `Memoria amplia · ${compactContext}`;
	}

	return `Memoria enorme · ${compactContext}+`;
};

export const getOpenRouterModelUrl = (modelId: string) =>
	`https://openrouter.ai/models/${modelId.replace(/^~\/?/, '')}`;

export const openRouterProviderIcons: Record<string, string> = {
	amazon: 'Bedrock',
	anthropic: 'Anthropic',
	deepseek: 'SiliconFlow',
	google: 'GoogleGemini',
	'meta-llama': 'CoreWeave',
	microsoft: 'Microsoft',
	openai: 'OpenAI',
	perplexity: 'Perplexity',
};

export const getOpenRouterModelIconUrl = (modelId: string) => {
	const author = modelId.split('/')[0]?.toLowerCase();
	const icon = author ? openRouterProviderIcons[author] : undefined;

	return icon ? `https://openrouter.ai/images/icons/${icon}.svg` : null;
};

export const sortOpenRouterModels = (
	models: OpenRouterModel[],
	sort: OpenRouterSort,
): OpenRouterModel[] => {
	const enriched = models.map((model) => {
		const pricing = getOpenRouterTokenCost(model);
		const totalCost = pricing.prompt + pricing.completion + pricing.request;
		return { model, pricing, totalCost, context: model.context_length ?? 0 };
	});

	const filtered =
		sort === 'free-only' ? enriched.filter((entry) => entry.totalCost <= 0) : enriched;
	const sorted = [...filtered];

	switch (sort) {
		case 'pricing-low-to-high':
			sorted.sort((a, b) => a.totalCost - b.totalCost);
			break;
		case 'pricing-high-to-low':
			sorted.sort((a, b) => b.totalCost - a.totalCost);
			break;
		case 'context-high-to-low':
			sorted.sort((a, b) => b.context - a.context);
			break;
		default:
			break;
	}

	return sorted.map((entry) => entry.model);
};
