'use client';

import { OpenRouterModelDialog } from '@/components/Settings/OpenRouterModelDialog';
import { sortOpenRouterModels } from '@/components/Settings/settings.constants';
import type { OpenRouterModel, OpenRouterSort } from '@/components/Settings/settings.types';
import { OnboardingOfficialDocs } from '@/components/onboarding/OnboardingOfficialDocs';
import { OnboardingSelectableCard } from '@/components/onboarding/OnboardingSelectableCard';
import { OnboardingStepFrame } from '@/components/onboarding/OnboardingStepFrame';
import type {
	OnboardingFlowData,
	SandyOnboardingContext,
	StepProps,
} from '@/components/onboarding/onboarding.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AiProvider } from '@/lib/ai-provider';
import { getStoredLocalAiSettings } from '@/lib/local-ai-config';
import { useOnboarding } from '@onboardjs/react';
import { ChevronRight } from 'lucide-react';
import { type UIEvent, useCallback, useEffect, useState } from 'react';
import { useOnboardingDraft } from './useOnboardingDraft';

export function AiStep({ payload }: StepProps) {
	const { state } = useOnboarding<SandyOnboardingContext>();
	const { update } = useOnboardingDraft();
	const flowData = state?.context.flowData;
	const [provider, setProvider] = useState<AiProvider>(flowData?.aiProvider ?? 'gemini');
	const [geminiKey, setGeminiKey] = useState(flowData?.geminiApiKey ?? '');
	const [openrouterKey, setOpenrouterKey] = useState(flowData?.openrouterApiKey ?? '');
	const [openrouterModel, setOpenrouterModel] = useState(flowData?.openrouterModel ?? '');
	const [localApiUrl, setLocalApiUrl] = useState(
		() => flowData?.localApiUrl ?? getStoredLocalAiSettings().baseUrl,
	);
	const [localModel, setLocalModel] = useState(
		() => flowData?.localModel ?? getStoredLocalAiSettings().model,
	);
	const [isOpenRouterModalOpen, setIsOpenRouterModalOpen] = useState(false);
	const [isOpenRouterSortOpen, setIsOpenRouterSortOpen] = useState(false);
	const [openRouterSearch, setOpenRouterSearch] = useState('');
	const [openRouterSort, setOpenRouterSort] = useState<OpenRouterSort>('most-popular');
	const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>([]);
	const [visibleOpenRouterCount, setVisibleOpenRouterCount] = useState(24);
	const [isLoadingOpenRouterModels, setIsLoadingOpenRouterModels] = useState(false);
	const [openRouterModelError, setOpenRouterModelError] = useState<string | null>(null);
	useEffect(() => {
		if (!flowData?.aiProvider || (provider === 'local' && flowData.localApiUrl === undefined))
			void update({
				aiProvider: provider,
				...(provider === 'local' ? { localApiUrl, localModel } : {}),
			});
	}, [flowData?.aiProvider, flowData?.localApiUrl, provider, localApiUrl, localModel, update]);

	const handleProviderChange = useCallback(
		(nextProvider: AiProvider) => {
			setProvider(nextProvider);
			void update({
				aiProvider: nextProvider,
				...(nextProvider === 'local' ? { localApiUrl, localModel } : {}),
			});
		},
		[update, localApiUrl, localModel],
	);

	const persist = useCallback(
		async (patch: Partial<OnboardingFlowData>) => {
			await update({ aiProvider: provider, ...patch });
		},
		[provider, update],
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
			description:
				'Usa una clave de Google AI Studio. La disponibilidad depende de tu cuenta y del modelo.',
		},
		{
			id: 'openrouter',
			label: 'OpenRouter',
			description: 'Elige entre varios modelos con una clave de OpenRouter.',
		},
		{
			id: 'local',
			label: 'Modelo local',
			description:
				'Conecta Ollama, LM Studio u otro servidor compatible que ya tengas funcionando.',
		},
	];
	const officialDocs =
		provider === 'local'
			? [
					{
						label: 'Ollama',
						href: 'https://github.com/ollama/ollama/blob/main/docs/faq.md#how-can-i-allow-additional-web-origins-to-access-ollama',
						description: 'Cómo permitir que esta web se conecte (OLLAMA_ORIGINS).',
					},
					{
						label: 'LM Studio',
						href: 'https://lmstudio.ai/docs/app/api/headless',
						description: 'Levantar el servidor local compatible con OpenAI.',
					},
				]
			: provider === 'gemini'
				? [
						{
							label: 'Google AI Studio',
							href: 'https://ai.google.dev/aistudio?hl=es-419',
							description: 'Crear y gestionar tu clave de Gemini.',
						},
						{
							label: 'Claves de API',
							href: 'https://ai.google.dev/gemini-api/docs/api-key?hl=es-419',
							description: 'Guía oficial para crear y utilizar la clave.',
						},
					]
				: [
						{
							label: 'Crear clave de API',
							href: 'https://openrouter.ai/workspaces/default/keys',
							description: 'Generar una clave nueva en OpenRouter.',
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
				<fieldset aria-label='Proveedor de IA' className='grid grid-cols-1 gap-3'>
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
				</fieldset>

				{provider === 'local' ? (
					<div className='space-y-4'>
						<div className='space-y-2'>
							<label htmlFor='local-api-url' className='font-medium text-muted-foreground text-sm'>
								URL de la API
							</label>
							<Input
								id='local-api-url'
								type='url'
								value={localApiUrl}
								onChange={(event) => {
									setLocalApiUrl(event.target.value);
									void persist({ localApiUrl: event.target.value });
								}}
								placeholder='http://localhost:11434'
								className='min-h-11 w-full'
							/>
							<p className='text-muted-foreground text-xs'>
								Cualquier servidor compatible con la API de OpenAI. Pega la raíz y se completa{' '}
								<code>/v1/chat/completions</code>.
							</p>
						</div>
						<div className='space-y-2'>
							<label htmlFor='local-model' className='font-medium text-muted-foreground text-sm'>
								Modelo (opcional)
							</label>
							<Input
								id='local-model'
								value={localModel}
								onChange={(event) => {
									setLocalModel(event.target.value);
									void persist({ localModel: event.target.value });
								}}
								placeholder='llama3.1'
								className='min-h-11 w-full'
							/>
							<p className='text-muted-foreground text-xs'>
								Solo hace falta si tu servidor tiene varios modelos cargados.
							</p>
						</div>
						<div className='max-w-md rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs'>
							<p className='font-medium text-amber-600 dark:text-amber-400'>
								Tu servidor tiene que aceptar esta web
							</p>
							<p className='mt-1 text-muted-foreground'>
								El navegador se conecta directo, por eso este motor responde en streaming. En Ollama
								se configura con <code>OLLAMA_ORIGINS</code>; en LM Studio, con el interruptor de
								CORS.
							</p>
						</div>
					</div>
				) : provider === 'gemini' ? (
					<div className='space-y-2'>
						<label htmlFor='gemini-key' className='font-medium text-muted-foreground text-sm'>
							Clave de API de Gemini
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
							className='min-h-11 w-full'
						/>
					</div>
				) : (
					<div className='space-y-4'>
						<div className='space-y-2'>
							<label htmlFor='openrouter-key' className='font-medium text-muted-foreground text-sm'>
								Clave de API de OpenRouter
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
								className='min-h-11 w-full'
							/>
						</div>
						<div className='flex flex-col gap-2'>
							<label
								htmlFor='openrouter-model'
								className='font-medium text-muted-foreground text-sm'
							>
								Modelo (opcional)
							</label>
							<Button
								id='openrouter-model'
								type='button'
								variant='outline'
								onClick={() => setIsOpenRouterModalOpen(true)}
								className='h-auto min-h-12 w-full max-w-md justify-between rounded-2xl border-border/70 bg-background/80 px-4 py-3 text-left'
							>
								<div className='min-w-0 text-left'>
									<p className='truncate font-medium'>{openrouterModel || 'Elegir modelo'}</p>
									<p className='truncate text-muted-foreground text-xs'>
										{openrouterModel ? 'Cambiar modelo.' : 'Se abrirá el selector de OpenRouter.'}
									</p>
								</div>
								<ChevronRight className='size-4 shrink-0 text-muted-foreground' />
							</Button>
						</div>
					</div>
				)}

				<OnboardingOfficialDocs
					title={provider === 'local' ? 'conectar mi servidor local' : 'conseguir mi clave de API'}
					description={
						provider === 'local'
							? 'Arranca tu servidor y permite el acceso desde este navegador antes de probarlo en el estudio.'
							: 'La clave se crea en la cuenta del proveedor. Pégala arriba y guarda para seguir. Cada servicio aplica sus propias condiciones de uso.'
					}
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
