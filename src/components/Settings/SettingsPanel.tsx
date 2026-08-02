'use client';

import { stop } from '@/api/sandycore';
import { type SettingsPayload, saveSettings } from '@/api/settings';
import { SandyCoreConfigPanel } from '@/components/Settings/SandyCoreConfigPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppSettings } from '@/context/AppSettingsContext';
import { getStoredAiProvider, storeAiProvider } from '@/lib/ai-provider';
import {
	DEFAULT_FEATURE_FLAGS,
	type SandyCoreConfig,
	normalizeSandyCoreConfig,
} from '@/lib/sandycore-config';
import { getStoredSttProvider, storeSttProvider } from '@/lib/stt-provider';
import { useAuth } from '@clerk/nextjs';
import { Bot, ExternalLink, Mic, Power, Save, Square, Volume2 } from 'lucide-react';
import Image from 'next/image';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import ReactCountryFlag from 'react-country-flag';
import { toast } from 'sonner';

type SettingsFormState = {
	ai_provider: 'gemini' | 'openrouter';
	gemini_api_key: string;
	openrouter_api_key: string;
	openrouter_model: string;
	stt_provider: string;
	tts_provider: string;
	azure_speech_key: string;
	azure_region: string;
	language: string;
	fish_audio_key: string;
	voice_id: string;
	service_mode: 'manual' | 'hybrid';
	auto_start_on_live: boolean;
	auto_stop_on_offline: boolean;
	idle_timeout_minutes: number;
};

const initialState: SettingsFormState = {
	ai_provider: 'gemini',
	gemini_api_key: '',
	openrouter_api_key: '',
	openrouter_model: '',
	stt_provider: 'azure',
	tts_provider: 'fish_audio',
	azure_speech_key: '',
	azure_region: '',
	language: 'es-ES',
	fish_audio_key: '',
	voice_id: '',
	service_mode: 'manual',
	auto_start_on_live: false,
	auto_stop_on_offline: true,
	idle_timeout_minutes: 60,
};

const normalizeSettings = (settings?: SettingsPayload | null): SettingsFormState => ({
	ai_provider: settings?.ai_provider ?? 'gemini',
	gemini_api_key: settings?.gemini_api_key ?? '',
	openrouter_api_key: settings?.openrouter_api_key ?? '',
	openrouter_model: settings?.openrouter_model ?? '',
	stt_provider: settings?.stt_provider ?? 'azure',
	tts_provider: settings?.tts_provider ?? 'fish_audio',
	azure_speech_key: settings?.azure_speech_key ?? '',
	azure_region: settings?.azure_region ?? '',
	language: settings?.language ?? 'es-ES',
	fish_audio_key: settings?.fish_audio_key ?? '',
	voice_id: settings?.voice_id ?? '',
	service_mode: settings?.service_mode ?? 'manual',
	auto_start_on_live: settings?.auto_start_on_live ?? false,
	auto_stop_on_offline: settings?.auto_stop_on_offline ?? true,
	idle_timeout_minutes: settings?.idle_timeout_minutes ?? 60,
});

const azureRegions = [
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

const azureLanguages = [
	{ label: 'Español (España)', value: 'es-ES', flag: 'ES' },
	{ label: 'Español (México)', value: 'es-MX', flag: 'MX' },
	{ label: 'English (US)', value: 'en-US', flag: 'US' },
	{ label: 'English (UK)', value: 'en-GB', flag: 'GB' },
	{ label: 'Português (Brasil)', value: 'pt-BR', flag: 'BR' },
	{ label: 'Français (France)', value: 'fr-FR', flag: 'FR' },
];

type OpenRouterModel = {
	id: string;
	name: string;
	pricing?: {
		prompt?: string;
		completion?: string;
		request?: string;
	};
	architecture?: {
		modality?: string;
		output_modalities?: string[];
	};
	context_length?: number;
	created?: number;
	description?: string;
};

type OpenRouterSort =
	| 'most-popular'
	| 'newest'
	| 'pricing-low-to-high'
	| 'pricing-high-to-low'
	| 'context-high-to-low'
	| 'latency-low-to-high'
	| 'throughput-high-to-low'
	| 'free-only';

const openRouterSortOptions: Array<{ label: string; value: OpenRouterSort }> = [
	{ label: 'Más populares', value: 'most-popular' },
	{ label: 'Más recientes', value: 'newest' },
	{ label: 'Precio: menor a mayor', value: 'pricing-low-to-high' },
	{ label: 'Precio: mayor a menor', value: 'pricing-high-to-low' },
	{ label: 'Solo gratis', value: 'free-only' },
	{ label: 'Contexto más grande', value: 'context-high-to-low' },
	{ label: 'Más veloces', value: 'throughput-high-to-low' },
	{ label: 'Menor latencia', value: 'latency-low-to-high' },
];

const currencyFormatter = new Intl.NumberFormat('en-US', {
	currency: 'USD',
	maximumFractionDigits: 2,
	minimumFractionDigits: 0,
	style: 'currency',
});

const compactNumberFormatter = new Intl.NumberFormat('en-US', {
	compactDisplay: 'short',
	maximumFractionDigits: 1,
	notation: 'compact',
});

const getOpenRouterTokenCost = (model: OpenRouterModel) => {
	const prompt = Number(model.pricing?.prompt ?? '0');
	const completion = Number(model.pricing?.completion ?? '0');
	const request = Number(model.pricing?.request ?? '0');

	return {
		prompt: Number.isFinite(prompt) ? prompt : 0,
		completion: Number.isFinite(completion) ? completion : 0,
		request: Number.isFinite(request) ? request : 0,
	};
};

const formatOpenRouterPrice = (cost: number) => {
	if (cost <= 0) {
		return 'Gratis';
	}

	return `${currencyFormatter.format(cost * 1_000_000)} / 1M tokens`;
};

const formatOpenRouterContext = (model: OpenRouterModel) => {
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

const getOpenRouterModelUrl = (modelId: string) =>
	`https://openrouter.ai/models/${modelId.replace(/^~\/?/, '')}`;

const openRouterProviderIcons: Record<string, string> = {
	amazon: 'Bedrock',
	anthropic: 'Anthropic',
	deepseek: 'SiliconFlow',
	google: 'GoogleGemini',
	'meta-llama': 'CoreWeave',
	microsoft: 'Microsoft',
	openai: 'OpenAI',
	perplexity: 'Perplexity',
};

const getOpenRouterModelIconUrl = (modelId: string) => {
	const author = modelId.split('/')[0]?.toLowerCase();
	const icon = author ? openRouterProviderIcons[author] : undefined;

	return icon ? `https://openrouter.ai/images/icons/${icon}.svg` : null;
};

const sortOpenRouterModels = (
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

type DropdownOption = {
	flag?: string;
	label: string;
	value: string;
};

type DropdownFieldProps = {
	label: string;
	placeholder: string;
	value: string;
	options: DropdownOption[];
	open: boolean;
	setOpen: (open: boolean) => void;
	onChange: (value: string) => void;
	onRefresh?: () => void;
	className?: string;
	hideLabel?: boolean;
};

function DropdownField({
	label,
	placeholder,
	value,
	options,
	open,
	setOpen,
	onChange,
	onRefresh,
	className,
	hideLabel,
}: DropdownFieldProps) {
	const selected = options.find((option) => option.value === value);
	const selectedLabel = selected?.label ?? placeholder;

	return (
		<div className={className}>
			{hideLabel ? null : <Label className='mb-2 block'>{label}</Label>}
			<div className='relative'>
				<Button
					type='button'
					variant='outline'
					onClick={() => setOpen(!open)}
					className='h-9 w-full justify-between bg-card/80 text-left'
				>
					<span className='flex min-w-0 items-center gap-2'>
						{selected?.flag ? (
							<ReactCountryFlag
								countryCode={selected.flag}
								svg
								className='size-5 shrink-0 rounded-full object-cover'
							/>
						) : null}
						<span className='truncate'>{selectedLabel}</span>
					</span>
					<span className='text-muted-foreground'>⌄</span>
				</Button>
				{open ? (
					<div className='absolute top-full right-0 left-0 z-20 mt-2 overflow-hidden rounded-2xl border border-border/60 bg-background/95 shadow-xl backdrop-blur-xl'>
						{options.map((option) => (
							<button
								key={option.value}
								type='button'
								onClick={() => {
									onChange(option.value);
									setOpen(false);
									onRefresh?.();
								}}
								className={[
									'flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors',
									option.value === value
										? 'bg-violet-500/10 text-violet-700 dark:text-violet-300'
										: 'text-foreground hover:bg-accent hover:text-accent-foreground',
								].join(' ')}
							>
								<span className='flex min-w-0 items-center gap-2'>
									{option.flag ? (
										<ReactCountryFlag
											countryCode={option.flag}
											svg
											className='size-5 shrink-0 rounded-full object-cover'
										/>
									) : null}
									<span className='truncate'>{option.label}</span>
								</span>
								{option.value === value ? <span>●</span> : null}
							</button>
						))}
					</div>
				) : null}
			</div>
		</div>
	);
}

type SectionCardProps = {
	icon: ReactNode;
	title: string;
	description: string;
	statusLabel: string;
	statusTone: string;
	children: ReactNode;
	highlighted?: boolean;
};

function SectionCard({
	icon,
	title,
	description,
	statusLabel,
	statusTone,
	children,
	highlighted,
}: SectionCardProps) {
	return (
		<Card
			className={[
				'border-border/60 bg-card/90 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.18)] backdrop-blur-xl transition-all',
				highlighted ? 'ring-1 ring-violet-500/30' : '',
			].join(' ')}
		>
			<CardHeader className='space-y-4 border-border/50 border-b px-5 py-5 sm:px-6'>
				<div className='flex items-start justify-between gap-4'>
					<div className='flex min-w-0 items-start gap-4'>
						<div className='flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-background/80 text-violet-600 shadow-sm'>
							{icon}
						</div>
						<div className='space-y-1'>
							<CardTitle className='text-xl'>{title}</CardTitle>
							<CardDescription className='max-w-xl'>{description}</CardDescription>
						</div>
					</div>
					<Badge variant='outline' className={statusTone}>
						{statusLabel}
					</Badge>
				</div>
			</CardHeader>
			<CardContent className='space-y-5 px-5 py-5 sm:px-6'>{children}</CardContent>
		</Card>
	);
}

function ModelIcon({ modelId }: { modelId: string }) {
	const [failed, setFailed] = useState(false);
	const iconUrl = getOpenRouterModelIconUrl(modelId);

	if (!iconUrl || failed) {
		return (
			<div className='flex size-6 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/80'>
				<Bot className='size-3.5 text-violet-600 dark:text-[#A78BFA]' />
			</div>
		);
	}

	return (
		<div className='flex size-12 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/80'>
			<Image
				src={iconUrl}
				alt=''
				width={48}
				height={48}
				quality={100}
				loading='lazy'
				onError={() => setFailed(true)}
				className='size-12 object-contain'
			/>
		</div>
	);
}

export function SettingsPanel() {
	const { getToken } = useAuth();
	const { settings, isLoading: settingsLoading, refreshSettings } = useAppSettings();
	const [form, setForm] = useState<SettingsFormState>(initialState);
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
		}
	}, [isOpenRouterModalOpen]);

	const updateField = (field: keyof SettingsFormState, value: string) => {
		setForm((current) => ({
			...current,
			[field]: value,
		}));
	};

	const updateLifecycleBoolean = (
		field: 'auto_start_on_live' | 'auto_stop_on_offline',
		value: boolean,
	) => {
		setForm((current) => ({
			...current,
			[field]: value,
		}));
	};

	const updateIdleTimeout = (value: string) => {
		const minutes = Number(value);
		setForm((current) => ({
			...current,
			idle_timeout_minutes:
				Number.isFinite(minutes) && minutes >= 0
					? Math.floor(minutes)
					: current.idle_timeout_minutes,
		}));
	};

	const handleStopService = async () => {
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
	};

	const handleProviderChange = (value: 'gemini' | 'openrouter') => {
		storeAiProvider(value);
		setForm((current) => ({
			...current,
			ai_provider: value,
			gemini_api_key: value === 'gemini' ? current.gemini_api_key : '',
			openrouter_api_key: value === 'openrouter' ? current.openrouter_api_key : '',
			openrouter_model: value === 'openrouter' ? current.openrouter_model : '',
		}));
	};

	const handlePickOpenRouterModel = (model: OpenRouterModel) => {
		setForm((current) => ({
			...current,
			openrouter_model: model.id,
		}));
		setIsOpenRouterModalOpen(false);
	};

	const handleSearchOpenRouterModels = async () => {
		await loadOpenRouterModels(openRouterSearch, openRouterSort);
	};

	const handleOpenRouterScroll = (event: React.UIEvent<HTMLDivElement>) => {
		const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
		const distanceToBottom = scrollHeight - scrollTop - clientHeight;

		if (
			distanceToBottom < 180 &&
			visibleOpenRouterCount < openRouterModels.length &&
			!isLoadingModels
		) {
			setVisibleOpenRouterCount((current) => Math.min(current + 24, openRouterModels.length));
		}
	};

	const handleSave = async () => {
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
			setSandyHasLocalChanges(false);
			toast.success('Ajustes guardados');
		} catch (error) {
			console.error('Error al guardar settings:', error);
			toast.error('No se pudieron guardar los ajustes');
		} finally {
			setIsSaving(false);
		}
	};

	const isBusy = settingsLoading || isSaving;

	return (
		<div className=''>
			<section className='space-y-6'>
				<Card className='overflow-hidden border-border/60 bg-card/90 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.22)] backdrop-blur-xl'>
					<div className='px-6 py-6 sm:px-8'>
						<div className='flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between'>
							<div className='space-y-2'>
								<CardTitle className='font-bold text-3xl [font-family:var(--font-unbounded)] sm:text-4xl'>
									Configuración
								</CardTitle>
								<CardDescription className='max-w-2xl text-sm sm:text-base'>
									Ajusta los proveedores, claves y voz con una interfaz más limpia, clara y modular.
								</CardDescription>
							</div>
							<div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
								<Badge
									variant='outline'
									className='border-border/70 bg-background/80 text-muted-foreground'
								>
									Sincronizado
								</Badge>
								<Button
									onClick={handleSave}
									disabled={isBusy}
									className='bg-[#8B5CF6] text-white hover:bg-[#7C3AED]'
								>
									<Save className='size-4' />
									{isSaving ? 'Guardando...' : 'Guardar configuración'}
								</Button>
							</div>
						</div>
						
					</div>
				</Card>

				<div className='grid gap-4 xl:grid-cols-2'>
					<SandyCoreConfigPanel config={sandyConfig} onConfigChange={handleSandyConfigChange} />
					<SectionCard
						icon={<Bot className='size-5' />}
						title='Proveedor de IA'
						description='Selecciona el motor que usará tu asistente y guarda la clave correspondiente.'
						statusLabel={
							geminiState === 'Configurado' || openRouterState === 'Configurado'
								? 'Listo'
								: 'Pendiente'
						}
						statusTone={
							geminiState === 'Configurado' || openRouterState === 'Configurado'
								? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
								: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
						}
						highlighted
					>
						<Tabs
							value={form.ai_provider}
							onValueChange={(value) => handleProviderChange(value as 'gemini' | 'openrouter')}
							className='w-full'
						>
							<TabsList className='w-full'>
								<TabsTrigger value='gemini' className='flex-1'>
									Gemini
								</TabsTrigger>
								<TabsTrigger value='openrouter' className='flex-1'>
									OpenRouter
								</TabsTrigger>
							</TabsList>

							<TabsContent value='gemini'>
								<div className='space-y-2 pt-4'>
									<Label htmlFor='gemini_api_key'>Gemini API Key</Label>
									<Input
										id='gemini_api_key'
										type='password'
										placeholder='AIza...'
										value={form.gemini_api_key}
										onChange={(event) => updateField('gemini_api_key', event.target.value)}
									/>
								</div>
							</TabsContent>

							<TabsContent value='openrouter'>
								<div className='grid gap-4 pt-4 lg:grid-cols-2'>
									<div className='space-y-2 lg:col-span-2'>
										<Label htmlFor='openrouter_api_key'>OpenRouter API Key</Label>
										<Input
											id='openrouter_api_key'
											type='password'
											placeholder='sk-or-v1-...'
											value={form.openrouter_api_key}
											onChange={(event) => updateField('openrouter_api_key', event.target.value)}
										/>
									</div>
									<div className='space-y-2 lg:col-span-2'>
										<Label htmlFor='openrouter_model'>OpenRouter Model</Label>
										<div className='flex flex-col gap-3 sm:flex-row'>
											<Input
												id='openrouter_model'
												readOnly
												value={form.openrouter_model || 'Selecciona un modelo de texto'}
												className='bg-background/70'
											/>
											<Button
												type='button'
												variant='outline'
												onClick={() => setIsOpenRouterModalOpen(true)}
												className='shrink-0'
											>
												Buscar modelos
											</Button>
										</div>
									</div>
								</div>
							</TabsContent>
						</Tabs>
					</SectionCard>
					<SectionCard
						icon={<Volume2 className='size-5' />}
						title='Voz sintética'
						description='Define la voz sintética. Por ahora solo usa Fish Audio.'
						statusLabel={fishState}
						statusTone={
							fishState === 'Configurado'
								? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
								: 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400'
						}
					>
						<div className='grid gap-4 lg:grid-cols-2'>
							<div className='space-y-2'>
								<Label htmlFor='fish_audio_key'>Fish Audio Key</Label>
								<Input
									id='fish_audio_key'
									type='password'
									placeholder='tu_clave_de_fish_audio'
									value={form.fish_audio_key}
									onChange={(event) => updateField('fish_audio_key', event.target.value)}
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='voice_id'>Fish Voice ID</Label>
								<Input
									id='voice_id'
									placeholder='id_de_voz_fish_audio'
									value={form.voice_id}
									onChange={(event) => updateField('voice_id', event.target.value)}
								/>
							</div>
						</div>
					</SectionCard>
					<SectionCard
						icon={<Mic className='size-5' />}
						title='Reconocimiento de voz'
						description='Convierte tu voz en texto con Azure o con el reconocimiento gratuito del navegador.'
						statusLabel={speechState}
						statusTone={
							speechState === 'Configurado'
								? 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400'
								: speechState === 'No compatible'
									? 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
									: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
						}
					>
						<Tabs
							value={form.stt_provider === 'browser' ? 'browser' : 'azure'}
							onValueChange={(value) => {
								updateField('stt_provider', value);
								storeSttProvider(value as 'azure' | 'browser');
							}}
							className='w-full'
						>
							<TabsList className='w-full'>
								<TabsTrigger value='azure' className='flex-1'>
									Azure
								</TabsTrigger>
								<TabsTrigger value='browser' className='flex-1'>
									Navegador (gratis)
								</TabsTrigger>
							</TabsList>

							<TabsContent value='browser'>
								<div className='space-y-4 pt-4'>
									<div className='rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-cyan-700 text-sm dark:text-cyan-300'>
										Usa el reconocimiento de voz integrado en tu navegador, sin coste ni claves.
										Solo disponible en navegadores basados en Chromium (Google Chrome, Edge, Brave,
										Opera, Vivaldi).
									</div>
									{browserSupportsNativeSpeech ? (
										<div className='rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-700 text-sm dark:text-emerald-300'>
											Tu navegador es compatible. No hace falta configurar nada más.
										</div>
									) : (
										<div className='rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-700 text-sm dark:text-red-300'>
											Tu navegador no es compatible con esta opción. Solo funciona en Google Chrome
											y otros navegadores basados en Chromium.
										</div>
									)}
									<DropdownField
										label='Idioma'
										placeholder='Selecciona un idioma'
										value={form.language}
										options={azureLanguages}
										open={isAzureLanguageOpen}
										setOpen={setIsAzureLanguageOpen}
										onChange={(value) => updateField('language', value)}
									/>
								</div>
							</TabsContent>

							<TabsContent value='azure'>
								<div className='grid gap-4 pt-4 lg:grid-cols-2'>
									<div className='space-y-2'>
										<Label htmlFor='azure_speech_key'>Azure Speech Key</Label>
										<Input
											id='azure_speech_key'
											type='password'
											placeholder='tu_clave_de_azure_speech'
											value={form.azure_speech_key}
											onChange={(event) => updateField('azure_speech_key', event.target.value)}
										/>
									</div>
									<DropdownField
										label='Azure Region'
										placeholder='Selecciona una región'
										value={form.azure_region}
										options={azureRegions}
										open={isAzureRegionOpen}
										setOpen={setIsAzureRegionOpen}
										onChange={(value) => updateField('azure_region', value)}
									/>
									<DropdownField
										label='Idioma de Azure'
										placeholder='Selecciona un idioma'
										value={form.language}
										options={azureLanguages}
										open={isAzureLanguageOpen}
										setOpen={setIsAzureLanguageOpen}
										onChange={(value) => updateField('language', value)}
										className='lg:col-span-2'
									/>
								</div>
							</TabsContent>
						</Tabs>
					</SectionCard>

					<SectionCard
						icon={<Power className='size-5' />}
						title='Ciclo de vida del servicio'
						description='Controla cómo arranca y se detiene la VTuber y cuándo se apaga por inactividad.'
						statusLabel={form.service_mode === 'hybrid' ? 'Híbrido' : 'Manual'}
						statusTone={
							form.service_mode === 'hybrid'
								? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
								: 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400'
						}
					>
						<div className='space-y-5'>
							<div className='space-y-2'>
								<Label>Modo de servicio</Label>
								<Tabs
									value={form.service_mode}
									onValueChange={(value) => updateField('service_mode', value)}
									className='w-full'
								>
									<TabsList className='w-full'>
										<TabsTrigger value='manual' className='flex-1'>
											Manual
										</TabsTrigger>
										<TabsTrigger value='hybrid' className='flex-1'>
											Híbrido
										</TabsTrigger>
									</TabsList>
								</Tabs>
								<p className='text-muted-foreground text-xs'>
									En modo híbrido el monitor revisa el estado del stream y la inactividad para
									arrancar y detener la VTuber automáticamente.
								</p>
							</div>

							{form.service_mode !== 'hybrid' ? (
								<div className='rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-700 text-sm dark:text-amber-300'>
									Estás en modo manual: el arranque y la parada se controlan con los botones. Cambia
									a modo híbrido para activar las opciones automáticas.
								</div>
							) : null}

							<div
								className={
									form.service_mode === 'hybrid'
										? 'space-y-5'
										: 'pointer-events-none select-none space-y-5 opacity-60'
								}
							>
								<div className='flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/60 px-4 py-3'>
									<div className='space-y-0.5'>
										<p className='font-medium text-sm'>Arranque automático al estar live</p>
										<p className='text-muted-foreground text-xs'>
											Arranca la VTuber cuando el stream pase a estar en directo.
										</p>
									</div>
									<Switch
										checked={form.auto_start_on_live}
										disabled={form.service_mode !== 'hybrid'}
										onCheckedChange={(value) => updateLifecycleBoolean('auto_start_on_live', value)}
									/>
								</div>

								<div className='flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/60 px-4 py-3'>
									<div className='space-y-0.5'>
										<p className='font-medium text-sm'>Parada automática al cerrar stream</p>
										<p className='text-muted-foreground text-xs'>
											Detiene la VTuber cuando el stream pase a estar offline.
										</p>
									</div>
									<Switch
										checked={form.auto_stop_on_offline}
										disabled={form.service_mode !== 'hybrid'}
										onCheckedChange={(value) =>
											updateLifecycleBoolean('auto_stop_on_offline', value)
										}
									/>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='idle_timeout_minutes'>
										Minutos de inactividad antes de apagar
									</Label>
									<Input
										id='idle_timeout_minutes'
										type='number'
										min={0}
										placeholder='60'
										disabled={form.service_mode !== 'hybrid'}
										value={form.idle_timeout_minutes}
										onChange={(event) => updateIdleTimeout(event.target.value)}
									/>
									<p className='text-muted-foreground text-xs'>
										Si la VTuber no tiene actividad durante este tiempo, se detiene sola. Usa 0 para
										desactivarlo.
									</p>
								</div>
							</div>

							<Button
								type='button'
								variant='outline'
								onClick={handleStopService}
								disabled={isStopping}
								className='w-full'
							>
								<Square className='size-4' />
								{isStopping ? 'Pausando...' : 'Pausar servicios'}
							</Button>
						</div>
					</SectionCard>
				</div>
			</section>

			<Dialog
				open={isOpenRouterModalOpen}
				onOpenChange={(open) => {
					setIsOpenRouterModalOpen(open);
					if (open && !openRouterSearch.trim()) {
						void loadOpenRouterModels('');
					}
					if (!open) {
						setOpenRouterModelError(null);
					}
				}}
			>
				<DialogContent className='max-h-[88vh] overflow-hidden'>
					<DialogHeader className='px-6 pt-6'>
						<DialogTitle>Buscar modelo de OpenRouter</DialogTitle>
						<DialogDescription>
							Solo se muestran modelos de texto. Busca por nombre o slug y elige el que quieras
							usar.
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-4 px-6'>
						<div className='grid items-end gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,220px)_auto]'>
							<Input
								placeholder='Buscar por nombre o slug'
								value={openRouterSearch}
								onChange={(event) => setOpenRouterSearch(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === 'Enter') {
										event.preventDefault();
										void handleSearchOpenRouterModels();
									}
								}}
							/>
							<DropdownField
								label='Orden'
								placeholder='Ordenar modelos'
								value={openRouterSort}
								options={openRouterSortOptions}
								open={isOpenRouterSortOpen}
								setOpen={setIsOpenRouterSortOpen}
								onChange={(value) => {
									const nextSort = value as OpenRouterSort;
									setOpenRouterSort(nextSort);
									if (isOpenRouterModalOpen) {
										void loadOpenRouterModels(openRouterSearch, nextSort);
									}
								}}
								hideLabel
							/>
							<Button
								type='button'
								onClick={handleSearchOpenRouterModels}
								disabled={isLoadingModels}
								className='text-foreground'
							>
								{isLoadingModels ? 'Buscando...' : 'Buscar'}
							</Button>
						</div>

						{openRouterModelError ? (
							<div className='rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive text-sm'>
								{openRouterModelError}
							</div>
						) : null}

						<div className='max-h-[52vh] overflow-y-auto pr-1' onScroll={handleOpenRouterScroll}>
							{isLoadingModels ? (
								<div className='grid gap-3'>
									{Array.from({ length: 6 }).map((_, index) => (
										<div
											key={index}
											className='flex flex-col gap-2 rounded-2xl border border-border/60 p-4'
										>
											<Skeleton className='h-4 w-48' />
											<Skeleton className='h-3 w-full' />
											<Skeleton className='h-3 w-3/4' />
										</div>
									))}
								</div>
							) : openRouterModels.length > 0 ? (
								<div className='grid gap-3'>
									{visibleOpenRouterModels.map((model) =>
										(() => {
											const pricing = getOpenRouterTokenCost(model);
											const totalCost = pricing.prompt + pricing.completion + pricing.request;
											const modelUrl = getOpenRouterModelUrl(model.id);

											return (
												<div
													key={model.id}
													className={[
														'relative flex w-full flex-col gap-2 rounded-2xl border p-4 text-left transition-all',
														form.openrouter_model === model.id
															? 'border-violet-500/40 bg-violet-500/10'
															: 'border-border/60 bg-card hover:bg-violet-500/5 dark:hover:bg-violet-500/10',
													].join(' ')}
												>
													<Button
														type='button'
														variant='ghost'
														onClick={() => handlePickOpenRouterModel(model)}
														className='h-auto w-full justify-start p-0 text-left hover:bg-transparent'
													>
														<div className='flex w-full flex-col gap-2 pr-32'>
															<div className='flex items-center gap-2'>
																<ModelIcon modelId={model.id} />
																<div className='min-w-0'>
																	<p className='font-medium text-sm'>{model.name}</p>
																	<p className='text-muted-foreground text-xs'>{model.id}</p>
																</div>
															</div>
															<div className='flex flex-wrap gap-2'>
																<Badge
																	variant='outline'
																	className={
																		totalCost <= 0
																			? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
																			: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
																	}
																>
																	{totalCost <= 0 ? 'Gratis' : 'Pago'}
																</Badge>
																{totalCost > 0 ? (
																	<>
																		<Badge
																			variant='outline'
																			className='border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400'
																		>
																			Entrada {formatOpenRouterPrice(pricing.prompt)}
																		</Badge>
																		<Badge
																			variant='outline'
																			className='border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400'
																		>
																			Salida {formatOpenRouterPrice(pricing.completion)}
																		</Badge>
																		{pricing.request > 0 ? (
																			<Badge
																				variant='outline'
																				className='border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400'
																			>
																				Petición {formatOpenRouterPrice(pricing.request)}
																			</Badge>
																		) : null}
																	</>
																) : null}
															</div>
															<div className='flex flex-wrap gap-2 text-muted-foreground text-xs'>
																<Badge
																	variant='outline'
																	className='border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
																>
																	{formatOpenRouterContext(model)}
																</Badge>
															</div>
														</div>
													</Button>
													<Button
														asChild
														variant='outline'
														size='sm'
														className='absolute top-4 right-4 h-8 gap-1 rounded-full border-border/70 bg-background/80'
													>
														<a href={modelUrl} target='_blank' rel='noreferrer'>
															<ExternalLink className='size-3.5' />
															Ver en OpenRouter
														</a>
													</Button>
												</div>
											);
										})(),
									)}
									{visibleOpenRouterCount < openRouterModels.length ? (
										<div className='flex items-center justify-center py-2 text-muted-foreground text-xs'>
											Desliza para cargar más modelos
										</div>
									) : null}
								</div>
							) : (
								<div className='flex min-h-44 items-center justify-center rounded-2xl border border-border/60 border-dashed px-4 text-muted-foreground text-sm'>
									No hay resultados para esa búsqueda.
								</div>
							)}
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
