'use client';

import { type SettingsPayload, saveSettings } from '@/api/settings';
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
import { useAppSettings } from '@/context/AppSettingsContext';
import { useAuth } from '@clerk/nextjs';
import { Bot, ExternalLink, Mic, Save, Volume2 } from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
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
	{ label: 'Español (España)', value: 'es-ES' },
	{ label: 'Español (México)', value: 'es-MX' },
	{ label: 'English (US)', value: 'en-US' },
	{ label: 'English (UK)', value: 'en-GB' },
	{ label: 'Português (Brasil)', value: 'pt-BR' },
	{ label: 'Français (France)', value: 'fr-FR' },
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
	const selectedLabel = options.find((option) => option.value === value)?.label ?? placeholder;

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
					<span className='truncate'>{selectedLabel}</span>
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
								<span>{option.label}</span>
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
				'overflow-hidden border-border/60 bg-card/90 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.18)] backdrop-blur-xl transition-all',
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

export function SettingsPanel() {
	const { getToken } = useAuth();
	const { settings, isLoading: settingsLoading, refreshSettings } = useAppSettings();
	const [form, setForm] = useState<SettingsFormState>(initialState);
	const [isSaving, setIsSaving] = useState(false);
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

	const activeProviderLabel = useMemo(
		() => (form.ai_provider === 'gemini' ? 'Gemini' : 'OpenRouter'),
		[form.ai_provider],
	);

	const providerBadgeClassName =
		form.ai_provider === 'gemini'
			? 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400'
			: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400';
	const sttProviderBadgeClassName =
		form.stt_provider === 'azure'
			? 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400'
			: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400';
	const ttsProviderBadgeClassName =
		form.tts_provider === 'fish_audio'
			? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
			: 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400';

	const geminiState = form.gemini_api_key ? 'Configurado' : 'Pendiente';
	const openRouterState =
		form.openrouter_api_key && form.openrouter_model ? 'Configurado' : 'Pendiente';
	const speechState =
		form.azure_speech_key && form.azure_region && form.language ? 'Configurado' : 'Pendiente';
	const fishState = form.fish_audio_key && form.voice_id ? 'Configurado' : 'Pendiente';
	const selectedOpenRouterModel = useMemo(
		() => openRouterModels.find((model) => model.id === form.openrouter_model) ?? null,
		[form.openrouter_model, openRouterModels],
	);
	const visibleOpenRouterModels = useMemo(
		() => openRouterModels.slice(0, visibleOpenRouterCount),
		[openRouterModels, visibleOpenRouterCount],
	);

	useEffect(() => {
		setForm(normalizeSettings(settings));
	}, [settings]);

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

	const handleProviderChange = (value: 'gemini' | 'openrouter') => {
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
			};

			await saveSettings(payload, { token });
			await refreshSettings();
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
					<div className='border-border/60 border-b px-6 py-6 sm:px-8'>
						<div className='flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between'>
							<div className='space-y-2'>
								<CardTitle className='text-3xl sm:text-4xl'>Configuración de IA</CardTitle>
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
									className='bg-[#604ABB] text-white hover:bg-[#4f3fa3]'
								>
									<Save className='size-4' />
									{isSaving ? 'Guardando...' : 'Guardar configuración'}
								</Button>
							</div>
						</div>
						<div className='mt-5 flex flex-wrap gap-2'>
							<Badge variant='outline' className={providerBadgeClassName}>
								Proveedor activo: {activeProviderLabel}
							</Badge>
							<Badge variant='outline' className={sttProviderBadgeClassName}>
								STT: {form.stt_provider === 'azure' ? 'Azure' : 'Fish Audio'}
							</Badge>
							<Badge variant='outline' className={ttsProviderBadgeClassName}>
								TTS: {form.tts_provider === 'fish_audio' ? 'Fish Audio' : 'Azure'}
							</Badge>
						</div>
					</div>
				</Card>

				<div className='grid gap-4 xl:grid-cols-2'>
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
						<div className='grid gap-2 sm:grid-cols-2'>
							<Button
								type='button'
								variant='outline'
								onClick={() => handleProviderChange('gemini')}
								className={
									form.ai_provider === 'gemini'
										? 'justify-start border-transparent bg-[#604ABB] text-white hover:bg-[#4f3fa3] hover:text-white'
										: 'justify-start'
								}
							>
								Gemini
							</Button>
							<Button
								type='button'
								variant='outline'
								onClick={() => handleProviderChange('openrouter')}
								className={
									form.ai_provider === 'openrouter'
										? 'justify-start border-transparent bg-[#604ABB] text-white hover:bg-[#4f3fa3] hover:text-white'
										: 'justify-start'
								}
							>
								OpenRouter
							</Button>
						</div>

						{form.ai_provider === 'gemini' ? (
							<div className='space-y-2'>
								<Label htmlFor='gemini_api_key'>Gemini API Key</Label>
								<Input
									id='gemini_api_key'
									type='password'
									placeholder='AIza...'
									value={form.gemini_api_key}
									onChange={(event) => updateField('gemini_api_key', event.target.value)}
								/>
							</div>
						) : (
							<div className='grid gap-4 lg:grid-cols-2'>
								<div className='space-y-2'>
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
									<p className='text-muted-foreground text-xs'>
										Solo se muestran modelos de texto de OpenRouter.
									</p>
									{selectedOpenRouterModel ? (
										<p className='text-muted-foreground text-xs'>
											Selección actual: {selectedOpenRouterModel.name} ({selectedOpenRouterModel.id}
											)
										</p>
									) : null}
								</div>
							</div>
						)}
					</SectionCard>

					<SectionCard
						icon={<Mic className='size-5' />}
						title='Reconocimiento de voz'
						description='Configura STT para convertir el audio en texto. Por ahora solo usa Azure.'
						statusLabel={speechState}
						statusTone={
							speechState === 'Configurado'
								? 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400'
								: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
						}
					>
						<div className='grid gap-4 lg:grid-cols-2'>
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
							>
								{isLoadingModels ? 'Buscando...' : 'Buscar'}
							</Button>
						</div>

						<div className='rounded-2xl border border-border/60 bg-background/70 p-3'>
							<p className='text-muted-foreground text-xs'>
								Filtro activo: solo texto · Orden:{' '}
								{openRouterSortOptions.find((option) => option.value === openRouterSort)?.label}
							</p>
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
															: 'border-border/60 bg-card hover:border-violet-500/30 hover:bg-violet-500/5',
													].join(' ')}
												>
													<Button
														type='button'
														variant='ghost'
														onClick={() => handlePickOpenRouterModel(model)}
														className='h-auto w-full justify-start p-0 text-left hover:bg-transparent'
													>
														<div className='flex w-full flex-col gap-2 pr-32'>
															<div>
																<p className='font-medium text-sm'>{model.name}</p>
																<p className='text-muted-foreground text-xs'>{model.id}</p>
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
