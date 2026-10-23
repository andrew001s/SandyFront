'use client';

import { Button } from '@/components/ui/button';
import { vrmManager } from '@/lib/avatar/vrmManager';
import type { VrmModelMeta } from '@/lib/avatar/vrmStorage';
import { Box, Trash2, Upload, User, X } from 'lucide-react';

interface Props {
	modelMeta: VrmModelMeta | null;
	onUploadClick: () => void;
	onClose: () => void;
}

export function VrmStudioModelPanel({ modelMeta, onUploadClick, onClose }: Props) {
	return (
		<div className='flex w-76 max-w-[calc(100vw-3rem)] flex-col gap-3 rounded-2xl border border-border/80 bg-background/90 p-3.5 shadow-2xl backdrop-blur-xl sm:w-80'>
			{/* Encabezado */}
			<div className='flex items-center justify-between border-border/60 border-b pb-2.5'>
				<div className='flex items-center gap-2'>
					<div className='rounded-lg bg-primary/20 p-1.5 text-primary'>
						<Box className='size-4' />
					</div>
					<div>
						<h3 className='font-bold font-display text-foreground text-sm tracking-tight'>
							Avatar 3D (VRM)
						</h3>
						<p className='text-[10px] text-muted-foreground'>Gestión de modelo en navegador</p>
					</div>
				</div>

				<Button
					variant='ghost'
					size='icon'
					onClick={onClose}
					className='size-7 text-muted-foreground hover:bg-muted hover:text-foreground'
				>
					<X className='size-3.5' />
				</Button>
			</div>

			{/* Info del Modelo */}
			{modelMeta ? (
				<div className='space-y-3 rounded-xl border border-border/60 bg-card/40 p-3'>
					<div className='flex items-start gap-2.5'>
						<div className='rounded-xl bg-secondary/15 p-2 text-secondary'>
							<User className='size-6' />
						</div>
						<div className='min-w-0 flex-1'>
							<h4 className='truncate font-bold font-sans text-foreground text-xs'>
								{modelMeta.name}
							</h4>
							<p className='font-mono text-[10px] text-muted-foreground'>
								{(modelMeta.size / (1024 * 1024)).toFixed(2)} MB · VRM 3D
							</p>
							<div className='mt-1 flex items-center gap-1 text-[10px] text-emerald-400'>
								<span className='size-1.5 rounded-full bg-emerald-400' />
								<span>Cargado en memoria e IndexedDB</span>
							</div>
						</div>
					</div>

					<div className='flex items-center gap-2 border-border/60 border-t pt-2'>
						<Button
							variant='secondary'
							size='sm'
							onClick={onUploadClick}
							className='h-8 flex-1 gap-1.5 text-xs'
						>
							<Upload className='size-3.5' /> Cambiar VRM
						</Button>

						<Button
							variant='ghost'
							size='icon'
							onClick={() => void vrmManager.removeModel()}
							className='size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
							title='Eliminar avatar'
						>
							<Trash2 className='size-3.5' />
						</Button>
					</div>
				</div>
			) : (
				<div className='space-y-3 rounded-xl border border-border/60 bg-card/40 p-4 text-center'>
					<div className='mx-auto flex size-10 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground'>
						<Box className='size-5' />
					</div>
					<div className='space-y-1'>
						<p className='font-medium text-foreground text-xs'>Sin avatar cargado</p>
						<p className='text-[10px] text-muted-foreground'>
							Arrastra tu archivo .vrm aquí o presiona el botón
						</p>
					</div>
					<Button
						variant='secondary'
						size='sm'
						onClick={onUploadClick}
						className='h-8 w-full gap-1.5 text-xs'
					>
						<Upload className='size-3.5' /> Cargar archivo .VRM
					</Button>
				</div>
			)}
		</div>
	);
}
