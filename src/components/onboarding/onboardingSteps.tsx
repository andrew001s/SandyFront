'use client';

import { saveSettings } from '@/api/settings';
import { FishVoiceDialog } from '@/components/Settings/FishVoiceDialog';
import { OpenRouterModelDialog } from '@/components/Settings/OpenRouterModelDialog';
import {
	sortOpenRouterModels,
} from '@/components/Settings/settings.constants';
import type { OpenRouterModel, OpenRouterSort } from '@/components/Settings/settings.types';
import { FishVoicePreviewCard } from '@/components/Settings/sections/FishVoicePreviewCard';
import { OnboardingConnectionsRow } from '@/components/onboarding/OnboardingConnectionsRow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AvatarConnectionCard } from '@/containers/avatar/components/AvatarConnectionCard';
import { AvatarModelListCard } from '@/containers/avatar/components/AvatarModelListCard';
import { useVTubeStudio } from '@/hooks/useVTubeStudio';
import { type AiProvider, storeAiProvider } from '@/lib/ai-provider';
import { useAuth } from '@clerk/nextjs';
import type { OnboardingContext, CustomComponentStepPayload } from '@onboardjs/core';
import { type OnboardingStep, type StepComponentProps, useOnboarding } from '@onboardjs/react';
import { motion } from 'framer-motion';
import {
	Bot,
	Check,
	ChevronRight,
	GitBranch,
	MonitorSpeaker,
	Smile,
	Sparkles,
	Volume2,
	Youtube,
} from 'lucide-react';
import { type UIEvent, useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export type OnboardingFlowData = {
	twitchConnected?: boolean;
	kickConnected?: boolean;
	youtubeConnected?: boolean;
	aiProvider?: AiProvider;
	geminiApiKey?: string;
	openrouterApiKey?: string;
	openrouterModel?: string;
	fishAudioKey?: string;
	voiceId?: string;
	vtubeConnected?: boolean;
	completedAt?: number;
};

export type SandyOnboardingContext = OnboardingContext & {
	flowData: OnboardingFlowData;
};

export type OnboardingStepPayload = CustomComponentStepPayload & {
	title?: string;
	description?: string;
};

type StepProps = StepComponentProps<OnboardingStepPayload, SandyOnboardingContext>;

function StepFrame({
	title,
	description,
	children,
}: {
	title?: string;
	description?: string;
	children: React.ReactNode;
}) {
	return (
		<motion.div
			className='space-y-6'
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
		>
			<div className='space-y-2'>
				<h2 className='font-bold text-2xl [font-family:var(--font-unbounded)] sm:text-3xl'>
					<span className='bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent dark:from-[#A78BFA] dark:to-[#22D3EE]'>
						{title}
					</span>
				</h2>
				{description ? <p className='max-w-xl text-muted-foreground'>{description}</p> : null}
			</div>
			{children}
		</motion.div>
	);
}

function WelcomeStep({ payload }: StepProps) {
	const { next } = useOnboarding<SandyOnboardingContext>();
	const items = [
		{ icon: <GitBranch className='size-4' />, label: 'Tus conexiones en un solo lugar' },
		{ icon: <Bot className='size-4' />, label: 'El modelo de IA que piensa por tu VTuber' },
		{ icon: <Volume2 className='size-4' />, label: 'La voz con el selector incluido' },
		{ icon: <MonitorSpeaker className='size-4' />, label: 'Tu avatar de VTube Studio' },
	];

	return (
		<StepFrame title={payload.title} description={payload.description}>
			<motion.ul
				className='space-y-3'
				initial='hidden'
				animate='show'
				variants={{
					hidden: {},
					show: { transition: { staggerChildren: 0.07 } },
				}}
			>
				{items.map((item) => (
					<motion.li
						key={item.label}
						variants={{
							hidden: { opacity: 0, y: 10 },
							show: { opacity: 1, y: 0 },
						}}
						whileHover={{ y: -2 }}
						transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
						className='flex items-center gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-3'
					>
						<div className='flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'>
							{item.icon}
						</div>
						<span className='font-medium text-sm'>{item.label}</span>
					</motion.li>
				))}
			</motion.ul>
			<div className='flex justify-end pt-2'>
				<Button size='lg' onClick={() => void next()}>
					Comenzar
					<ChevronRight className='size-4' />
				</Button>
			</div>
		</StepFrame>
	);
}

function ConnectionsStep({ payload }: StepProps) {
	return (
		<StepFrame title={payload.title} description={payload.description}>
			<motion.div
				initial={{ opacity: 0, y: 12, scale: 0.99 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
			>
				<OnboardingConnectionsRow />
			</motion.div>
		</StepFrame>
	);
}

function AiStep({ payload }: StepProps) {
	const { state, updateContext } = useOnboarding<SandyOnboardingContext>();
	const { getToken } = useAuth();
	const flowData = state?.context.flowData;
	const [provider, setProvider] = useState<AiProvider>(flowData?.aiProvider ?? 'gemini');
	const [geminiKey, setGeminiKey] = useState(flowData?.geminiApiKey ?? '');
	const [openrouterKey, setOpenrouterKey] = useState(flowData?.openrouterApiKey ?? '');
	const [openrouterModel, setOpenrouterModel] = useState(flowData?.openrouterModel ?? '');
	const [isOpenRouterModalOpen, setIsOpenRouterModalOpen] = useState(false);
	const [isOpenRouterSortOpen, setIsOpenRouterSortOpen] = useState(false);
	const [openRouterSearch, setOpenRouterSearch] = useState('');
	const [openRouterSort, setOpenRouterSort] = useState<OpenRouterSort>('most-popular');
	const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>([]);
	const [visibleOpenRouterCount, setVisibleOpenRouterCount] = useState(24);
	const [isLoadingOpenRouterModels, setIsLoadingOpenRouterModels] = useState(false);
	const [openRouterModelError, setOpenRouterModelError] = useState<string | null>(null);
	const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const handleProviderChange = useCallback(
		(nextProvider: AiProvider) => {
			storeAiProvider(nextProvider);
			setProvider(nextProvider);
			void updateContext({
				flowData: { ...state?.context.flowData, aiProvider: nextProvider },
			});
		},
		[state?.context.flowData, updateContext],
	);

	const persist = useCallback(
		async (patch: Partial<OnboardingFlowData>) => {
			const nextFlow = { ...state?.context.flowData, ...patch };
			void updateContext({ flowData: nextFlow });
			if (saveTimer.current) clearTimeout(saveTimer.current);
			saveTimer.current = setTimeout(async () => {
				try {
					const token = await getToken();
					await saveSettings(
						{
							ai_provider: nextFlow.aiProvider,
							gemini_api_key: nextFlow.aiProvider === 'gemini' ? nextFlow.geminiApiKey : '',
							openrouter_api_key:
								nextFlow.aiProvider === 'openrouter' ? nextFlow.openrouterApiKey : '',
							openrouter_model: nextFlow.openrouterModel,
						},
						{ token },
					);
				} catch {
					toast.error('No se pudo guardar la configuración de IA');
				}
			}, 500);
		},
		[getToken, state?.context.flowData, updateContext],
	);

	const loadOpenRouterModels = useCallback(async (query: string, sort: OpenRouterSort = openRouterSort) => {
		try {
			setIsLoadingOpenRouterModels(true);
			setOpenRouterModelError(null);

			const apiSort = sort === 'free-only' ? 'most-popular' : sort;
			const params = new URLSearchParams({
				output_modalities: 'text',
				sort: apiSort,
			});

			if (query.trim()) {
				params.set('q', query.trim());
			}

			const response = await fetch(`https://openrouter.ai/api/v1/models?${params.toString()}`);
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
			setIsLoadingOpenRouterModels(false);
		}
	}, [openRouterSort]);

	useEffect(() => {
		if (isOpenRouterModalOpen && provider === 'openrouter') {
			void loadOpenRouterModels('', openRouterSort);
		}
	}, [isOpenRouterModalOpen, loadOpenRouterModels, openRouterSort, provider]);

	useEffect(() => {
		if (!isOpenRouterModalOpen) {
			setIsOpenRouterSortOpen(false);
			setOpenRouterModelError(null);
		}
	}, [isOpenRouterModalOpen]);

	const handlePickOpenRouterModel = useCallback(
		(model: OpenRouterModel) => {
			setOpenrouterModel(model.id);
			void persist({ openrouterModel: model.id });
			setIsOpenRouterModalOpen(false);
		},
		[persist],
	);

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
				!isLoadingOpenRouterModels
			) {
				setVisibleOpenRouterCount((current) => Math.min(current + 24, openRouterModels.length));
			}
		},
		[isLoadingOpenRouterModels, openRouterModels.length, visibleOpenRouterCount],
	);

	const providers: { id: AiProvider; label: string; description: string }[] = [
		{
			id: 'gemini',
			label: 'Gemini',
			description: 'Gratuito y rápido. Introduce tu API key de Google AI Studio.',
		},
		{
			id: 'openrouter',
			label: 'OpenRouter',
			description: 'Cientos de modelos (GPT, Claude, Llama...) con una sola key.',
		},
	];

	return (
		<StepFrame title={payload.title} description={payload.description}>
			<div className='space-y-4'>
				<div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
					{providers.map((option, index) => (
						<motion.button
							key={option.id}
							type='button'
							onClick={() => void handleProviderChange(option.id)}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.28, delay: index * 0.05 }}
							whileHover={{ y: -2 }}
							whileTap={{ scale: 0.98 }}
							className={`rounded-2xl border p-4 text-left transition-colors ${
								provider === option.id
									? 'border-primary bg-primary/5 ring-1 ring-primary/30'
									: 'border-border/70 bg-background/80 hover:border-primary/40'
							}`}
						>
							<div className='flex items-center gap-2'>
								<Bot className='size-4 text-primary' />
								<span className='font-medium'>{option.label}</span>
							</div>
							<p className='mt-1 text-muted-foreground text-xs'>{option.description}</p>
						</motion.button>
					))}
				</div>

				{provider === 'gemini' ? (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.28 }}
						className='space-y-2'
					>
						<label htmlFor='gemini-key' className='font-medium text-muted-foreground text-sm'>
							API key de Gemini
						</label>
						<Input
							id='gemini-key'
							type='password'
							value={geminiKey}
							onChange={(event) => {
								setGeminiKey(event.target.value);
								void persist({ geminiApiKey: event.target.value });
							}}
							placeholder='AIza...'
							className='max-w-md'
						/>
					</motion.div>
				) : (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.28 }}
						className='space-y-4'
					>
						<div className='space-y-2'>
							<label htmlFor='openrouter-key' className='font-medium text-muted-foreground text-sm'>
								API key de OpenRouter
							</label>
							<Input
								id='openrouter-key'
								type='password'
								value={openrouterKey}
								onChange={(event) => {
									setOpenrouterKey(event.target.value);
									void persist({ openrouterApiKey: event.target.value });
								}}
								placeholder='sk-or-v1-...'
								className='max-w-md'
							/>
						</div>
						<div className='space-y-2'>
							<label className='font-medium text-muted-foreground text-sm'>
								Modelo (opcional, por defecto el mejor disponible)
							</label>
							<Button
								type='button'
								variant='outline'
								onClick={() => setIsOpenRouterModalOpen(true)}
								className='h-auto min-h-12 w-full max-w-md justify-between rounded-2xl border-border/70 bg-background/80 px-4 py-3 text-left'
							>
								<div className='min-w-0 text-left'>
									<p className='truncate font-medium'>
										{openrouterModel || 'Elegir modelo'}
									</p>
									<p className='truncate text-muted-foreground text-xs'>
										{openrouterModel
											? 'Haz clic para cambiarlo desde el modal.'
											: 'Se abrirá el selector de OpenRouter.'}
									</p>
								</div>
								<ChevronRight className='size-4 shrink-0 text-muted-foreground' />
							</Button>
						</div>
					</motion.div>
				)}
			</div>

			<OpenRouterModelDialog
				open={isOpenRouterModalOpen}
				onOpenChange={setIsOpenRouterModalOpen}
				search={openRouterSearch}
				setSearch={setOpenRouterSearch}
				sort={openRouterSort}
				setSort={handleOpenRouterSortChange}
				isSortOpen={isOpenRouterSortOpen}
				setIsSortOpen={setIsOpenRouterSortOpen}
				loadModels={async (query, sort) => {
					await loadOpenRouterModels(query, sort);
				}}
				isLoading={isLoadingOpenRouterModels}
				error={openRouterModelError}
				models={openRouterModels}
				visibleModels={openRouterModels.slice(0, visibleOpenRouterCount)}
				visibleCount={visibleOpenRouterCount}
				onScroll={handleOpenRouterScroll}
				onPickModel={handlePickOpenRouterModel}
			/>
		</StepFrame>
	);
}

function VoiceStep({ payload }: StepProps) {
	const { state, updateContext } = useOnboarding<SandyOnboardingContext>();
	const { getToken } = useAuth();
	const flowData = state?.context.flowData;
	const [fishKey, setFishKey] = useState(flowData?.fishAudioKey ?? '');
	const [voiceId, setVoiceId] = useState(flowData?.voiceId ?? '');
	const [isFishVoiceDialogOpen, setIsFishVoiceDialogOpen] = useState(false);
	const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const persist = useCallback(
		async (patch: Partial<OnboardingFlowData>) => {
			const nextFlow = { ...state?.context.flowData, ...patch };
			void updateContext({ flowData: nextFlow });
			if (saveTimer.current) clearTimeout(saveTimer.current);
			saveTimer.current = setTimeout(async () => {
				try {
					const token = await getToken();
					await saveSettings(
						{
							tts_provider: 'fish',
							fish_audio_key: nextFlow.fishAudioKey,
							voice_id: nextFlow.voiceId,
						},
						{ token },
					);
				} catch {
					toast.error('No se pudo guardar la configuración de voz');
				}
			}, 500);
		},
		[getToken, state?.context.flowData, updateContext],
	);

	return (
		<StepFrame title={payload.title} description={payload.description}>
			<motion.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.32 }}
			>
				<Card className='border-border/70 bg-background/80 shadow-sm'>
					<CardHeader className='space-y-2 border-b border-border/60'>
						<CardTitle className='text-xl'>Configura la voz</CardTitle>
						<CardDescription>
							Agrega tu Fish Audio Key y elige una voz desde el selector visual. No necesitas escribir el nombre manualmente.
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-5 p-6'>
						<div className='space-y-2'>
							<label htmlFor='fish-key' className='font-medium text-muted-foreground text-sm'>
								API key de Fish Audio
							</label>
							<Input
								id='fish-key'
								type='password'
								value={fishKey}
								onChange={(event) => {
									setFishKey(event.target.value);
									void persist({ fishAudioKey: event.target.value });
								}}
								placeholder='FM0LwDs...'
								className='max-w-md'
							/>
						</div>

						<div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start'>
							<div className='space-y-2'>
								<p className='font-medium text-muted-foreground text-sm'>Voz seleccionada</p>
								<p className='text-muted-foreground text-xs'>
									Abre el selector y elige una voz. El nombre ya no se escribe aquí.
								</p>
							</div>
							<motion.div
								initial={{ opacity: 0, scale: 0.985 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ duration: 0.28 }}
								className='w-full max-w-xl'
							>
								<FishVoicePreviewCard
									apiKey={fishKey}
									voiceId={voiceId}
									onClick={() => setIsFishVoiceDialogOpen(true)}
								/>
							</motion.div>
						</div>

						<p className='flex items-center gap-1.5 text-muted-foreground text-xs'>
							<Smile className='size-4 shrink-0' />
							Podés cambiar la voz más tarde desde Ajustes sin rehacer el onboarding.
						</p>
					</CardContent>
				</Card>
			</motion.div>

			<FishVoiceDialog
				open={isFishVoiceDialogOpen}
				onOpenChange={setIsFishVoiceDialogOpen}
				apiKey={fishKey}
				voiceId={voiceId}
				onPickVoiceId={(pickedVoiceId) => {
					setVoiceId(pickedVoiceId);
					void persist({ voiceId: pickedVoiceId });
				}}
			/>
		</StepFrame>
	);
}

function VTubeStudioStep({ payload }: StepProps) {
	const { state, updateContext } = useOnboarding<SandyOnboardingContext>();
	const {
		connecting,
		connected,
		error,
		stats,
		models,
		currentModel,
		folderInfo,
		connect,
		disconnect,
		refreshModels,
		loadModel,
	} = useVTubeStudio();

	return (
		<StepFrame title={payload.title} description={payload.description}>
			<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.32 }}
				>
					<AvatarConnectionCard
						connecting={connecting}
						connected={connected}
						error={error}
						stats={stats}
						onConnect={connect}
						onDisconnect={async () => {
							await disconnect();
							void updateContext({
								flowData: { ...state?.context.flowData, vtubeConnected: false },
							});
						}}
						onRefreshModels={refreshModels}
					/>
				</motion.div>
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.32, delay: 0.05 }}
				>
					<AvatarModelListCard
						connected={connected}
						models={models}
						currentModelId={currentModel?.modelID ?? null}
						modelsFolderPath={folderInfo?.models}
						onLoadModel={async (modelID) => {
							await loadModel(modelID);
							void updateContext({
								flowData: {
									...state?.context.flowData,
									vtubeConnected: true,
								},
							});
						}}
					/>
				</motion.div>
			</div>
			<p className='flex items-center gap-1.5 text-muted-foreground text-xs'>
				<MonitorSpeaker className='size-4 shrink-0' />
				Tené VTube Studio abierto en tu PC y activá la opción &quot;Allow Plugin API access&quot; en
				el puerto 8001.
			</p>
		</StepFrame>
	);
}

function CompletedStep({ payload }: StepProps) {
	const { state, next } = useOnboarding<SandyOnboardingContext>();
	const flowData = state?.context.flowData;

	const rows = [
		{
			label: 'Conexiones',
			done: Boolean(flowData?.twitchConnected || flowData?.kickConnected || flowData?.youtubeConnected),
		},
		{ label: 'Modelo de IA', done: Boolean(flowData?.aiProvider) },
		{ label: 'Voz configurada', done: Boolean(flowData?.fishAudioKey && flowData?.voiceId) },
		{ label: 'VTube Studio conectado', done: Boolean(flowData?.vtubeConnected) },
	];

	return (
		<StepFrame title={payload.title} description={payload.description}>
			<motion.ul
				className='max-w-lg space-y-2'
				initial='hidden'
				animate='show'
				variants={{
					hidden: {},
					show: { transition: { staggerChildren: 0.05 } },
				}}
			>
				{rows.map((row) => (
					<motion.li
						key={row.label}
						variants={{
							hidden: { opacity: 0, x: -10 },
							show: { opacity: 1, x: 0 },
						}}
						className='flex items-center justify-between rounded-xl border px-4 py-2.5'
					>
						<span className='text-sm'>{row.label}</span>
						{row.done ? (
							<span className='flex items-center gap-1.5 font-medium text-emerald-500 text-xs'>
								<Check className='size-4' /> Listo
							</span>
						) : (
							<span className='text-muted-foreground text-xs'>Puedes completarlo después</span>
						)}
					</motion.li>
				))}
			</motion.ul>
			<div className='flex items-center gap-3 pt-2'>
				<Sparkles className='size-5 text-amber-400' />
				<p className='text-muted-foreground text-sm'>
					¡Listo! Ya podés ir a tu dashboard y hacer vivir a tu VTuber.
				</p>
			</div>
			<div className='flex justify-end pt-2'>
				<Button size='lg' onClick={() => void next()}>
					Ir al dashboard
					<ChevronRight className='size-4' />
				</Button>
			</div>
		</StepFrame>
	);
}

const stepMeta = {
	welcome: { title: '¡Bienvenido a Sandy Studio!' },
	connections: { title: 'Tus conexiones', description: 'Todo Twitch, Kick y YouTube en un solo paso.' },
	ai: {
		title: 'Elige tu modelo de IA',
		description: 'El cerebro que piensa y responde por tu VTuber.',
	},
	voice: {
		title: 'Configurá su voz',
		description: 'Con Fish Audio tu avatar habla con la voz que elijas desde un selector visual.',
	},
	'vtube-studio': {
		title: 'Conectá VTube Studio',
		description: 'Tu avatar cobra vida y hace lip sync.',
	},
	completed: { title: '¡Todo listo!' },
} as const;

export type OnboardingStepId = keyof typeof stepMeta;

export const steps: OnboardingStep<SandyOnboardingContext>[] = [
	{
		id: 'welcome',
		type: 'CUSTOM_COMPONENT',
		component: WelcomeStep,
		payload: { ...stepMeta.welcome, componentKey: 'welcome' },
		nextStep: 'connections',
	},
	{
		id: 'connections',
		type: 'CUSTOM_COMPONENT',
		component: ConnectionsStep,
		payload: { ...stepMeta.connections, componentKey: 'connections' },
		nextStep: 'ai',
	},
	{
		id: 'ai',
		type: 'CUSTOM_COMPONENT',
		component: AiStep,
		payload: { ...stepMeta.ai, componentKey: 'ai' },
		nextStep: 'voice',
	},
	{
		id: 'voice',
		type: 'CUSTOM_COMPONENT',
		component: VoiceStep,
		payload: { ...stepMeta.voice, componentKey: 'voice' },
		nextStep: 'vtube-studio',
	},
	{
		id: 'vtube-studio',
		type: 'CUSTOM_COMPONENT',
		component: VTubeStudioStep,
		payload: { ...stepMeta['vtube-studio'], componentKey: 'vtube-studio' },
		nextStep: 'completed',
		isSkippable: true,
		skipToStep: 'completed',
	},
	{
		id: 'completed',
		type: 'CUSTOM_COMPONENT',
		component: CompletedStep,
		payload: { ...stepMeta.completed, componentKey: 'completed' },
		nextStep: null,
	},
];

export const stepOrder = steps.map((step) => step.id) as OnboardingStepId[];

export const onboardingStepsIcons: Record<OnboardingStepId, React.ReactNode> = {
	welcome: <Sparkles className='size-4' />,
	connections: <GitBranch className='size-4' />,
	ai: <Bot className='size-4' />,
	voice: <Volume2 className='size-4' />,
	'vtube-studio': <MonitorSpeaker className='size-4' />,
	completed: <Check className='size-4' />,
};
