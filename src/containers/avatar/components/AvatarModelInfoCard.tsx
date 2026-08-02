import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { type VTSModelInfo } from '@/hooks/useVTubeStudio';
import { FiUser } from 'react-icons/fi';

type AvatarModelInfoCardProps = {
	currentModel: VTSModelInfo | null;
};

export function AvatarModelInfoCard({ currentModel }: AvatarModelInfoCardProps) {
	return (
		<Card className='border-border/50 bg-card/50 backdrop-blur-sm'>
			<CardHeader>
				<CardTitle className='flex items-center gap-2 text-lg'>
					<FiUser size={18} className='text-chart-1' />
					Modelo activo
				</CardTitle>
				<CardDescription>{currentModel ? currentModel.modelName : 'Ninguno'}</CardDescription>
			</CardHeader>
			<CardContent>
				{currentModel ? (
					<div className='space-y-3'>
						<div className='space-y-2'>
							<div className='flex justify-between'>
								<span className='text-muted-foreground text-xs'>Nombre</span>
								<span className='font-medium text-foreground text-xs'>{currentModel.modelName}</span>
							</div>
							<div className='flex justify-between'>
								<span className='text-muted-foreground text-xs'>ID</span>
								<span className='max-w-[180px] truncate font-medium text-foreground text-xs'>
									{currentModel.modelID}
								</span>
							</div>
							<div className='flex justify-between'>
								<span className='text-muted-foreground text-xs'>Motorphysics</span>
								<span className='font-medium text-foreground text-xs'>
									{currentModel.hasPhysicsFile ? 'Sí' : 'No'}
								</span>
							</div>
							<div className='flex justify-between'>
								<span className='text-muted-foreground text-xs'>Texturas</span>
								<span className='font-medium text-foreground text-xs'>
									{currentModel.numberOfTextures}
								</span>
							</div>
							<div className='flex justify-between'>
								<span className='text-muted-foreground text-xs'>Parámetros</span>
								<span className='font-medium text-foreground text-xs'>
									{currentModel.numberOfLive2DParameters}
								</span>
							</div>
							<div className='flex justify-between'>
								<span className='text-muted-foreground text-xs'>ArtMeshes</span>
								<span className='font-medium text-foreground text-xs'>
									{currentModel.numberOfLive2DArtmeshes}
								</span>
							</div>
							<Separator className='my-1' />
							<div className='flex justify-between'>
								<span className='text-muted-foreground text-xs'>Posición X</span>
								<span className='font-medium text-foreground text-xs'>
									{currentModel.modelPosition.positionX.toFixed(3)}
								</span>
							</div>
							<div className='flex justify-between'>
								<span className='text-muted-foreground text-xs'>Posición Y</span>
								<span className='font-medium text-foreground text-xs'>
									{currentModel.modelPosition.positionY.toFixed(3)}
								</span>
							</div>
							<div className='flex justify-between'>
								<span className='text-muted-foreground text-xs'>Rotación</span>
								<span className='font-medium text-foreground text-xs'>
									{currentModel.modelPosition.rotation.toFixed(1)}°
								</span>
							</div>
							<div className='flex justify-between'>
								<span className='text-muted-foreground text-xs'>Escala</span>
								<span className='font-medium text-foreground text-xs'>
									{currentModel.modelPosition.size.toFixed(3)}
								</span>
							</div>
						</div>
					</div>
				) : (
					<div className='flex flex-col items-center gap-3 py-8 text-center'>
						<div className='flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
							<FiUser size={20} className='text-muted-foreground' />
						</div>
						<p className='text-muted-foreground text-xs leading-relaxed'>
							No hay ningún modelo activo.
							<br />
							Conectate a VTube Studio y seleccioná un modelo.
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
