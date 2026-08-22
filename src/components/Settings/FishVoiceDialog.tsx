'use client';

import {
	buildFishAudioCoverImageProxySrc,
	getFishAudioModel,
	searchFishAudioModels,
	type FishAudioModel,
} from '@/api/fetchFishModels';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import Image from 'next/image';
import CountryFlag from 'react-country-flag';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type FishVoiceDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	apiKey: string;
	voiceId: string;
	onPickVoiceId: (voiceId: string) => void;
};

type FishSortOption = 'score' | 'created_at' | 'task_count';

type FishLanguageOption = {
	key: string;
	label: string;
	query: string;
	countryCode?: string;
};

function detectFishLanguageKey() {
	if (typeof navigator === 'undefined') {
		return 'all';
	}

	const preferredLocale = navigator.languages?.[0] ?? navigator.language ?? '';
	const lowerLocale = preferredLocale.toLowerCase();

	if (lowerLocale.startsWith('es')) return 'es';
	if (lowerLocale.startsWith('en')) return 'en';
	if (lowerLocale.startsWith('zh')) return 'zh';
	if (lowerLocale.startsWith('de')) return 'de';
	if (lowerLocale.startsWith('ja')) return 'ja';
	if (lowerLocale.startsWith('fr')) return 'fr';
	if (lowerLocale.startsWith('ko')) return 'ko';
	if (lowerLocale.startsWith('ar')) return 'ar';

	const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone?.toLowerCase() ?? '';
	if (
		timeZone.includes('madrid') ||
		timeZone.includes('mexico') ||
		timeZone.includes('bogota') ||
		timeZone.includes('lima')
	) {
		return 'es';
	}

	return 'all';
}

const QUICK_FILTERS = [
	{
		key: 'Profesional',
		query: 'professional',
	},
	{
		key: 'Masculino',
		query: 'male',
	},
	{
		key: 'Femenina',
		query: 'female',
	},
	{
		key: 'Neutral',
		query: 'neutral',
	},
	{
		key: 'Joven',
		query: 'young',
	},
	{
		key: 'Mediana Edad',
		query: 'middle age',
	},
	{
		key: 'Narración',
		query: 'narration',
	},
	{
		key: 'Redes Sociales',
		query: 'social media',
	},
	{
		key: 'Sensual',
		query: 'sensual',
	},
	{
		key: 'Documental',
		query: 'documentary',
	},
	{
		key: 'Profundo',
		query: 'deep',
	},
	{
		key: 'Suave',
		query: 'soft',
	},
	{
		key: 'Dramático',
		query: 'dramatic',
	},
	{
		key: 'Misterioso',
		query: 'mysterious',
	},
	{
		key: 'Anime',
		query: 'anime',
	},
];

const LANGUAGE_OPTIONS: FishLanguageOption[] = [
	{ key: 'all', label: 'Todos los idiomas', query: '' },
	{ key: 'en', label: 'English', query: 'english', countryCode: 'US' },
	{ key: 'zh', label: '汉语', query: 'chinese', countryCode: 'CN' },
	{ key: 'de', label: 'Deutsch', query: 'german', countryCode: 'DE' },
	{ key: 'ja', label: '日本語', query: 'japanese', countryCode: 'JP' },
	{ key: 'fr', label: 'Français', query: 'french', countryCode: 'FR' },
	{ key: 'es', label: 'Español', query: 'spanish', countryCode: 'ES' },
	{ key: 'ko', label: '한국어', query: 'korean', countryCode: 'KR' },
	{ key: 'ar', label: 'العربية', query: 'arabic', countryCode: 'SA' },
];

function formatFishMinutes(samples?: FishAudioModel['samples']) {
	const totalMs = samples?.reduce((sum, sample) => sum + (sample.duration_ms ?? 0), 0) ?? 0;

	if (totalMs <= 0) {
		return null;
	}

	const totalMinutes = Math.max(1, Math.round(totalMs / 60000));
	return `${totalMinutes.toLocaleString('es-ES')} minutos`;
}

function looksLikeFishVoiceId(value: string) {
	const trimmedValue = value.trim();

	if (!trimmedValue || /\s/.test(trimmedValue)) {
		return false;
	}

	return /^[a-zA-Z0-9._:-]{8,}$/.test(trimmedValue);
}

function uniqueFishModels(models: FishAudioModel[]) {
	const seen = new Set<string>();
	return models.filter((model) => {
		if (seen.has(model._id)) {
			return false;
		}

		seen.add(model._id);
		return true;
	});
}

function FishModelRow({
	model,
	isSelected,
	onPick,
}: {
	model: FishAudioModel;
	isSelected: boolean;
	onPick: (voiceId: string) => void;
}) {
	const thumbnailUrl = buildFishAudioCoverImageProxySrc(model.cover_image);
	const fallbackLabel = model.title.charAt(0).toUpperCase();
	const durationLabel = formatFishMinutes(model.samples);

	return (
		<div
			className={cn(
				'relative overflow-hidden rounded-2xl border text-left transition-transform',
				isSelected
					? 'border-emerald-500/40 ring-1 ring-emerald-500/20'
					: 'hover:-translate-y-0.5 border-border/60 bg-card hover:border-violet-500/30',
			)}
		>
			<button
				type='button'
				className='group relative block w-full text-left'
				onClick={() => onPick(model._id)}
			>
				<div className='relative aspect-[4/5] w-full overflow-hidden'>
					{thumbnailUrl ? (
						<Image
							src={thumbnailUrl}
							alt={model.title}
							fill
							sizes='(max-width: 640px) 46vw, (max-width: 1024px) 24vw, 16vw'
							className='object-cover transition-transform duration-500 group-hover:scale-105'
						/>
					) : (
						<div className='flex size-full items-center justify-center bg-gradient-to-br from-violet-500/30 via-background to-emerald-500/20'>
							<span className='font-bold text-5xl text-violet-100/90'>{fallbackLabel}</span>
						</div>
					)}

					<div className='absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent' />

					<div className='absolute right-2.5 bottom-2.5 left-2.5 space-y-0.5 text-white'>
						<p className='truncate font-semibold text-sm leading-tight'>{model.title}</p>
						<div className='flex items-center justify-between gap-2 text-white/80 text-xs'>
							<span className='truncate'>{model.author?.nickname?.trim() ?? 'Fish Audio'}</span>
							{durationLabel ? <span className='shrink-0'>{durationLabel}</span> : null}
						</div>
					</div>
				</div>
			</button>
		</div>
	);
}

export function FishVoiceDialog({
	open,
	onOpenChange,
	apiKey,
	voiceId,
	onPickVoiceId,
}: FishVoiceDialogProps) {
	const [search, setSearch] = useState('');
	const [, setManualVoiceId] = useState(voiceId);
	const [isLoading, setIsLoading] = useState(false);
	const [isAppending, setIsAppending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [models, setModels] = useState<FishAudioModel[]>([]);
	const [pageNumber, setPageNumber] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [sortBy, setSortBy] = useState<FishSortOption>('score');
	const [languageKey, setLanguageKey] = useState('all');
	const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);
	const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
	const languageMenuRef = useRef<HTMLDivElement | null>(null);
	const quickFiltersRef = useRef<HTMLDivElement | null>(null);
	const loadMoreRef = useRef<HTMLDivElement | null>(null);
	const resultsScrollRef = useRef<HTMLDivElement | null>(null);

	const getSearchQuery = useCallback(
		(query: string, quickFilterKey = activeQuickFilter, currentLanguage = languageKey) => {
			const trimmedQuery = query.trim();

			if (trimmedQuery) {
				return trimmedQuery;
			}

			const language = LANGUAGE_OPTIONS.find((option) => option.key === currentLanguage);
			const quickFilter = QUICK_FILTERS.find((filter) => filter.key === quickFilterKey);

			return [language?.query, quickFilter?.query].filter(Boolean).join(' ').trim();
		},
		[activeQuickFilter, languageKey],
	);

	const handleSearch = useCallback(
		async (
			query = '',
			nextPage = 1,
			append = false,
			sort = sortBy,
			quickFilterKey = activeQuickFilter,
			currentLanguage = languageKey,
		) => {
			if (!apiKey.trim()) {
				toast.error('Agrega tu Fish Audio Key para buscar voces');
				return;
			}

			try {
				if (append) {
					setIsAppending(true);
				} else {
					setIsLoading(true);
				}
				setError(null);
				const response = await searchFishAudioModels({
					apiKey: apiKey.trim(),
					query: getSearchQuery(query, quickFilterKey, currentLanguage),
					pageSize: 12,
					pageNumber: nextPage,
					sortBy: sort,
				});
				const nextModels = uniqueFishModels(response.items ?? []);

				if (nextModels.length === 0 && !append && looksLikeFishVoiceId(query)) {
					try {
						const exactModel = await getFishAudioModel({
							apiKey: apiKey.trim(),
							voiceId: query.trim(),
						});
						setModels(uniqueFishModels([exactModel]));
						setPageNumber(1);
						setHasMore(false);
						setError(null);
						return;
					} catch (exactLookupError) {
						console.error('No se pudo resolver el Voice ID de Fish Audio:', exactLookupError);
					}
				}

				setModels((current) => uniqueFishModels(append ? [...current, ...nextModels] : nextModels));
				setPageNumber(nextPage);
				setHasMore(Boolean(response.has_more));
				if (nextModels.length === 0) {
					setError('No encontramos voces con esa búsqueda.');
				}
			} catch (searchError) {
				console.error('Error buscando voces de Fish Audio:', searchError);
				if (!append) {
					setModels([]);
				}
				setError('No se pudieron cargar las voces de Fish Audio.');
			} finally {
				setIsLoading(false);
				setIsAppending(false);
			}
		},
		[activeQuickFilter, apiKey, getSearchQuery, languageKey, sortBy],
	);

	useEffect(() => {
		if (open) {
			setManualVoiceId(voiceId);
		}
	}, [open, voiceId]);

	useEffect(() => {
		if (!open) {
			setSearch('');
			setError(null);
			setModels([]);
			setPageNumber(1);
			setHasMore(false);
			setSortBy('score');
			setLanguageKey('all');
			setActiveQuickFilter(null);
			setIsLanguageMenuOpen(false);
			setIsLoading(false);
			setIsAppending(false);
		}
	}, [open]);

	useEffect(() => {
		if (!open || !apiKey.trim()) {
			return;
		}

		const detectedLanguageKey = detectFishLanguageKey();
		setLanguageKey(detectedLanguageKey);
		void handleSearch('', 1, false, 'score', activeQuickFilter, detectedLanguageKey);
	}, [activeQuickFilter, apiKey, handleSearch, open]);

	useEffect(() => {
		const root = resultsScrollRef.current;
		const target = loadMoreRef.current;

		if (!open || !root || !target || !hasMore || isLoading || isAppending) {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				if (!entry?.isIntersecting || isLoading || isAppending || !hasMore) {
					return;
				}

				void handleSearch(search, pageNumber + 1, true);
			},
			{
				root,
				rootMargin: '200px 0px',
				threshold: 0.1,
			},
		);

		observer.observe(target);

		return () => {
			observer.disconnect();
		};
	}, [handleSearch, hasMore, isAppending, isLoading, open, pageNumber, search]);

	useEffect(() => {
		function handleDocumentClick(event: MouseEvent) {
			if (!languageMenuRef.current) {
				return;
			}

			if (!languageMenuRef.current.contains(event.target as Node)) {
				setIsLanguageMenuOpen(false);
			}
		}

		function handleDocumentKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				setIsLanguageMenuOpen(false);
			}
		}

		document.addEventListener('mousedown', handleDocumentClick);
		document.addEventListener('keydown', handleDocumentKeyDown);

		return () => {
			document.removeEventListener('mousedown', handleDocumentClick);
			document.removeEventListener('keydown', handleDocumentKeyDown);
		};
	}, []);

	function getSearchQuery(
		query: string,
		quickFilterKey = activeQuickFilter,
		currentLanguage = languageKey,
	) {
		const trimmedQuery = query.trim();

		if (trimmedQuery) {
			return trimmedQuery;
		}

		const language = LANGUAGE_OPTIONS.find((option) => option.key === currentLanguage);
		const quickFilter = QUICK_FILTERS.find((filter) => filter.key === quickFilterKey);

		return [language?.query, quickFilter?.query].filter(Boolean).join(' ').trim();
	}

	async function handleSearch(
		query: string = search,
		nextPage = 1,
		append = false,
		sort = sortBy,
		quickFilterKey = activeQuickFilter,
		currentLanguage = languageKey,
	) {
		if (!apiKey.trim()) {
			toast.error('Agrega tu Fish Audio Key para buscar voces');
			return;
		}

		try {
			if (append) {
				setIsAppending(true);
			} else {
				setIsLoading(true);
			}
			setError(null);
			const response = await searchFishAudioModels({
				apiKey: apiKey.trim(),
				query: getSearchQuery(query, quickFilterKey, currentLanguage),
				pageSize: 12,
				pageNumber: nextPage,
				sortBy: sort,
			});
			const nextModels = response.items ?? [];
			setModels((current) => (append ? [...current, ...nextModels] : nextModels));
			setPageNumber(nextPage);
			setHasMore(Boolean(response.has_more));
			if (nextModels.length === 0) {
				setError('No encontramos voces con esa búsqueda.');
			}
		} catch (searchError) {
			console.error('Error buscando voces de Fish Audio:', searchError);
			if (!append) {
				setModels([]);
			}
			setError('No se pudieron cargar las voces de Fish Audio.');
		} finally {
			setIsLoading(false);
			setIsAppending(false);
		}
	}

	const scrollQuickFilters = (direction: 'left' | 'right') => {
		const container = quickFiltersRef.current;
		if (!container) {
			return;
		}

		container.scrollBy({
			left: direction === 'left' ? -320 : 320,
			behavior: 'smooth',
		});
	};

	const selectedLanguage =
		LANGUAGE_OPTIONS.find((option) => option.key === languageKey) ?? LANGUAGE_OPTIONS[0];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='flex max-h-[88vh] w-[min(92vw,56rem)] flex-col overflow-hidden'>
				<DialogHeader className='px-6 pt-6'>
					<DialogTitle>Buscar voces de Fish Audio</DialogTitle>
					<DialogDescription>
						Busca una voz por nombre o pega un Voice ID directo para usarlo en el campo de síntesis.
					</DialogDescription>
				</DialogHeader>

				<div className='flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-6 sm:px-6'>
					<div className='space-y-3 rounded-[28px] border border-border/60 bg-gradient-to-b from-background/95 to-background/70 p-3 shadow-sm sm:p-4'>
						<div className='grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto_auto]'>
							<div className='relative'>
								<Search className='-translate-y-1/2 pointer-events-none absolute top-1/2 left-4 size-4 text-muted-foreground' />
								<Input
									placeholder='Buscar voces'
									value={search}
									onChange={(event) => setSearch(event.target.value)}
									onKeyDown={(event) => {
										if (event.key === 'Enter') {
											event.preventDefault();
											void handleSearch(search, 1, false, sortBy, activeQuickFilter, languageKey);
										}
									}}
									className='h-12 rounded-full border-border/70 bg-background/80 pr-4 pl-11 text-[15px] shadow-sm'
								/>
							</div>

							<Button
								type='button'
								variant='outline'
								className='h-12 w-12 rounded-full border-border/70 bg-background/80 shadow-sm'
								onClick={() => void handleSearch(search, 1, false, sortBy, activeQuickFilter, languageKey)}
								disabled={isLoading}
								aria-label='Buscar voces'
							>
								<Search className='size-4' />
							</Button>

							<div className='relative'>
								<Button
									type='button'
									variant='outline'
									className='h-12 gap-2 rounded-full border-border/70 bg-background/80 px-4 text-sm shadow-sm'
									onClick={() => setIsLanguageMenuOpen((current) => !current)}
								>
									{selectedLanguage.countryCode ? (
										<CountryFlag
											countryCode={selectedLanguage.countryCode}
											svg
											style={{ width: '1.1em', height: '1.1em' }}
											title={selectedLanguage.label}
										/>
									) : (
										<span className='text-base leading-none'>🌐</span>
									)}
									<span>{selectedLanguage.label}</span>
									<ChevronDown className='size-4 opacity-70' />
								</Button>

								{isLanguageMenuOpen ? (
									<div className='absolute top-full right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-border/70 bg-background shadow-xl'>
										<div className='px-4 py-3 text-muted-foreground text-xs'>Idioma</div>
										<div className='max-h-72 overflow-y-auto py-1'>
											{LANGUAGE_OPTIONS.map((option) => {
												const isActive = languageKey === option.key;

												return (
													<button
														key={option.key}
														type='button'
														className={cn(
															'flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-orange-50 dark:hover:bg-orange-500/10',
															isActive &&
																'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300',
														)}
														onClick={() => {
															setLanguageKey(option.key);
															setIsLanguageMenuOpen(false);
															void handleSearch(
																search,
																1,
																false,
																sortBy,
																activeQuickFilter,
																option.key,
															);
														}}
													>
														{option.countryCode ? (
															<CountryFlag
																countryCode={option.countryCode}
																svg
																style={{ width: '1.1em', height: '1.1em' }}
																title={option.label}
															/>
														) : (
															<span className='text-base leading-none'>🌐</span>
														)}
														<span>{option.label}</span>
														{isActive ? <Check className='ml-auto size-4' /> : null}
													</button>
												);
											})}
										</div>
									</div>
								) : null}
							</div>
						</div>

						<div className='flex items-center gap-2'>
							<Button
								type='button'
								variant='outline'
								size='icon'
								className='hidden size-8 shrink-0 rounded-full border-border/70 bg-background/90 shadow-sm sm:inline-flex'
								onClick={() => scrollQuickFilters('left')}
								aria-label='Ver categorías anteriores'
							>
								<ChevronLeft className='size-4' />
							</Button>

							<div
								ref={quickFiltersRef}
								className='flex min-w-0 flex-1 flex-nowrap gap-2 overflow-x-auto py-1 [scroll-behavior:smooth] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
							>
								{QUICK_FILTERS.map((filter) => {
									const isActive = activeQuickFilter === filter.key;

									return (
										<Button
											key={filter.key}
											type='button'
											variant='outline'
											className={cn(
												'h-10 shrink-0 rounded-full border-border/70 px-4 text-sm shadow-sm transition-colors',
												isActive
													? 'border-orange-400 bg-orange-50 text-orange-600 dark:border-orange-400/40 dark:bg-orange-500/10 dark:text-orange-300'
													: 'bg-background/80 text-muted-foreground hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-500/10',
											)}
											onClick={() => {
												const nextValue = activeQuickFilter === filter.key ? null : filter.key;
												setActiveQuickFilter(nextValue);
												void handleSearch(search, 1, false, sortBy, nextValue, languageKey);
											}}
										>
											{filter.key}
										</Button>
									);
								})}
							</div>

							<Button
								type='button'
								variant='outline'
								size='icon'
								className='hidden size-8 shrink-0 rounded-full border-border/70 bg-background/90 shadow-sm sm:inline-flex'
								onClick={() => scrollQuickFilters('right')}
								aria-label='Ver más categorías'
							>
								<ChevronRight className='size-4' />
							</Button>
						</div>

						{!apiKey.trim() ? (
							<div className='rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-amber-700 text-sm dark:text-amber-300'>
								Primero agrega tu Fish Audio Key para poder buscar voces desde Fish Audio.
							</div>
						) : null}
					</div>

					{error ? (
						<div className='rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive text-sm'>
							{error}
						</div>
					) : null}

					<div ref={resultsScrollRef} className='min-h-0 flex-1 overflow-y-auto pr-1'>
						{isLoading && models.length === 0 ? (
							<div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6'>
								{Array.from({ length: 5 }).map((_, index) => (
									<div
										key={`fish-voice-skeleton-${index}`}
										className='overflow-hidden rounded-2xl border border-border/60 bg-card'
									>
										<div className='relative aspect-[4/5] overflow-hidden p-2.5'>
											<Skeleton className='size-full rounded-xl' />
											<div className='absolute inset-x-0 bottom-0 space-y-2 p-4'>
												<Skeleton className='h-3 w-16 rounded-full' />
												<Skeleton className='h-4 w-4/5 rounded-full' />
												<Skeleton className='h-3 w-1/2 rounded-full' />
											</div>
										</div>
									</div>
								))}
							</div>
						) : models.length > 0 ? (
							<div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6'>
								{models.map((model) => (
									<FishModelRow
										key={model._id}
										model={model}
										isSelected={voiceId === model._id}
										onPick={(pickedVoiceId) => {
											onPickVoiceId(pickedVoiceId);
											onOpenChange(false);
										}}
									/>
								))}
								{hasMore ? (
									<div ref={loadMoreRef} className='col-span-full flex justify-center py-2'>
										<Button
											type='button'
											variant='outline'
											className='rounded-full border-border/70 bg-background/80 px-4 text-xs shadow-sm'
											onClick={() => void handleSearch(search, pageNumber + 1, true)}
											disabled={isLoading || isAppending}
										>
											{isAppending ? 'Cargando...' : 'Cargar más voces'}
										</Button>
									</div>
								) : null}
							</div>
						) : isAppending ? (
							<div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6'>
								{Array.from({ length: 6 }).map((_, index) => (
									<div
										key={`fish-voice-append-skeleton-${index}`}
										className='overflow-hidden rounded-2xl border border-border/60 bg-card'
									>
										<div className='relative aspect-[4/5] overflow-hidden p-2.5'>
											<Skeleton className='size-full rounded-xl' />
											<div className='absolute inset-x-0 bottom-0 space-y-2 p-4'>
												<Skeleton className='h-3 w-16 rounded-full' />
												<Skeleton className='h-4 w-4/5 rounded-full' />
												<Skeleton className='h-3 w-1/2 rounded-full' />
											</div>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className='flex min-h-44 items-center justify-center rounded-2xl border border-border/60 border-dashed px-4 text-muted-foreground text-sm'>
								Busca una voz o pega un Voice ID para comenzar.
							</div>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
