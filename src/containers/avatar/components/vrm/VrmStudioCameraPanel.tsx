'use client';

import { Button } from '@/components/ui/button';
import type { VrmCameraPreset } from '@/lib/avatar/vrmViewer';
import { Camera, Focus, RotateCcw, User, UserCheck, X } from 'lucide-react';

interface Props {
	currentPreset: VrmCameraPreset;
	onSelectPreset: (preset: VrmCameraPreset) => void;
	onClose: () => void;
}

export function VrmStudioCameraPanel({ currentPreset, onSelectPreset, onClose }: Props) {
	return (
		<div className='flex w-76 max-w-[calc(100vw-3rem)] flex-col gap-3 rounded-2xl border border-border/80 bg-background/90 p-3.5 shadow-2xl backdrop-blur-xl sm:w-80'>
			{/* Encabezado */}
			<div className='flex items-center justify-between border-border/60 border-b pb-2.5'>
				<div className='flex items-center gap-2'>
					<div className='rounded-lg bg-secondary/20 p-1.5 text-secondary'>
						<Camera className='size-4' />
					</div>
					<div>
						<h3 className='font-bold font-display text-foreground text-sm tracking-tight'>
							Cámara y Encuadre
						</h3>
						<p className='text-[10px] text-muted-foreground'>Presets de ángulo y control 3D</p>
					</div>
				</div>

				<div className='flex items-center gap-1'>
					<Button
						variant='ghost'
						size='icon'
						onClick={() => onSelectPreset(currentPreset)}
						className='size-7 text-muted-foreground hover:bg-muted hover:text-foreground'
						title='Centrar cámara'
					>
						<RotateCcw className='size-3.5' />
					</Button>
					<Button
						variant='ghost'
						size='icon'
						onClick={onClose}
						className='size-7 text-muted-foreground hover:bg-muted hover:text-foreground'
					>
						<X className='size-3.5' />
					</Button>
				</div>
			</div>

			{/* Presets de cámara */}
			<div className='grid grid-cols-3 gap-1.5'>
				<button
					type='button'
					onClick={() => onSelectPreset('face')}
					className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition-all ${
						currentPreset === 'face'
							? 'border-secondary/60 bg-secondary/15 text-secondary shadow-xs ring-1 ring-secondary/40'
							: 'border-border/60 bg-card/40 text-muted-foreground hover:border-secondary/40 hover:text-foreground'
					}`}
				>
					<Focus className='size-5' />
					<span className='font-sans font-semibold text-xs'>Rostro</span>
					<span className='text-[9px] text-muted-foreground'>Primer plano</span>
				</button>

				<button
					type='button'
					onClick={() => onSelectPreset('upperBody')}
					className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition-all ${
						currentPreset === 'upperBody'
							? 'border-secondary/60 bg-secondary/15 text-secondary shadow-xs ring-1 ring-secondary/40'
							: 'border-border/60 bg-card/40 text-muted-foreground hover:border-secondary/40 hover:text-foreground'
					}`}
				>
					<UserCheck className='size-5' />
					<span className='font-sans font-semibold text-xs'>Busto</span>
					<span className='text-[9px] text-muted-foreground'>Streaming</span>
				</button>

				<button
					type='button'
					onClick={() => onSelectPreset('fullBody')}
					className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition-all ${
						currentPreset === 'fullBody'
							? 'border-secondary/60 bg-secondary/15 text-secondary shadow-xs ring-1 ring-secondary/40'
							: 'border-border/60 bg-card/40 text-muted-foreground hover:border-secondary/40 hover:text-foreground'
					}`}
				>
					<User className='size-5' />
					<span className='font-sans font-semibold text-xs'>Entero</span>
					<span className='text-[9px] text-muted-foreground'>Cuerpo completo</span>
				</button>
			</div>

			{/* Atajos de ratón */}
			<div className='space-y-1 rounded-xl border border-border/60 bg-muted/30 p-2.5 text-[11px] text-muted-foreground'>
				<p className='font-semibold text-foreground text-xs'>Controles de ratón:</p>
				<div className='flex items-center justify-between'>
					<span>Rotar cámara:</span>
					<span className='font-medium font-mono text-foreground'>Clic izquierdo + arrastrar</span>
				</div>
				<div className='flex items-center justify-between'>
					<span>Zoom (Acercar/Alejar):</span>
					<span className='font-medium font-mono text-foreground'>Rueda del ratón</span>
				</div>
				<div className='flex items-center justify-between'>
					<span>Desplazar / Panorámica:</span>
					<span className='font-medium font-mono text-foreground'>Clic derecho + arrastrar</span>
				</div>
			</div>
		</div>
	);
}
