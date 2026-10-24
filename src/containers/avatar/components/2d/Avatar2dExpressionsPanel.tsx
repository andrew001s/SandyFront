'use client';

import { Button } from '@/components/ui/button';
import { avatar2dManager } from '@/lib/avatar2d/avatar2dManager';
import type { Avatar2dState } from '@/lib/avatar2d/types';
import { motion } from 'framer-motion';
import { Mic, Plus, RotateCcw, Smile, Upload, Volume2, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

interface Props {
	onClose: () => void;
}

export function Avatar2dExpressionsPanel({ onClose }: Props) {
	const [state, setState] = useState<Avatar2dState>(avatar2dManager.getState());
	const [isSpeaking, setIsSpeaking] = useState(avatar2dManager.getIsSpeaking());
	const [isCreating, setIsCreating] = useState(false);
	const [newLabel, setNewLabel] = useState('');
	const [newImage, setNewImage] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		const unsubState = avatar2dManager.subscribe((next) => setState(next));
		const unsubSpeaking = avatar2dManager.subscribeSpeaking((speaking) => setIsSpeaking(speaking));
		return () => {
			unsubState();
			unsubSpeaking();
		};
	}, []);

	const activeEmotion = state.pngtuber.activeEmotion;
	const emotions = state.pngtuber.emotions;

	const handleSelectEmotion = (id: string) => {
		avatar2dManager.setEmotion(id);
	};

	const handleToggleSpeaking = () => {
		avatar2dManager.setSpeaking(!isSpeaking);
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			const result = event.target?.result as string;
			if (result) {
				setNewImage(result);
				setErrorMessage(null);
			}
		};
		reader.readAsDataURL(file);
	};

	const handleCreateExpression = () => {
		if (!newLabel.trim()) {
			setErrorMessage('El nombre es obligatorio');
			return;
		}
		if (!newImage) {
			setErrorMessage('Selecciona una imagen para la expresión');
			return;
		}

		avatar2dManager.addCustomEmotion(newLabel.trim(), newImage);
		setNewLabel('');
		setNewImage(null);
		setErrorMessage(null);
		setIsCreating(false);
	};

	const handleCancelCreate = () => {
		setNewLabel('');
		setNewImage(null);
		setErrorMessage(null);
		setIsCreating(false);
	};

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
							<Smile className='size-3.5' />
						</div>
						<span className='font-semibold text-foreground text-xs'>Expresiones y Gestos 2D</span>
					</div>
					<Button
						variant='ghost'
						size='icon'
						onClick={onClose}
						className='size-6 text-muted-foreground hover:text-foreground'
					>
						<X className='size-3.5' />
					</Button>
				</div>

				{/* Prueba rápida de estado hablando (boca abierta + rebote) */}
				<div className='flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-2.5'>
					<div className='space-y-0.5'>
						<span className='flex items-center gap-1.5 font-medium text-foreground text-xs'>
							<Volume2 className='size-3.5 text-primary' /> Probar boca abierta
						</span>
						<p className='text-[10px] text-muted-foreground'>
							Alterna manualmente el estado hablando
						</p>
					</div>
					<Button
						size='sm'
						variant={isSpeaking ? 'default' : 'outline'}
						onClick={handleToggleSpeaking}
						className={`h-7 px-3 text-xs ${
							isSpeaking
								? 'bg-emerald-500 text-white shadow-xs hover:bg-emerald-600'
								: 'border-border/70'
						}`}
					>
						<Mic className='mr-1 size-3' />
						{isSpeaking ? 'Hablando' : 'Silencio'}
					</Button>
				</div>

				{/* Grilla de Emociones y Formulario de Nueva Expresión */}
				<div className='space-y-1.5'>
					<div className='flex items-center justify-between'>
						<span className='font-medium text-[11px] text-muted-foreground'>Estados de ánimo</span>
						<Button
							variant='ghost'
							size='sm'
							onClick={() => setIsCreating(!isCreating)}
							className='h-6 px-1.5 text-[11px] text-primary hover:text-primary/80'
						>
							<Plus className='mr-1 size-3' /> Nueva expresión
						</Button>
					</div>

					{/* Formulario de creación */}
					{isCreating && (
						<div className='space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-2.5'>
							<input
								type='text'
								placeholder='Nombre de la expresión'
								value={newLabel}
								onChange={(e) => {
									setNewLabel(e.target.value);
									if (errorMessage) setErrorMessage(null);
								}}
								className='h-7 w-full rounded-md border border-border/80 bg-background px-2 font-normal text-foreground text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none'
							/>

							{/* Selector de imagen + preview */}
							<input
								ref={fileInputRef}
								type='file'
								accept='image/*'
								onChange={handleFileSelect}
								className='hidden'
							/>
							<div className='flex items-center gap-2'>
								<Button
									type='button'
									variant='outline'
									size='sm'
									onClick={() => fileInputRef.current?.click()}
									className='h-7 flex-1 gap-1.5 text-[11px]'
								>
									<Upload className='size-3' />
									{newImage ? 'Cambiar imagen' : 'Subir imagen'}
								</Button>
								{newImage && (
									<div className='relative size-7 overflow-hidden rounded-md border border-border bg-black/20'>
										<Image
											src={newImage}
											alt='Preview'
											fill
											unoptimized
											className='object-contain'
										/>
									</div>
								)}
							</div>

							{errorMessage && <p className='text-[10px] text-destructive'>{errorMessage}</p>}

							<div className='flex items-center justify-end gap-1.5 pt-1'>
								<Button
									type='button'
									variant='ghost'
									size='sm'
									onClick={handleCancelCreate}
									className='h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground'
								>
									Cancelar
								</Button>
								<Button
									type='button'
									size='sm'
									onClick={handleCreateExpression}
									className='h-6 px-2 text-[10px]'
								>
									Guardar expresión
								</Button>
							</div>
						</div>
					)}

					<div className='grid grid-cols-2 gap-1.5'>
						{emotions.map((em) => {
							const isSelected = activeEmotion === em.id;
							return (
								<button
									key={em.id}
									type='button'
									onClick={() => handleSelectEmotion(em.id)}
									className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition-all ${
										isSelected
											? 'border-primary bg-primary/10 font-semibold text-primary shadow-xs ring-1 ring-primary/30'
											: 'border-border/60 bg-card/60 text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground'
									}`}
								>
									<span>{em.label}</span>
									{isSelected && <span className='size-1.5 rounded-full bg-primary' />}
								</button>
							);
						})}
					</div>
				</div>

				{/* Resetear a neutral */}
				<Button
					variant='outline'
					size='sm'
					onClick={() => handleSelectEmotion('neutral')}
					className='h-7.5 w-full gap-1.5 text-muted-foreground text-xs hover:text-foreground'
				>
					<RotateCcw className='size-3' />
					Restablecer a Neutral
				</Button>
			</div>
		</motion.div>
	);
}
