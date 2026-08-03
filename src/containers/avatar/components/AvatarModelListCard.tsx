'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useModelPreviews } from '@/hooks/useModelPreviews';
import type { VTSModel } from '@/hooks/useVTubeStudio';
import { useState } from 'react';
import { FiFolder, FiGrid, FiImage } from 'react-icons/fi';

type AvatarModelListCardProps = {
	connected: boolean;
	models: VTSModel[];
	currentModelId: string | null;
	modelsFolderPath?: string | null;
	onLoadModel: (modelID: string) => void;
};

export function AvatarModelListCard({
	connected,
	models,
	currentModelId,
	modelsFolderPath,
	onLoadModel,
}: AvatarModelListCardProps) {
	const { status, urls, requestAccess } = useModelPreviews(models);
	const [failedIds, setFailedIds] = useState<Set<string>>(() => new Set());

	if (!connected) {
		return null;
	}

	return (
		<Card className='border-border/50 bg-card/50 backdrop-blur-sm'>
			<CardHeader>
				<CardTitle className='flex items-center gap-2 text-lg'>
					<FiGrid size={18} className='text-chart-1' />
					Modelos disponibles
				</CardTitle>
				<CardDescription className='flex flex-wrap items-center justify-between gap-2'>
					<span>
						{models.length > 0
							? `${models.length} modelo${models.length !== 1 ? 's' : ''} encontrado${models.length !== 1 ? 's' : ''} en VTube Studio`
							: 'No se encontraron modelos'}
					</span>
					{models.length > 0 && status !== 'unsupported' && (
						<Button
							variant='ghost'
							size='sm'
							className='gap-1.5'
							onClick={() => {
								void requestAccess();
							}}
						>
							<FiFolder size={13} />
							{status === 'idle' ? 'Cargar previews' : 'Cambiar carpeta'}
						</Button>
					)}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{models.length === 0 ? (
					<p className='py-4 text-center text-muted-foreground text-xs'>
						No hay modelos disponibles. Cargá uno en VTube Studio primero.
					</p>
				) : (
					<div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
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
									className={`group relative overflow-hidden rounded-xl border text-left transition-all ${
										isLoaded
											? 'border-primary/60 bg-primary/5 ring-1 ring-primary/30'
											: 'hover:-translate-y-0.5 border-border hover:border-primary/40 hover:bg-muted/50 hover:shadow-lg'
									}`}
								>
									<div className='relative aspect-[4/3] w-full overflow-hidden bg-muted/40'>
										{previewUrl ? (
											// biome-ignore lint/nursery/noImgElement: model previews are local object URLs
											<img
												src={previewUrl}
												alt={model.modelName}
												className='h-full w-full object-contain transition-transform duration-300 group-hover:scale-105'
												onError={() => {
													setFailedIds((prev) => new Set(prev).add(model.modelID));
												}}
											/>
										) : (
											<div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-chart-2/10 to-chart-4/10'>
												<span className='font-bold text-3xl text-muted-foreground/40'>
													{model.modelName.charAt(0).toUpperCase()}
												</span>
											</div>
										)}
										{isLoaded && (
											<Badge
												variant='outline'
												className='absolute top-2 right-2 border-primary/30 bg-background/90 px-1.5 py-0 text-[10px]'
											>
												Activo
											</Badge>
										)}
									</div>
									<div className='space-y-0.5 p-2.5'>
										<p className='truncate font-medium text-xs'>{model.modelName}</p>
										<p className='truncate text-[10px] text-muted-foreground'>
											{model.vtsModelName || model.modelID}
										</p>
									</div>
								</button>
							);
						})}
					</div>
				)}

				{models.length > 0 && status === 'idle' && (
					<p className='mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground'>
						<FiImage size={12} className='shrink-0' />
						{modelsFolderPath
							? `Conectá la carpeta de modelos (${modelsFolderPath}) una sola vez y quedará recordada. Se usa solo en tu navegador, no se sube nada.`
							: 'Conectá la carpeta de modelos de VTube Studio una sola vez y quedará recordada. Se usa solo en tu navegador, no se sube nada.'}
					</p>
				)}
				{models.length > 0 && status === 'unsupported' && (
					<p className='mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground'>
						<FiImage size={12} className='shrink-0' />
						Tu navegador no soporta previews locales. Usá Chrome o Edge para verlos.
					</p>
				)}
			</CardContent>
		</Card>
	);
}
