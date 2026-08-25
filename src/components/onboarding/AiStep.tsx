'use client';

import { saveSettings } from '@/api/settings';
import { OpenRouterModelDialog } from '@/components/Settings/OpenRouterModelDialog';
import { sortOpenRouterModels } from '@/components/Settings/settings.constants';
import type { OpenRouterModel, OpenRouterSort } from '@/components/Settings/settings.types';
import { OnboardingOfficialDocs } from '@/components/onboarding/OnboardingOfficialDocs';
import { OnboardingSelectableCard } from '@/components/onboarding/OnboardingSelectableCard';
import { OnboardingStepFrame } from '@/components/onboarding/OnboardingStepFrame';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@clerk/nextjs';
import { type AiProvider, storeAiProvider } from '@/lib/ai-provider';
import { useOnboarding } from '@onboardjs/react';
import type {
	StepProps,
	SandyOnboardingContext,
	OnboardingFlowData,
} from '@/components/onboarding/onboarding.types';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { type UIEvent, useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export function AiStep({ payload }: StepProps) {
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

	const loadOpenRouterModels = useCallback(
		async (query: string, sort: OpenRouterSort = openRouterSort) => {
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
		},
		[openRouterSort],
	);

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
	const officialDocs =
		provider === 'gemini'
			? [
					{
						label: 'Google AI Studio',
						href: 'https://ai.google.dev/aistudio?hl=es-419',
						description: 'Crear y gestionar tu clave de Gemini.',
					},
					{
						label: 'Claves de API',
						href: 'https://ai.google.dev/gemini-api/docs/api-key?hl=es-419',
						description: 'Guía oficial para entender el uso de la key.',
					},
				]
			: [
					{
						label: 'Crear API key',
						href: 'https://openrouter.ai/docs/api/api-reference/api-keys/create-keys',
						description: 'Generar una key nueva en OpenRouter.',
					},
					{
						label: 'Modelos',
						href: 'https://openrouter.ai/docs/guides/overview/models',
						description: 'Ver qué modelos puedes usar y cómo filtrarlos.',
					},
				];

	return (
		<OnboardingStepFrame title={payload.title} description={payload.description}>
			<div className='space-y-4'>
				<div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
					{providers.map((option, index) => (
						<OnboardingSelectableCard
							key={option.id}
							title={option.label}
							description={option.description}
							selected={provider === option.id}
							delay={index * 0.05}
							onClick={() => void handleProviderChange(option.id)}
						/>
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
							<label
								htmlFor='openrouter-model'
								className='font-medium text-muted-foreground text-sm'
							>
								Modelo (opcional, por defecto el mejor disponible)
							</label>
							<Button
								type='button'
								variant='outline'
								onClick={() => setIsOpenRouterModalOpen(true)}
								className='h-auto min-h-12 w-full max-w-md justify-between rounded-2xl border-border/70 bg-background/80 px-4 py-3 text-left'
							>
								<div className='min-w-0 text-left'>
									<p className='truncate font-medium'>{openrouterModel || 'Elegir modelo'}</p>
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

				<OnboardingOfficialDocs
					title='Documentación oficial'
					description='Abre la guía correcta si necesitas crear la clave o revisar cómo funciona la integración.'
					links={officialDocs}
					className='pt-2'
				/>
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
		</OnboardingStepFrame>
	);
}
