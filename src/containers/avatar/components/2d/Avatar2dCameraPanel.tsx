'use client';

import { Button } from '@/components/ui/button';
import { avatar2dManager } from '@/lib/avatar2d/avatar2dManager';
import type { Avatar2dMode, Avatar2dTransform } from '@/lib/avatar2d/types';
import { motion } from 'framer-motion';
import { Camera, Focus, Maximize, RotateCcw, UserCheck, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export type Avatar2dCameraPreset = 'fit' | 'bust' | 'face';

export function getAvatar2dCameraPresetTransform(
	preset: Avatar2dCameraPreset,
	mode: Avatar2dMode,
	containerHeight = 600,
): Avatar2dTransform {
	if (preset === 'fit') {
		return { x: 0, y: 0, scale: 1, rotation: 0 };
	}

	if (mode === 'live2d') {
		if (preset === 'bust') {
			// Busto / Webcam Streaming: cabeza cómodamente visible con margen superior (~9%), torso centrado
			return {
				x: 0,
				y: Math.round(containerHeight * 0.3),
				scale: 1.6,
				rotation: 0,
			};
		}
		// Rostro / Primer Plano: encuadre de cara y ojos centrado en tercio superior sin cortes
		return {
			x: 0,
			y: Math.round(containerHeight * 0.6),
			scale: 2.3,
			rotation: 0,
		};
	}

	// PNGTuber (sprite chibi)
	if (preset === 'bust') {
		return {
			x: 0,
			y: Math.round(containerHeight * 0.16),
			scale: 1.4,
			rotation: 0,
		};
	}
	return {
		x: 0,
		y: Math.round(containerHeight * 0.32),
		scale: 1.9,
		rotation: 0,
	};
}

interface Props {
	mode: Avatar2dMode;
	containerHeight?: number;
	onClose: () => void;
}

export function Avatar2dCameraPanel({ mode, containerHeight = 600, onClose }: Props) {
	const [transform, setTransform] = useState<Avatar2dTransform>(() => {
		const state = avatar2dManager.getState();
		return mode === 'pngtuber' ? state.pngtuber.transform : state.live2d.transform;
	});

	useEffect(() => {
		const unsub = avatar2dManager.subscribe((next) => {
			const current = mode === 'pngtuber' ? next.pngtuber.transform : next.live2d.transform;
			setTransform(current);
		});
		return () => unsub();
	}, [mode]);

	const handleApplyPreset = (preset: Avatar2dCameraPreset) => {
		const next = getAvatar2dCameraPresetTransform(preset, mode, containerHeight);
		avatar2dManager.setTransform(next, mode);

		if (preset === 'fit') {
			toast.success('Encuadre: Completo (Auto-ajustado)');
		} else if (preset === 'bust') {
			toast.success('Encuadre: Busto para streaming');
		} else if (preset === 'face') {
			toast.success('Encuadre: Primer Plano Rostro');
		}
	};

	const handleZoomDelta = (delta: number) => {
		const currentScale = transform.scale || 1;
		const nextScale = Math.round(Math.min(Math.max(currentScale + delta, 0.35), 3.5) * 100) / 100;
		avatar2dManager.setTransform(
			{
				...transform,
				scale: nextScale,
			},
			mode,
		);
	};

	const handleZoomSlider = (val: number) => {
		avatar2dManager.setTransform(
			{
				...transform,
				scale: val,
			},
			mode,
		);
	};

	const handleReset = () => {
		avatar2dManager.setTransform({ x: 0, y: 0, scale: 1, rotation: 0 }, mode);
		toast.info('Posición y encuadre restablecidos');
	};

	const scalePercent = Math.round((transform.scale || 1) * 100);

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.96, x: 20 }}
			animate={{ opacity: 1, scale: 1, x: 0 }}
			exit={{ opacity: 0, scale: 0.96, x: 20 }}
			transition={{ duration: 0.2, ease: 'easeOut' }}
			className='pointer-events-auto absolute top-4 right-20 z-30 max-h-[calc(100%-2rem)] overflow-y-auto'
		>
			<div className='flex w-76 max-w-[calc(100vw-3rem)] flex-col gap-3 rounded-2xl border border-border/80 bg-background/90 p-3.5 shadow-2xl backdrop-blur-xl sm:w-80'>
				{/* Encabezado */}
				<div className='flex items-center justify-between border-border/60 border-b pb-2.5'>
					<div className='flex items-center gap-2'>
						<div className='rounded-lg bg-amber-500/20 p-1.5 text-amber-400'>
							<Camera className='size-4' />
						</div>
						<div>
							<h3 className='font-bold font-display text-foreground text-sm tracking-tight'>
								Cámara y Encuadre 2D
							</h3>
							<p className='text-[10px] text-muted-foreground'>
								{mode === 'pngtuber' ? 'Encuadre PNGTuber' : 'Encuadre Live2D WebGL'}
							</p>
						</div>
					</div>

					<div className='flex items-center gap-1'>
						<Button
							variant='ghost'
							size='icon'
							onClick={handleReset}
							className='size-7 text-muted-foreground hover:bg-muted hover:text-foreground'
							title='Restablecer posición y zoom'
							aria-label='Restablecer posición y zoom'
						>
							<RotateCcw className='size-3.5' />
						</Button>
						<Button
							variant='ghost'
							size='icon'
							onClick={onClose}
							className='size-7 text-muted-foreground hover:bg-muted hover:text-foreground'
							title='Cerrar panel'
							aria-label='Cerrar panel'
						>
							<X className='size-3.5' />
						</Button>
					</div>
				</div>

				{/* Presets de Encuadre */}
				<div className='space-y-1.5'>
					<span className='font-medium text-[11px] text-muted-foreground'>
						Presets de Encuadre Rápido
					</span>
					<div className='grid grid-cols-3 gap-1.5'>
						<button
							type='button'
							onClick={() => handleApplyPreset('face')}
							className='flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-card/40 p-2.5 text-center text-muted-foreground transition-all hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-foreground'
						>
							<Focus className='size-4.5 text-amber-400' />
							<span className='font-sans font-semibold text-xs'>Rostro</span>
							<span className='text-[9px] text-muted-foreground'>Primer plano</span>
						</button>

						<button
							type='button'
							onClick={() => handleApplyPreset('bust')}
							className='flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-card/40 p-2.5 text-center text-muted-foreground transition-all hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-foreground'
						>
							<UserCheck className='size-4.5 text-amber-400' />
							<span className='font-sans font-semibold text-xs'>Busto</span>
							<span className='text-[9px] text-muted-foreground'>Streaming</span>
						</button>

						<button
							type='button'
							onClick={() => handleApplyPreset('fit')}
							className='flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-card/40 p-2.5 text-center text-muted-foreground transition-all hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-foreground'
						>
							<Maximize className='size-4.5 text-amber-400' />
							<span className='font-sans font-semibold text-xs'>Completo</span>
							<span className='text-[9px] text-muted-foreground'>Auto-ajustar</span>
						</button>
					</div>
				</div>

				{/* Controles de Zoom Dinámico */}
				<div className='space-y-2 rounded-xl border border-border/60 bg-muted/25 p-2.5'>
					<div className='flex items-center justify-between text-[11px]'>
						<span className='font-medium text-foreground'>Zoom y Escala</span>
						<span className='font-mono font-semibold text-amber-400'>{scalePercent}%</span>
					</div>

					<div className='flex items-center gap-2'>
						<Button
							type='button'
							variant='outline'
							size='icon'
							onClick={() => handleZoomDelta(-0.15)}
							className='size-7 shrink-0 text-muted-foreground hover:text-foreground'
							title='Alejar zoom (-)'
							aria-label='Alejar zoom'
						>
							<ZoomOut className='size-3.5' />
						</Button>

						<input
							type='range'
							min={0.35}
							max={3.5}
							step={0.05}
							value={transform.scale || 1}
							onChange={(e) => handleZoomSlider(Number(e.target.value))}
							className='h-1.5 w-full cursor-pointer rounded-lg bg-muted accent-amber-400'
						/>

						<Button
							type='button'
							variant='outline'
							size='icon'
							onClick={() => handleZoomDelta(0.15)}
							className='size-7 shrink-0 text-muted-foreground hover:text-foreground'
							title='Acercar zoom (+)'
							aria-label='Acercar zoom'
						>
							<ZoomIn className='size-3.5' />
						</Button>
					</div>
				</div>

				{/* Atajos de Control */}
				<div className='space-y-1 rounded-xl border border-border/60 bg-muted/30 p-2.5 text-[11px] text-muted-foreground'>
					<p className='font-semibold text-foreground text-xs'>Interacción con ratón:</p>
					<div className='flex items-center justify-between'>
						<span>Mover / Desplazar:</span>
						<span className='font-medium font-mono text-foreground'>
							Clic izquierdo + arrastrar
						</span>
					</div>
					<div className='flex items-center justify-between'>
						<span>Zoom fluido:</span>
						<span className='font-medium font-mono text-foreground'>Rueda del ratón</span>
					</div>
				</div>
			</div>
		</motion.div>
	);
}
