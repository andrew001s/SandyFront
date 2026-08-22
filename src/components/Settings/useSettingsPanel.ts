import { stop } from '@/api/sandycore';
import { type SettingsPayload, saveSettings } from '@/api/settings';
import {
	DEFAULT_FEATURE_FLAGS,
	type SandyCoreConfig,
	normalizeSandyCoreConfig,
} from '@/lib/sandycore-config';
import { getStoredAiProvider, storeAiProvider } from '@/lib/ai-provider';
import { getStoredSttProvider, storeSttProvider } from '@/lib/stt-provider';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useAuth } from '@clerk/nextjs';
import posthog from 'posthog-js';
import { type UIEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
	initialSettingsFormState,
	normalizeSettings,
	sortOpenRouterModels,
} from '@/components/Settings/settings.constants';
import type {
	OpenRouterModel,
	OpenRouterSort,
	SettingsFormState,
} from '@/components/Settings/settings.types';

export function useSettingsPanel() {
	const { getToken } = useAuth();
	const { settings, isLoading: settingsLoading, refreshSettings } = useAppSettings();
	const [form, setForm] = useState<SettingsFormState>(initialSettingsFormState);
	const [isSaving, setIsSaving] = useState(false);
	const [isStopping, setIsStopping] = useState(false);
	const [isOpenRouterModalOpen, setIsOpenRouterModalOpen] = useState(false);
	const [openRouterSearch, setOpenRouterSearch] = useState('');
	const [openRouterSort, setOpenRouterSort] = useState<OpenRouterSort>('most-popular');
	const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>([]);
	const [visibleOpenRouterCount, setVisibleOpenRouterCount] = useState(24);
	const [isLoadingModels, setIsLoadingModels] = useState(false);
	const [openRouterModelError, setOpenRouterModelError] = useState<string | null>(null);
	const [isAzureRegionOpen, setIsAzureRegionOpen] = useState(false);
	const [isAzureLanguageOpen, setIsAzureLanguageOpen] = useState(false);
	const [isOpenRouterSortOpen, setIsOpenRouterSortOpen] = useState(false);
	const [browserSupportsNativeSpeech, setBrowserSupportsNativeSpeech] = useState(false);
	const [sandyConfig, setSandyConfig] = useState<SandyCoreConfig>({
		feature_flags: { ...DEFAULT_FEATURE_FLAGS },
	});
	const [sandyHasLocalChanges, setSandyHasLocalChanges] = useState(false);

	const handleSandyConfigChange = useCallback((next: SandyCoreConfig) => {
		setSandyConfig(next);
		setSandyHasLocalChanges(true);
	}, []);

	const geminiState = form.gemini_api_key ? 'Configurado' : 'Pendiente';
	const openRouterState =
		form.openrouter_api_key && form.openrouter_model ? 'Configurado' : 'Pendiente';
	const speechState =
		form.stt_provider === 'browser'
			? browserSupportsNativeSpeech
				? 'Configurado'
				: 'No compatible'
			: form.azure_speech_key && form.azure_region && form.language
				? 'Configurado'
				: 'Pendiente';
	const fishState = form.fish_audio_key && form.voice_id ? 'Configurado' : 'Pendiente';
	const visibleOpenRouterModels = useMemo(
		() => openRouterModels.slice(0, visibleOpenRouterCount),
		[openRouterModels, visibleOpenRouterCount],
	);

	useEffect(() => {
		setForm(normalizeSettings(settings));
		const storedStt = getStoredSttProvider();
		const storedAi = getStoredAiProvider();
		if (
			(storedStt && storedStt !== (settings?.stt_provider ?? 'azure')) ||
			(storedAi && storedAi !== (settings?.ai_provider ?? 'gemini'))
		) {
			setForm((current) => ({
				...current,
				stt_provider: storedStt ?? current.stt_provider,
				ai_provider: storedAi ?? current.ai_provider,
			}));
		}
	}, [settings]);

	useEffect(() => {
		if (!sandyHasLocalChanges && settings) {
			setSandyConfig(normalizeSandyCoreConfig(settings));
		}
	}, [sandyHasLocalChanges, settings]);

	useEffect(() => {
		const speechWindow = window as Window & {
			SpeechRecognition?: unknown;
			webkitSpeechRecognition?: unknown;
			mozSpeechRecognition?: unknown;
			msSpeechRecognition?: unknown;
		};
		const supported = Boolean(
			speechWindow.SpeechRecognition ||
				speechWindow.webkitSpeechRecognition ||
				speechWindow.mozSpeechRecognition ||
				speechWindow.msSpeechRecognition,
		);
		setBrowserSupportsNativeSpeech(supported);
	}, []);

	const loadOpenRouterModels = useCallback(
		async (query: string, sort: OpenRouterSort = openRouterSort) => {
			try {
				setIsLoadingModels(true);
				setOpenRouterModelError(null);

				const apiSort = sort === 'free-only' ? 'most-popular' : sort;
				const params = new URLSearchParams({
					output_modalities: 'text',
					sort: apiSort,
				});

				if (query.trim()) {
					params.set('q', query.trim());
				}

				const response = await fetch(`https://openrouter.ai/api/v1/models?${params.toString()}`, {
					headers: form.openrouter_api_key
						? {
								Authorization: `Bearer ${form.openrouter_api_key}`,
							}
						: undefined,
				});

				if (!response.ok) {
					throw new Error(`OpenRouter respondió ${response.status}`);
				}

				const data = (await response.json()) as { data?: OpenRouterModel[] };
				const models = sortOpenRouterModels(
					(data.data ?? []).filter(
						(model) =>
							model.architecture?.output_modalities?.includes('text') ||
							model.architecture?.modality === 'text->text',
					),
					sort,
				).slice(0, 120);

				setOpenRouterModels(models);
				setVisibleOpenRouterCount(24);
			} catch (error) {
				console.error('Error al cargar modelos de OpenRouter:', error);
				setOpenRouterModelError('No se pudieron cargar los modelos de OpenRouter.');
				setOpenRouterModels([]);
				setVisibleOpenRouterCount(24);
			} finally {
				setIsLoadingModels(false);
			}
		},
		[form.openrouter_api_key, openRouterSort],
	);

	useEffect(() => {
		if (isOpenRouterModalOpen && form.ai_provider === 'openrouter') {
			void loadOpenRouterModels('', openRouterSort);
		}
	}, [isOpenRouterModalOpen, form.ai_provider, openRouterSort, loadOpenRouterModels]);

	useEffect(() => {
		if (!isOpenRouterModalOpen) {
			setIsOpenRouterSortOpen(false);
			setIsAzureRegionOpen(false);
			setIsAzureLanguageOpen(false);
			setOpenRouterModelError(null);
		}
	}, [isOpenRouterModalOpen]);

	const updateField = useCallback((field: keyof SettingsFormState, value: string) => {
		setForm((current) => ({
			...current,
			[field]: value,
		}));
	}, []);

	const updateLifecycleBoolean = useCallback(
		(field: 'auto_start_on_live' | 'auto_stop_on_offline', value: boolean) => {
			setForm((current) => ({
				...current,
				[field]: value,
			}));
		},
		[],
	);

	const updateSttProvider = useCallback((value: 'azure' | 'browser') => {
		storeSttProvider(value);
		setForm((current) => ({
			...current,
			stt_provider: value,
		}));
	}, []);

	const updateIdleTimeout = useCallback((value: string) => {
		const minutes = Number(value);
		setForm((current) => ({
			...current,
			idle_timeout_minutes:
				Number.isFinite(minutes) && minutes >= 0
					? Math.floor(minutes)
					: current.idle_timeout_minutes,
		}));
	}, []);

	const handleStopService = useCallback(async () => {
		try {
			setIsStopping(true);
			await stop(false);
			toast.success('Servicios pausados');
		} catch (error) {
			console.error('Error al detener servicios:', error);
			toast.error('No se pudieron detener los servicios');
		} finally {
			setIsStopping(false);
		}
	}, []);

	const handleProviderChange = useCallback((value: 'gemini' | 'openrouter') => {
		storeAiProvider(value);
		setForm((current) => ({
			...current,
			ai_provider: value,
			gemini_api_key: value === 'gemini' ? current.gemini_api_key : '',
			openrouter_api_key: value === 'openrouter' ? current.openrouter_api_key : '',
			openrouter_model: value === 'openrouter' ? current.openrouter_model : '',
		}));
	}, []);

	const handlePickOpenRouterModel = useCallback((model: OpenRouterModel) => {
		setForm((current) => ({
			...current,
			openrouter_model: model.id,
		}));
		setIsOpenRouterModalOpen(false);
	}, []);

	const handleSearchOpenRouterModels = useCallback(async () => {
		await loadOpenRouterModels(openRouterSearch, openRouterSort);
	}, [loadOpenRouterModels, openRouterSearch, openRouterSort]);

	const handleOpenRouterSortChange = useCallback(
		(value: OpenRouterSort) => {
			setOpenRouterSort(value);
			if (isOpenRouterModalOpen) {
				void loadOpenRouterModels(openRouterSearch, value);
			}
		},
		[isOpenRouterModalOpen, loadOpenRouterModels, openRouterSearch],
	);

	const handleOpenRouterScroll = useCallback(
		(event: UIEvent<HTMLDivElement>) => {
			const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
			const distanceToBottom = scrollHeight - scrollTop - clientHeight;

			if (
				distanceToBottom < 180 &&
				visibleOpenRouterCount < openRouterModels.length &&
				!isLoadingModels
			) {
				setVisibleOpenRouterCount((current) => Math.min(current + 24, openRouterModels.length));
			}
		},
		[isLoadingModels, openRouterModels.length, visibleOpenRouterCount],
	);

	const handleSave = useCallback(async () => {
		try {
			setIsSaving(true);
			const token = await getToken();

			const payload: SettingsPayload = {
				ai_provider: form.ai_provider,
				gemini_api_key: form.ai_provider === 'gemini' ? form.gemini_api_key : '',
				openrouter_api_key: form.ai_provider === 'openrouter' ? form.openrouter_api_key : '',
				openrouter_model: form.ai_provider === 'openrouter' ? form.openrouter_model : '',
				stt_provider: form.stt_provider,
				tts_provider: form.tts_provider,
				azure_speech_key: form.azure_speech_key,
				azure_region: form.azure_region,
				language: form.language || 'es-ES',
				fish_audio_key: form.fish_audio_key,
				voice_id: form.voice_id,
				persona_profile: sandyConfig.persona_profile,
				prompt_overrides: sandyConfig.prompt_overrides,
				custom_banned_words: sandyConfig.custom_banned_words,
				custom_banned_symbols: sandyConfig.custom_banned_symbols,
				custom_banned_links: sandyConfig.custom_banned_links,
				service_mode: form.service_mode,
				auto_start_on_live: form.auto_start_on_live,
				auto_stop_on_offline: form.auto_stop_on_offline,
				idle_timeout_minutes: form.idle_timeout_minutes,
			};

			await saveSettings(payload, { token });
			await refreshSettings();
			posthog.capture('settings_saved', {
				ai_provider: form.ai_provider,
				stt_provider: form.stt_provider,
				tts_provider: form.tts_provider,
				service_mode: form.service_mode,
			});
			setSandyHasLocalChanges(false);
			toast.success('Ajustes guardados');
		} catch (error) {
			console.error('Error al guardar settings:', error);
			toast.error('No se pudieron guardar los ajustes');
		} finally {
			setIsSaving(false);
		}
	}, [form, getToken, refreshSettings, sandyConfig]);

	const isBusy = settingsLoading || isSaving;

	return {
		form,
		isSaving,
		isStopping,
		isBusy,
		settingsLoading,
		browserSupportsNativeSpeech,
		sandyConfig,
		geminiState,
		openRouterState,
		speechState,
		fishState,
		visibleOpenRouterModels,
		visibleOpenRouterCount,
		openRouterSearch,
		setOpenRouterSearch,
		openRouterSort,
		handleOpenRouterSortChange,
		openRouterModels,
		isLoadingModels,
		openRouterModelError,
		isOpenRouterModalOpen,
		setIsOpenRouterModalOpen,
		isAzureRegionOpen,
		setIsAzureRegionOpen,
		isAzureLanguageOpen,
		setIsAzureLanguageOpen,
		isOpenRouterSortOpen,
		setIsOpenRouterSortOpen,
		handleSandyConfigChange,
		updateField,
		updateLifecycleBoolean,
		updateSttProvider,
		updateIdleTimeout,
		handleStopService,
		handleProviderChange,
		handlePickOpenRouterModel,
		handleSearchOpenRouterModels,
		loadOpenRouterModels,
		handleOpenRouterScroll,
		handleSave,
	};
}
