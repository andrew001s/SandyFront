'use client';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { avatar2dManager } from '@/lib/avatar2d/avatar2dManager';
import type { Avatar2dState, PngTuberEmotion } from '@/lib/avatar2d/types';
import { motion } from 'framer-motion';
import { Mic, Pencil, Plus, RotateCcw, Smile, Trash2, Upload, Volume2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface Props {
	onClose: () => void;
}

export function Avatar2dExpressionsPanel({ onClose }: Props) {
	const [state, setState] = useState<Avatar2dState>(avatar2dManager.getState());
	const [isSpeaking, setIsSpeaking] = useState(avatar2dManager.getIsSpeaking());
	const [isCreating, setIsCreating] = useState(false);
	const [editingEmotion, setEditingEmotion] = useState<PngTuberEmotion | null>(null);
	const [emotionToDelete, setEmotionToDelete] = useState<PngTuberEmotion | null>(null);
	const [newLabel, setNewLabel] = useState('');
	const [newImage, setNewImage] = useState<string | null>(null);
	const [newSpeakingImage, setNewSpeakingImage] = useState<string | null>(null);
	const [newBlinkImage, setNewBlinkImage] = useState<string | null>(null);
	const [uploadTarget, setUploadTarget] = useState<'idle' | 'speaking' | 'blink'>('idle');
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
		const selected = emotions.find((e) => e.id === id);
		if (selected) {
			toast.info(`Expresión activa: ${selected.label}`);
		}
	};

	const handleToggleSpeaking = () => {
		avatar2dManager.setSpeaking(!isSpeaking);
	};

	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			const result = event.target?.result as string;
			if (result) {
				if (uploadTarget === 'idle') {
					setNewImage(result);
					setErrorMessage(null);
				} else if (uploadTarget === 'speaking') {
					setNewSpeakingImage(result);
				} else if (uploadTarget === 'blink') {
					setNewBlinkImage(result);
				}
			}
		};
		reader.readAsDataURL(file);
		e.target.value = '';
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

		try {
			const created = avatar2dManager.addCustomEmotion(
				newLabel.trim(),
				newImage,
				newSpeakingImage || undefined,
				newBlinkImage || undefined,
			);
			avatar2dManager.setEmotion(created.id);
			toast.success(`Expresión "${created.label}" creada y activada`);
			setNewLabel('');
			setNewImage(null);
			setNewSpeakingImage(null);
			setNewBlinkImage(null);
			setErrorMessage(null);
			setIsCreating(false);
		} catch (err) {
			console.error('Error al guardar expresión:', err);
			setErrorMessage('No se pudo guardar la expresión. Prueba con una imagen más liviana.');
		}
	};

	const handleCancelCreate = () => {
		setNewLabel('');
		setNewImage(null);
		setNewSpeakingImage(null);
		setNewBlinkImage(null);
		setErrorMessage(null);
		setIsCreating(false);
	};

	const handleStartEdit = (em: PngTuberEmotion) => {
		setIsCreating(false);
		setEditingEmotion(em);
		setNewLabel(em.label);
		setNewImage(em.idle);
		setNewSpeakingImage(em.speaking || null);
		setNewBlinkImage(em.blink || null);
		setErrorMessage(null);
	};

	const handleCancelEdit = () => {
		setEditingEmotion(null);
		setNewLabel('');
		setNewImage(null);
		setNewSpeakingImage(null);
		setNewBlinkImage(null);
		setErrorMessage(null);
	};

	const handleSaveEdit = () => {
		if (!editingEmotion) return;
		if (!newLabel.trim()) {
			setErrorMessage('El nombre es obligatorio');
			return;
		}
		if (!newImage) {
			setErrorMessage('Selecciona una imagen para la expresión');
			return;
		}

		try {
			const updated = avatar2dManager.updateCustomEmotion(editingEmotion.id, {
				label: newLabel.trim(),
				idle: newImage,
				speaking: newSpeakingImage || undefined,
				blink: newBlinkImage || undefined,
			});
			if (updated) {
				toast.success(`Expresión "${updated.label}" actualizada`);
			}
			handleCancelEdit();
		} catch (err) {
			console.error('Error al actualizar expresión:', err);
			setErrorMessage('No se pudo actualizar la expresión.');
		}
	};

	const handleDeleteClick = (em: PngTuberEmotion) => {
		setEmotionToDelete(em);
	};

	const handleConfirmDelete = () => {
		if (!emotionToDelete) return;
		const target = emotionToDelete;
		setEmotionToDelete(null);
		const deleted = avatar2dManager.deleteEmotion(target.id);
		if (deleted) {
			toast.success(`Expresión "${target.label}" eliminada`);
			if (editingEmotion?.id === target.id) {
				handleCancelEdit();
			}
		}
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

				{/* Grilla de Emociones y Formulario de Nueva/Editar Expresión */}
				<div className='space-y-1.5'>
					<div className='flex items-center justify-between'>
						<span className='font-medium text-[11px] text-muted-foreground'>Estados de ánimo</span>
						<Button
							variant='ghost'
							size='sm'
							onClick={() => {
								setEditingEmotion(null);
								setIsCreating(!isCreating);
							}}
							className='h-6 px-1.5 text-[11px] text-primary hover:text-primary/80'
						>
							<Plus className='mr-1 size-3' /> Nueva expresión
						</Button>
					</div>

					{/* Formulario de creación o edición */}
					{(isCreating || editingEmotion) && (
						<div className='space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-2.5'>
							<div className='flex items-center justify-between'>
								<span className='font-medium text-[11px] text-primary'>
									{editingEmotion ? `Editar "${editingEmotion.label}"` : 'Nueva expresión'}
								</span>
							</div>
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
								accept='image/*,.png,.jpg,.jpeg,.gif,.webp,.svg,.avif,.bmp'
								onChange={handleFileSelect}
								className='hidden'
							/>
							<div className='space-y-1.5'>
								<span className='text-[10px] text-muted-foreground'>Imágenes de la expresión:</span>
								<div className='grid grid-cols-3 gap-1.5'>
									{/* Reposo */}
									<button
										type='button'
										onClick={() => {
											setUploadTarget('idle');
											fileInputRef.current?.click();
										}}
										className={`group relative flex flex-col items-center gap-1 rounded-lg border p-1 text-center transition-all ${
											newImage
												? 'border-primary bg-primary/10'
												: 'border-border/70 bg-card hover:border-primary/50'
										}`}
									>
										<div className='relative size-9 overflow-hidden rounded bg-black/20'>
											{newImage ? (
												// biome-ignore lint/nursery/noImgElement: Data URL preview
												<img src={newImage} alt='Reposo' className='h-full w-full object-contain' />
											) : (
												<div className='flex h-full w-full items-center justify-center text-muted-foreground'>
													<Upload className='size-3.5' />
												</div>
											)}
										</div>
										<span className='font-medium text-[9px] text-foreground'>Reposo *</span>
									</button>

									{/* Hablando */}
									<button
										type='button'
										onClick={() => {
											setUploadTarget('speaking');
											fileInputRef.current?.click();
										}}
										className={`group relative flex flex-col items-center gap-1 rounded-lg border p-1 text-center transition-all ${
											newSpeakingImage
												? 'border-primary bg-primary/10'
												: 'border-border/70 bg-card hover:border-primary/50'
										}`}
									>
										<div className='relative size-9 overflow-hidden rounded bg-black/20'>
											{newSpeakingImage ? (
												// biome-ignore lint/nursery/noImgElement: Data URL preview
												<img
													src={newSpeakingImage}
													alt='Hablando'
													className='h-full w-full object-contain'
												/>
											) : (
												<div className='flex h-full w-full items-center justify-center text-muted-foreground'>
													<Upload className='size-3.5' />
												</div>
											)}
										</div>
										<span className='font-medium text-[9px] text-muted-foreground'>
											Boca abierta
										</span>
									</button>

									{/* Parpadeo */}
									<button
										type='button'
										onClick={() => {
											setUploadTarget('blink');
											fileInputRef.current?.click();
										}}
										className={`group relative flex flex-col items-center gap-1 rounded-lg border p-1 text-center transition-all ${
											newBlinkImage
												? 'border-primary bg-primary/10'
												: 'border-border/70 bg-card hover:border-primary/50'
										}`}
									>
										<div className='relative size-9 overflow-hidden rounded bg-black/20'>
											{newBlinkImage ? (
												// biome-ignore lint/nursery/noImgElement: Data URL preview
												<img
													src={newBlinkImage}
													alt='Parpadeo'
													className='h-full w-full object-contain'
												/>
											) : (
												<div className='flex h-full w-full items-center justify-center text-muted-foreground'>
													<Upload className='size-3.5' />
												</div>
											)}
										</div>
										<span className='font-medium text-[9px] text-muted-foreground'>Parpadeo</span>
									</button>
								</div>
								<p className='text-[9px] text-muted-foreground leading-tight'>
									* Reposo es obligatorio. Si no subes boca abierta o parpadeo, el modelo usará sus
									gestos predeterminados.
								</p>
							</div>

							{errorMessage && <p className='text-[10px] text-destructive'>{errorMessage}</p>}

							<div className='flex items-center justify-end gap-1.5 pt-1'>
								<Button
									type='button'
									variant='ghost'
									size='sm'
									onClick={editingEmotion ? handleCancelEdit : handleCancelCreate}
									className='h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground'
								>
									Cancelar
								</Button>
								<Button
									type='button'
									size='sm'
									onClick={editingEmotion ? handleSaveEdit : handleCreateExpression}
									className='h-6 px-2 text-[10px]'
								>
									{editingEmotion ? 'Guardar cambios' : 'Guardar expresión'}
								</Button>
							</div>
						</div>
					)}

					<div className='grid grid-cols-2 gap-1.5'>
						{emotions.map((em) => {
							const isSelected = activeEmotion === em.id;
							return (
								<div
									key={em.id}
									className={`flex items-center justify-between gap-1.5 rounded-xl border px-2.5 py-2 text-left text-xs transition-all ${
										isSelected
											? 'border-primary bg-primary/10 font-semibold text-primary shadow-xs ring-1 ring-primary/30'
											: 'border-border/60 bg-card/60 text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground'
									}`}
								>
									<button
										type='button'
										onClick={() => handleSelectEmotion(em.id)}
										className='flex min-w-0 flex-1 items-center gap-1.5 text-left focus:outline-none'
									>
										{em.idle && (
											<div className='relative size-4.5 shrink-0 overflow-hidden rounded bg-black/20'>
												{/* biome-ignore lint/nursery/noImgElement: Data URL thumbnail */}
												<img
													src={em.idle}
													alt={em.label}
													className='h-full w-full object-contain'
												/>
											</div>
										)}
										<span className='truncate'>{em.label}</span>
									</button>
									<div className='flex shrink-0 items-center gap-1'>
										<button
											type='button'
											onClick={(e) => {
												e.stopPropagation();
												handleStartEdit(em);
											}}
											aria-label={`Editar ${em.label}`}
											title={`Editar ${em.label}`}
											className='rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none'
										>
											<Pencil className='size-3' />
										</button>
										<button
											type='button'
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteClick(em);
											}}
											aria-label={`Eliminar ${em.label}`}
											title={`Eliminar ${em.label}`}
											className='rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus:outline-none'
										>
											<Trash2 className='size-3' />
										</button>
										{isSelected && <span className='size-1.5 shrink-0 rounded-full bg-primary' />}
									</div>
								</div>
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

			{/* Confirmación accesible de eliminación con Dialog */}
			<Dialog
				open={!!emotionToDelete}
				onOpenChange={(open) => {
					if (!open) setEmotionToDelete(null);
				}}
			>
				<DialogContent className='border-border/80 bg-background/95 p-6 shadow-2xl backdrop-blur-xl sm:max-w-md'>
					<DialogHeader className='gap-2.5 p-0 text-left'>
						<div className='flex items-center gap-3'>
							<div className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive'>
								<Trash2 className='size-5' />
							</div>
							<div>
								<DialogTitle className='font-bold text-base text-foreground sm:text-lg'>
									¿Eliminar expresión?
								</DialogTitle>
								<p className='text-muted-foreground text-xs'>
									Confirmación de eliminación definitiva
								</p>
							</div>
						</div>
						<DialogDescription className='pt-2 text-foreground/80 text-sm leading-relaxed'>
							Esta acción no se puede deshacer. Se eliminarán permanentemente los sprites y la
							configuración de{' '}
							<span className='rounded border border-border/80 bg-muted/60 px-1.5 py-0.5 font-semibold text-foreground'>
								{emotionToDelete?.label}
							</span>
							.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className='flex gap-2.5 p-0 pt-4 sm:justify-end'>
						<Button
							type='button'
							variant='outline'
							onClick={() => setEmotionToDelete(null)}
							className='h-9 px-4 text-sm'
						>
							Cancelar
						</Button>
						<Button
							type='button'
							variant='destructive'
							onClick={handleConfirmDelete}
							className='h-9 px-4 text-sm'
						>
							Eliminar expresión
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</motion.div>
	);
}
