import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type VTSModel } from '@/hooks/useVTubeStudio';
import { FiGrid } from 'react-icons/fi';

type AvatarModelListCardProps = {
	connected: boolean;
	models: VTSModel[];
	currentModelId: string | null;
	onLoadModel: (modelID: string) => void;
};

export function AvatarModelListCard({
	connected,
	models,
	currentModelId,
	onLoadModel,
}: AvatarModelListCardProps) {
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
				<CardDescription>
					{models.length > 0
						? `${models.length} modelo${models.length !== 1 ? 's' : ''} encontrado${models.length !== 1 ? 's' : ''} en VTube Studio`
						: 'No se encontraron modelos'}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{models.length === 0 ? (
					<p className='py-4 text-center text-muted-foreground text-xs'>
						No hay modelos disponibles. Cargá uno en VTube Studio primero.
					</p>
				) : (
					<div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
						{models.map((model) => {
							const isLoaded = currentModelId === model.modelID;

							return (
								<button
									key={model.modelID}
									type='button'
									onClick={() => {
										void onLoadModel(model.modelID);
									}}
									disabled={isLoaded}
									className={`flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-all ${
										isLoaded
											? 'border-primary/50 bg-primary/5'
											: 'border-border hover:border-primary/30 hover:bg-muted/50'
									}`}
								>
									<div
										className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-xs ${
											isLoaded
												? 'bg-primary text-primary-foreground'
												: 'bg-muted-foreground/10 text-muted-foreground'
										}`}
									>
										{model.modelName.charAt(0).toUpperCase()}
									</div>
									<div className='min-w-0 flex-1'>
										<p className='truncate font-medium text-xs'>{model.modelName}</p>
										<p className='truncate text-[10px] text-muted-foreground'>
											{model.vtsModelName || model.modelID}
										</p>
									</div>
									{isLoaded && (
										<Badge
											variant='outline'
											className='shrink-0 border-primary/30 px-1.5 py-0 text-[10px]'
										>
											Activo
										</Badge>
									)}
								</button>
							);
						})}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
