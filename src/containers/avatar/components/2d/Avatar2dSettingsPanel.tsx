'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { avatar2dManager } from '@/lib/avatar2d/avatar2dManager';
import { live2dStore } from '@/lib/avatar2d/live2dStore';
import { unpackLive2dZip } from '@/lib/avatar2d/live2dZipLoader';
import type { Avatar2dMode, Avatar2dState, PngTuberSpriteKey } from '@/lib/avatar2d/types';
import { motion } from 'framer-motion';
import {
	Activity,
	Focus,
	Layers,
	Maximize,
	RotateCcw,
	Sliders,
	Sparkles,
	Trash2,
	Upload,
	UserCheck,
	X,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface Props {
	onClose: () => void;
}

export function Avatar2dSettingsPanel({ onClose }: Props) {
	const [state, setState] = useState<Avatar2dState>(avatar2dManager.getState());
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const zipInputRef = useRef<HTMLInputElement | null>(null);
	const [targetSpriteKey, setTargetSpriteKey] = useState<PngTuberSpriteKey>('idle');

	useEffect(() => {
		const unsub = avatar2dManager.subscribe((next) => setState(next));
		return () => unsub();
	}, []);

	const { mode, pngtuber } = state;
	const { physics, sprites } = pngtuber;

	const handleModeChange = (newMode: Avatar2dMode) => {
		avatar2dManager.setMode(newMode);
		toast.success(
			`Modo cambiado a: ${newMode === 'pngtuber' ? 'PNGTuber Reactivo' : 'Live2D WebGL'}`,
		);
	};

	const handleBounceChange = (val: number) => {
		avatar2dManager.setPhysics({
			...physics,
			bounceAmount: val,
		});
	};

	const handleBounceSpeedChange = (val: number) => {
		avatar2dManager.setPhysics({
			...physics,
			bounceSpeed: val,
		});
	};

	const handleBlinkIntervalChange = (val: number) => {
		avatar2dManager.setPhysics({
			...physics,
			blinkInterval: val,
		});
	};

	const handleToggleBreathing = (checked: boolean) => {
		avatar2dManager.setPhysics({
			...physics,
			breathing: checked,
		});
	};

	const handleResetTransform = () => {
		avatar2dManager.setTransform({ x: 0, y: 0, scale: 1, rotation: 0 }, mode);
		toast.info('Posición y escala restablecidas');
	};

	const handleResetSprites = () => {
		avatar2dManager.resetDefaultSprites();
		toast.success('Sprites de Sandy restablecidos por defecto');
	};

	const handleUploadClick = (key: PngTuberSpriteKey) => {
		setTargetSpriteKey(key);
		fileInputRef.current?.click();
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith('image/')) {
			toast.error('Por favor selecciona una imagen válida (PNG, GIF o WebP)');
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			const dataUrl = reader.result as string;
			avatar2dManager.updateSprite(targetSpriteKey, dataUrl);
			toast.success(`Sprite "${targetSpriteKey}" actualizado`);
		};
		reader.readAsDataURL(file);
		e.target.value = '';
	};

	const handleZipSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const toastId = toast.loading(`Cargando modelo Live2D: ${file.name}...`);
		try {
			const loadedPackage = await unpackLive2dZip(file);
			live2dStore.setPackage(loadedPackage);
			avatar2dManager.setLive2dModel('loaded', loadedPackage.modelName);
			toast.success(`Modelo "${loadedPackage.modelName}" listo en pantalla`, { id: toastId });
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Error al procesar el archivo .ZIP';
			toast.error(msg, { id: toastId });
		}
		e.target.value = '';
	};

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95, x: -10 }}
			animate={{ opacity: 1, scale: 1, x: 0 }}
			exit={{ opacity: 0, scale: 0.95, x: -10 }}
			transition={{ duration: 0.2 }}
			className='pointer-events-auto absolute top-4 left-18 z-30'
		>
			<input
				ref={fileInputRef}
				type='file'
				accept='image/png,image/gif,image/webp,image/svg+xml'
				onChange={handleFileSelect}
				className='hidden'
			/>

			<div className='flex w-84 max-w-[calc(100vw-5rem)] flex-col gap-3.5 rounded-2xl border border-border/80 bg-background/90 p-3.5 shadow-2xl backdrop-blur-xl sm:w-92'>
				{/* Cabecera */}
				<div className='flex items-center justify-between border-border/60 border-b pb-2'>
					<div className='flex items-center gap-2'>
						<div className='flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary'>
							<Sliders className='size-3.5' />
						</div>
						<span className='font-semibold text-foreground text-xs'>
							Configuración del Avatar 2D
						</span>
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

				{/* Selector de Modo: PNGTuber vs Live2D */}
				<div className='space-y-1.5'>
					<Label className='text-[11px] text-muted-foreground'>Motor del Modelo 2D</Label>
					<Tabs
						value={mode}
						onValueChange={(v) => handleModeChange(v as Avatar2dMode)}
						className='w-full'
					>
						<TabsList className='grid h-8 w-full grid-cols-2 rounded-lg border border-border/70 bg-card p-0.5'>
							<TabsTrigger
								value='pngtuber'
								className='h-7 font-medium text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary'
							>
								<Layers className='mr-1.5 size-3' /> PNGTuber
							</TabsTrigger>
							<TabsTrigger
								value='live2d'
								className='h-7 font-medium text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary'
							>
								<Activity className='mr-1.5 size-3' /> Live2D WebGL
							</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>

				{mode === 'pngtuber' ? (
					<>
						{/* Física y Rebote de PNGTuber */}
						<div className='space-y-2.5 rounded-xl border border-border/60 bg-muted/25 p-2.5'>
							<span className='font-medium text-[11px] text-foreground'>
								Física de Voz y Rebote (Bounce)
							</span>

							{/* Altura de Salto */}
							<div className='space-y-1'>
								<div className='flex justify-between text-[11px]'>
									<span className='text-muted-foreground'>Altura del rebote</span>
									<span className='font-medium font-mono text-primary'>
										{physics.bounceAmount}px
									</span>
								</div>
								<input
									type='range'
									min={0}
									max={30}
									step={1}
									value={physics.bounceAmount}
									onChange={(e) => handleBounceChange(Number(e.target.value))}
									className='h-1.5 w-full cursor-pointer rounded-lg bg-muted accent-primary'
								/>
							</div>

							{/* Velocidad de Rebote */}
							<div className='space-y-1'>
								<div className='flex justify-between text-[11px]'>
									<span className='text-muted-foreground'>Velocidad de respuesta</span>
									<span className='font-medium font-mono text-primary'>
										{physics.bounceSpeed}ms
									</span>
								</div>
								<input
									type='range'
									min={100}
									max={400}
									step={10}
									value={physics.bounceSpeed}
									onChange={(e) => handleBounceSpeedChange(Number(e.target.value))}
									className='h-1.5 w-full cursor-pointer rounded-lg bg-muted accent-primary'
								/>
							</div>

							{/* Frecuencia de Parpadeo */}
							<div className='space-y-1'>
								<div className='flex justify-between text-[11px]'>
									<span className='text-muted-foreground'>Intervalo de parpadeo</span>
									<span className='font-medium font-mono text-primary'>
										{(physics.blinkInterval / 1000).toFixed(1)}s
									</span>
								</div>
								<input
									type='range'
									min={2000}
									max={6000}
									step={200}
									value={physics.blinkInterval}
									onChange={(e) => handleBlinkIntervalChange(Number(e.target.value))}
									className='h-1.5 w-full cursor-pointer rounded-lg bg-muted accent-primary'
								/>
							</div>

							{/* Respiración suave en reposo */}
							<div className='flex items-center justify-between pt-1'>
								<span className='text-[11px] text-muted-foreground'>
									Respiración suave (Idle breathe)
								</span>
								<Switch checked={physics.breathing} onCheckedChange={handleToggleBreathing} />
							</div>
						</div>

						{/* Sprites del PNGTuber */}
						<div className='space-y-2'>
							<div className='flex items-center justify-between'>
								<span className='font-medium text-[11px] text-muted-foreground'>
									Sprites de Estados (Haz clic para cambiar)
								</span>
								<Button
									variant='ghost'
									size='sm'
									onClick={handleResetSprites}
									className='h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground'
								>
									<RotateCcw className='mr-1 size-2.5' /> Reiniciar
								</Button>
							</div>

							<div className='grid grid-cols-3 gap-2'>
								{/* 1. Reposo */}
								<button
									type='button'
									onClick={() => handleUploadClick('idle')}
									className='group relative flex flex-col items-center gap-1 rounded-xl border border-border/70 bg-card p-1.5 text-center transition-all hover:border-primary'
									title='Cambiar sprite de reposo'
								>
									<div className='relative size-14 overflow-hidden rounded-lg bg-black/20'>
										<Image
											src={sprites.idle}
											alt='Reposo'
											width={56}
											height={56}
											unoptimized
											className='h-full w-full object-contain'
										/>
										<div className='absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100'>
											<Upload className='size-4 text-white' />
										</div>
									</div>
									<span className='font-medium text-[10px] text-foreground'>Reposo</span>
								</button>

								{/* 2. Hablando */}
								<button
									type='button'
									onClick={() => handleUploadClick('speaking')}
									className='group relative flex flex-col items-center gap-1 rounded-xl border border-border/70 bg-card p-1.5 text-center transition-all hover:border-primary'
									title='Cambiar sprite de hablando'
								>
									<div className='relative size-14 overflow-hidden rounded-lg bg-black/20'>
										<Image
											src={sprites.speaking}
											alt='Hablando'
											width={56}
											height={56}
											unoptimized
											className='h-full w-full object-contain'
										/>
										<div className='absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100'>
											<Upload className='size-4 text-white' />
										</div>
									</div>
									<span className='font-medium text-[10px] text-primary'>Hablando</span>
								</button>

								{/* 3. Parpadeo */}
								<button
									type='button'
									onClick={() => handleUploadClick('blink')}
									className='group relative flex flex-col items-center gap-1 rounded-xl border border-border/70 bg-card p-1.5 text-center transition-all hover:border-primary'
									title='Cambiar sprite de parpadeo'
								>
									<div className='relative size-14 overflow-hidden rounded-lg bg-black/20'>
										<Image
											src={sprites.blink}
											alt='Parpadeo'
											width={56}
											height={56}
											unoptimized
											className='h-full w-full object-contain'
										/>
										<div className='absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100'>
											<Upload className='size-4 text-white' />
										</div>
									</div>
									<span className='font-medium text-[10px] text-foreground'>Parpadeo</span>
								</button>
							</div>
						</div>
					</>
				) : (
					/* Modo Live2D Settings */
					<div className='space-y-3 rounded-xl border border-border/60 bg-muted/25 p-3 text-xs'>
						<input
							ref={zipInputRef}
							type='file'
							accept='.zip'
							onChange={handleZipSelect}
							className='hidden'
						/>

						<div className='space-y-1'>
							<span className='font-semibold text-foreground'>Modelo Live2D WebGL</span>
							<p className='text-[11px] text-muted-foreground leading-relaxed'>
								Carga paquetes <code>.zip</code> para renderizar modelos Live2D Cubism directamente
								en el navegador con soporte de audio y seguimiento.
							</p>
						</div>

						{state.live2d.modelUrl ? (
							<div className='flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 p-2.5'>
								<div className='min-w-0'>
									<div className='flex items-center gap-1.5 font-medium text-[11px] text-primary'>
										<Sparkles className='size-3 shrink-0' />
										<span className='truncate font-mono'>
											{state.live2d.modelName || 'Modelo Activo'}
										</span>
									</div>
									<p className='text-[10px] text-muted-foreground'>Cargado en memoria WebGL</p>
								</div>
								<div className='flex items-center gap-1'>
									<Button
										variant='outline'
										size='sm'
										onClick={() => zipInputRef.current?.click()}
										className='h-6 px-2 text-[10px]'
									>
										Cambiar
									</Button>
									<Button
										variant='ghost'
										size='icon'
										onClick={() => {
											live2dStore.setPackage(null);
											avatar2dManager.setLive2dModel(null);
										}}
										className='size-6 text-muted-foreground hover:text-destructive'
										title='Quitar modelo'
									>
										<Trash2 className='size-3' />
									</Button>
								</div>
							</div>
						) : (
							<Button
								variant='outline'
								size='sm'
								onClick={() => zipInputRef.current?.click()}
								className='h-8 w-full gap-1.5 border-primary/50 border-dashed text-primary text-xs hover:bg-primary/10'
							>
								<Upload className='size-3.5' /> Cargar archivo de modelo (.ZIP)
							</Button>
						)}

						<div className='space-y-2 rounded-lg border border-border/60 bg-card/50 p-2.5'>
							<div className='flex items-center justify-between'>
								<span className='text-[11px] text-foreground'>Seguimiento con el cursor</span>
								<Switch
									checked={state.live2d.eyeTracking}
									onCheckedChange={(checked) => {
										avatar2dManager.setLive2dModel(state.live2d.modelUrl, state.live2d.modelName);
										setState((prev) => ({
											...prev,
											live2d: { ...prev.live2d, eyeTracking: checked },
										}));
									}}
								/>
							</div>
							<div className='flex items-center justify-between'>
								<span className='text-[11px] text-foreground'>Reactividad de voz (Lip Sync)</span>
								<Switch checked={true} disabled />
							</div>
						</div>

						{/* Presets de Encuadre para Live2D */}
						<div className='space-y-2.5 rounded-lg border border-border/60 bg-card/50 p-2.5'>
							<span className='font-medium text-[11px] text-foreground'>
								Encuadre y Ajuste al Contenedor
							</span>

							<div className='grid grid-cols-3 gap-1.5'>
								<Button
									type='button'
									variant='outline'
									size='sm'
									onClick={() => {
										avatar2dManager.setTransform({ x: 0, y: 0, scale: 1, rotation: 0 }, 'live2d');
										toast.success('Encuadre: Cuerpo Completo (Auto-ajustado)');
									}}
									className='h-7 gap-1 px-1.5 font-medium text-[10px]'
									title='Ajustar todo el cuerpo dentro del contenedor'
								>
									<Maximize className='size-3 text-primary' /> Completo
								</Button>

								<Button
									type='button'
									variant='outline'
									size='sm'
									onClick={() => {
										avatar2dManager.setTransform(
											{ x: 0, y: 190, scale: 1.85, rotation: 0 },
											'live2d',
										);
										toast.success('Encuadre: Busto para streaming');
									}}
									className='h-7 gap-1 px-1.5 font-medium text-[10px]'
									title='Encuadre estándar de busto / webcam para stream'
								>
									<UserCheck className='size-3 text-primary' /> Busto
								</Button>

								<Button
									type='button'
									variant='outline'
									size='sm'
									onClick={() => {
										avatar2dManager.setTransform(
											{ x: 0, y: 380, scale: 2.8, rotation: 0 },
											'live2d',
										);
										toast.success('Encuadre: Primer plano de rostro');
									}}
									className='h-7 gap-1 px-1.5 font-medium text-[10px]'
									title='Primer plano para probar expresiones faciales'
								>
									<Focus className='size-3 text-primary' /> Rostro
								</Button>
							</div>

							{/* Slider de Escala / Zoom */}
							<div className='space-y-1 pt-1'>
								<div className='flex justify-between text-[10px] text-muted-foreground'>
									<span>Zoom / Escala</span>
									<span className='font-mono text-primary'>
										{Math.round((state.live2d.transform.scale || 1) * 100)}%
									</span>
								</div>
								<input
									type='range'
									min={40}
									max={350}
									step={5}
									value={Math.round((state.live2d.transform.scale || 1) * 100)}
									onChange={(e) => {
										const nextScale = Number(e.target.value) / 100;
										avatar2dManager.setTransform(
											{ ...state.live2d.transform, scale: nextScale },
											'live2d',
										);
									}}
									className='h-1.5 w-full cursor-pointer rounded-lg bg-muted accent-primary'
								/>
							</div>

							{/* Slider de Posición Vertical (Y) */}
							<div className='space-y-1'>
								<div className='flex justify-between text-[10px] text-muted-foreground'>
									<span>Posición Vertical (Y)</span>
									<span className='font-mono text-primary'>
										{Math.round(state.live2d.transform.y || 0)}px
									</span>
								</div>
								<input
									type='range'
									min={-350}
									max={450}
									step={5}
									value={Math.round(state.live2d.transform.y || 0)}
									onChange={(e) => {
										const nextY = Number(e.target.value);
										avatar2dManager.setTransform({ ...state.live2d.transform, y: nextY }, 'live2d');
									}}
									className='h-1.5 w-full cursor-pointer rounded-lg bg-muted accent-primary'
								/>
							</div>
						</div>
					</div>
				)}

				{/* Botón para reiniciar posición y zoom */}
				<Button
					variant='outline'
					size='sm'
					onClick={handleResetTransform}
					className='h-8 w-full gap-1.5 text-muted-foreground text-xs hover:text-foreground'
				>
					<RotateCcw className='size-3' />
					Restablecer Posición y Tamaño al Centro
				</Button>
			</div>
		</motion.div>
	);
}
