import { SettingsDropdownField } from '@/components/Settings/SettingsDropdownField';
import {
	formatOpenRouterContext,
	formatOpenRouterPrice,
	getOpenRouterModelUrl,
	getOpenRouterTokenCost,
	openRouterSortOptions,
} from '@/components/Settings/settings.constants';
import type { OpenRouterModel, OpenRouterSort } from '@/components/Settings/settings.types';
import { Badge } from '@/components/ui/badge';
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
import { ExternalLink } from 'lucide-react';
import type { UIEvent } from 'react';
import { SettingsModelIcon } from '@/components/Settings/SettingsModelIcon';

type OpenRouterModelDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	search: string;
	setSearch: (value: string) => void;
	sort: OpenRouterSort;
	setSort: (value: OpenRouterSort) => void;
	isSortOpen: boolean;
	setIsSortOpen: (open: boolean) => void;
	loadModels: (query: string, sort?: OpenRouterSort) => Promise<void>;
	isLoading: boolean;
	error: string | null;
	models: OpenRouterModel[];
	visibleModels: OpenRouterModel[];
	visibleCount: number;
	onScroll: (event: UIEvent<HTMLDivElement>) => void;
	onPickModel: (model: OpenRouterModel) => void;
};

export function OpenRouterModelDialog({
	open,
	onOpenChange,
	search,
	setSearch,
	sort,
	setSort,
	isSortOpen,
	setIsSortOpen,
	loadModels,
	isLoading,
	error,
	models,
	visibleModels,
	visibleCount,
	onScroll,
	onPickModel,
}: OpenRouterModelDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-h-[88vh] overflow-hidden'>
				<DialogHeader className='px-6 pt-6'>
					<DialogTitle>Buscar modelo de OpenRouter</DialogTitle>
					<DialogDescription>
						Solo se muestran modelos de texto. Busca por nombre o slug y elige el que quieras usar.
					</DialogDescription>
				</DialogHeader>
				<div className='space-y-4 px-6'>
					<div className='grid items-end gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,220px)_auto]'>
						<Input
							placeholder='Buscar por nombre o slug'
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === 'Enter') {
									event.preventDefault();
									void loadModels(search, sort);
								}
							}}
						/>
						<SettingsDropdownField
							label='Orden'
							placeholder='Ordenar modelos'
							value={sort}
							options={openRouterSortOptions}
							open={isSortOpen}
							setOpen={setIsSortOpen}
							onChange={(value) => {
								const nextSort = value as OpenRouterSort;
								setSort(nextSort);
								if (open) {
									void loadModels(search, nextSort);
								}
							}}
							hideLabel
						/>
						<Button
							type='button'
							onClick={() => void loadModels(search, sort)}
							disabled={isLoading}
							className='text-foreground'
						>
							{isLoading ? 'Buscando...' : 'Buscar'}
						</Button>
					</div>

					{error ? (
						<div className='rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive text-sm'>
							{error}
						</div>
					) : null}

					<div className='max-h-[52vh] overflow-y-auto pr-1' onScroll={onScroll}>
						{isLoading ? (
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
						) : models.length > 0 ? (
							<div className='grid gap-3'>
								{visibleModels.map((model) => {
									const pricing = getOpenRouterTokenCost(model);
									const totalCost = pricing.prompt + pricing.completion + pricing.request;
									const modelUrl = getOpenRouterModelUrl(model.id);

									return (
										<div
											key={model.id}
											className={[
												'relative flex w-full flex-col gap-2 rounded-2xl border p-4 text-left transition-all',
												'border-border/60 bg-card hover:bg-violet-500/5 dark:hover:bg-violet-500/10',
											].join(' ')}
										>
											<Button
												type='button'
												variant='ghost'
												onClick={() => onPickModel(model)}
												className='h-auto w-full justify-start p-0 text-left hover:bg-transparent'
											>
												<div className='flex w-full flex-col gap-2 pr-32'>
													<div className='flex items-center gap-2'>
														<SettingsModelIcon modelId={model.id} />
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
								})}
								{visibleCount < models.length ? (
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
	);
}
