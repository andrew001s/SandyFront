'use client';

import { Button } from '@/components/ui/button';
import { type Live2dPackage, live2dStore } from '@/lib/avatar2d/live2dStore';
import { motion } from 'framer-motion';
import { Box, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
	onClose: () => void;
	onOpenModelSelect?: () => void;
}

export function Live2dExpressionsPanel({ onClose, onOpenModelSelect }: Props) {
	const [pkg, setPkg] = useState<Live2dPackage | null>(live2dStore.getPackage());

	useEffect(() => {
		const unsub = live2dStore.subscribe((next) => setPkg(next));
		return () => unsub();
	}, []);

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.96, x: 20 }}
			animate={{ opacity: 1, scale: 1, x: 0 }}
			exit={{ opacity: 0, scale: 0.96, x: 20 }}
			transition={{ duration: 0.2, ease: 'easeOut' }}
			className='pointer-events-auto absolute top-4 right-20 z-30 max-h-[calc(100%-2rem)] overflow-y-auto'
		>
			<div className='flex w-80 max-w-[calc(100vw-5rem)] flex-col gap-3 rounded-2xl border border-border/80 bg-background/90 p-3.5 shadow-2xl backdrop-blur-xl sm:w-84'>
				{/* Cabecera del Panel */}
				<div className='flex items-center justify-between border-border/60 border-b pb-2'>
					<div className='flex items-center gap-2'>
						<div className='flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary'>
							<Sparkles className='size-3.5' />
						</div>
						<span className='font-semibold text-foreground text-xs'>Expresiones Live2D</span>
					</div>
					<Button
						variant='ghost'
						size='icon'
						onClick={onClose}
						aria-label='Cerrar'
						className='size-6 text-muted-foreground hover:text-foreground'
					>
						<X className='size-3.5' />
					</Button>
				</div>

				{/* Estado vacío cuando no hay modelo cargado */}
				{!pkg ? (
					<div className='flex flex-col items-center justify-center gap-2.5 rounded-xl border border-border/60 border-dashed bg-muted/20 p-5 text-center'>
						<div className='flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary'>
							<Box className='size-4.5' />
						</div>
						<div className='space-y-1'>
							<p className='font-semibold text-foreground text-xs'>Sin modelo Live2D activo</p>
							<p className='text-[11px] text-muted-foreground leading-relaxed'>
								Carga un modelo .zip o .model3.json para descubrir y activar sus expresiones
								nativas.
							</p>
						</div>
						{onOpenModelSelect && (
							<Button
								type='button'
								size='sm'
								onClick={onOpenModelSelect}
								className='mt-1 h-7 px-3 text-xs'
							>
								Cargar modelo
							</Button>
						)}
					</div>
				) : (
					<div className='space-y-2'>
						<p className='text-[11px] text-muted-foreground'>
							Modelo activo: <span className='font-medium text-foreground'>{pkg.modelName}</span>
						</p>
					</div>
				)}
			</div>
		</motion.div>
	);
}
