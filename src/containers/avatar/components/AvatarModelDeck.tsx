'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useModelPreviews } from '@/hooks/useModelPreviews';
import type { VTSModel, VTSModelInfo } from '@/hooks/useVTubeStudio';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useState } from 'react';
import {
	FiBox,
	FiCheck,
	FiChevronDown,
	FiChevronUp,
	FiFolder,
	FiImage,
	FiUser,
} from 'react-icons/fi';

type AvatarModelDeckProps = {
	connected: boolean;
	models: VTSModel[];
	currentModel: VTSModelInfo | null;
	currentModelId: string | null;
	modelsFolderPath?: string | null;
	onLoadModel: (modelID: string) => void;
};

export function AvatarModelDeck({
	connected,
	models,
	currentModel,
	currentModelId,
	modelsFolderPath,
	onLoadModel,
}: AvatarModelDeckProps) {
	const { status, urls, requestAccess } = useModelPreviews(models);
	const [failedIds, setFailedIds] = useState<Set<string>>(() => new Set());
	const [showTechDetails, setShowTechDetails] = useState(false);

	return (
		<Card className='rounded-xl border-border/60 bg-card'>
			<CardHeader className='pb-3'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-3'>
						<div className='rounded-lg bg-primary/10 p-2 text-primary'>
							<FiBox className='size-5' />
						</div>
						<div>
							<CardTitle className='font-display font-semibold text-base text-foreground'>
								Modelo Live2D
							</CardTitle>
							<CardDescription className='font-sans text-muted-foreground text-xs'>
								{connected
									? currentModel
										? `Activo: ${currentModel.modelName}`
										: 'Selecciona un modelo para cargar'
									: 'Biblioteca de modelos instalados en VTube Studio'}
							</CardDescription>
						</div>
					</div>

					{connected && (
						<div className='flex items-center gap-1.5'>
							{models.length > 0 && status !== 'unsupported' && (
								<Button
									variant='ghost'
									size='sm'
									className='h-7 gap-1 px-2 font-sans text-xs'
									onClick={() => void requestAccess()}
								>
									<FiFolder size={12} />
									<span className='hidden sm:inline'>
										{status === 'idle' ? 'Cargar previews' : 'Cambiar carpeta'}
									</span>
								</Button>
							)}
						</div>
					)}
				</div>
			</CardHeader>

			<CardContent className='space-y-4'>
				{!connected ? (
					<div className='flex flex-col items-center justify-center rounded-xl border border-border/60 border-dashed bg-background/30 p-8 text-center'>
						<div className='mb-3 flex size-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground'>
							<FiUser size={18} />
						</div>
						<h4 className='font-display font-medium text-foreground text-sm'>
							Biblioteca en espera de conexión
						</h4>
						<p className='mt-1 max-w-sm text-muted-foreground text-xs leading-relaxed'>
							Conecta VTube Studio para sincronizar tu modelo actual y acceder a la galería de
							avatares disponibles.
						</p>
					</div>
				) : (
					<>
						{/* Banner de Modelo Activo */}
						{currentModel ? (
							<div className='rounded-xl border border-primary/30 bg-primary/5 p-3.5'>
								<div className='flex items-start justify-between gap-3'>
									<div className='min-w-0 flex-1'>
										<div className='flex items-center gap-2'>
											<span className='size-2 rounded-full bg-emerald-400' />
											<h4 className='truncate font-display font-semibold text-foreground text-sm'>
												{currentModel.modelName}
											</h4>
											<Badge
												variant='outline'
												className='border-emerald-500/30 bg-emerald-500/10 font-mono text-[9px] text-emerald-400'
											>
												Activo
											</Badge>
										</div>
										<p className='mt-0.5 truncate font-mono text-[11px] text-muted-foreground'>
											ID: {currentModel.modelID}
										</p>
									</div>

									<Button
										variant='ghost'
										size='sm'
										onClick={() => setShowTechDetails(!showTechDetails)}
										className='h-7 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground'
									>
										<span>Info técnica</span>
										{showTechDetails ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
									</Button>
								</div>

								{/* Ficha técnica desplegable */}
								{showTechDetails && (
									<div className='fade-in mt-3 grid grid-cols-2 gap-2 border-border/40 border-t pt-3 font-mono text-[11px] sm:grid-cols-4'>
										<div className='rounded-lg bg-background/50 p-2'>
											<div className='text-muted-foreground'>Física</div>
											<div className='font-medium text-foreground'>
												{currentModel.hasPhysicsFile ? 'Sí (.physics3)' : 'No'}
											</div>
										</div>
										<div className='rounded-lg bg-background/50 p-2'>
											<div className='text-muted-foreground'>Texturas</div>
											<div className='font-medium text-foreground'>
												{currentModel.numberOfTextures}
											</div>
										</div>
										<div className='rounded-lg bg-background/50 p-2'>
											<div className='text-muted-foreground'>Parámetros</div>
											<div className='font-medium text-foreground'>
												{currentModel.numberOfLive2DParameters}
											</div>
										</div>
										<div className='rounded-lg bg-background/50 p-2'>
											<div className='text-muted-foreground'>ArtMeshes</div>
											<div className='font-medium text-foreground'>
												{currentModel.numberOfLive2DArtmeshes}
											</div>
										</div>
									</div>
								)}
							</div>
						) : (
							<div className='flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs'>
								<span className='size-2 shrink-0 rounded-full bg-amber-400' />
								<span className='text-amber-200'>
									No hay ningún modelo activo cargado en VTube Studio. Selecciona uno abajo.
								</span>
							</div>
						)}

						{/* Grilla de Modelos Disponibles */}
						<div className='space-y-2'>
							<div className='flex items-center justify-between text-xs'>
								<span className='font-medium text-muted-foreground'>
									Modelos disponibles ({models.length})
								</span>
							</div>

							{models.length === 0 ? (
								<p className='rounded-lg border border-border/40 bg-background/30 py-6 text-center text-muted-foreground text-xs'>
									No se encontraron modelos. Abre o añade carpetas de modelos en VTube Studio.
								</p>
							) : (
								<div className='grid max-h-60 grid-cols-2 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-3'>
									{models.map((model) => {
										const isLoaded = currentModelId === model.modelID || model.modelLoaded;
										const previewUrl = failedIds.has(model.modelID)
											? null
											: (urls[model.modelID] ?? null);

										return (
											<button
												key={model.modelID}
												type='button'
												onClick={() => {
													void onLoadModel(model.modelID);
												}}
												disabled={isLoaded}
												className={cn(
													'group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all',
													isLoaded
														? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40'
														: 'border-border/60 bg-card hover:border-primary/40 hover:bg-muted/40',
												)}
											>
												<div className='relative aspect-[4/3] w-full overflow-hidden bg-muted/30'>
													{previewUrl ? (
														<Image
															src={previewUrl}
															alt={model.modelName}
															fill
															unoptimized
															sizes='(max-width: 640px) 45vw, 180px'
															className='object-contain transition-transform duration-300 group-hover:scale-105'
															onError={() => {
																setFailedIds((prev) => new Set(prev).add(model.modelID));
															}}
														/>
													) : (
														<div className='flex size-full items-center justify-center bg-gradient-to-br from-primary/10 via-background to-card'>
															<span className='font-bold font-display text-2xl text-muted-foreground/30'>
																{model.modelName.charAt(0).toUpperCase()}
															</span>
														</div>
													)}
													{isLoaded && (
														<Badge
															variant='outline'
															className='absolute top-1.5 right-1.5 border-emerald-500/40 bg-background/90 px-1.5 py-0 font-mono text-[9px] text-emerald-400'
														>
															<FiCheck size={10} className='mr-0.5' /> En escena
														</Badge>
													)}
												</div>

												<div className='p-2'>
													<p className='truncate font-medium text-foreground text-xs'>
														{model.modelName}
													</p>
													<p className='truncate font-mono text-[10px] text-muted-foreground'>
														{model.vtsModelName || model.modelID}
													</p>
												</div>
											</button>
										);
									})}
								</div>
							)}

							{models.length > 0 && status === 'idle' && (
								<p className='flex items-center gap-1.5 text-[11px] text-muted-foreground'>
									<FiImage size={12} className='shrink-0 text-primary' />
									<span>
										{modelsFolderPath
											? `Carpeta detectada: ${modelsFolderPath}. Conéctala para ver miniaturas locales.`
											: 'Conecta la carpeta de modelos de VTS para ver miniaturas locales.'}
									</span>
								</p>
							)}
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
