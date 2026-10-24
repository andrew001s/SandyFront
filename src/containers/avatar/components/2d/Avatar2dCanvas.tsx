'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar2dExpressionsPanel } from '@/containers/avatar/components/2d/Avatar2dExpressionsPanel';
import { Avatar2dLipSyncPanel } from '@/containers/avatar/components/2d/Avatar2dLipSyncPanel';
import { Avatar2dSettingsPanel } from '@/containers/avatar/components/2d/Avatar2dSettingsPanel';
import { Avatar2dStudioDock } from '@/containers/avatar/components/2d/Avatar2dStudioDock';
import { Live2dRenderer } from '@/containers/avatar/components/2d/Live2dRenderer';
import { PngTuberRenderer } from '@/containers/avatar/components/2d/PngTuberRenderer';
import { VrmStudioBackgroundPanel } from '@/containers/avatar/components/vrm/VrmStudioBackgroundPanel';
import { AudioQueueManager } from '@/lib/audioQueueSingleton';
import {
	DEFAULT_VRM_BACKGROUND_STATE,
	VRM_BACKGROUND_PRESETS,
	type VrmBackgroundState,
	getStoredBackgroundState,
	storeBackgroundState,
} from '@/lib/avatar/vrmBackground';
import { avatar2dManager } from '@/lib/avatar2d/avatar2dManager';
import { live2dStore } from '@/lib/avatar2d/live2dStore';
import { unpackLive2dZip } from '@/lib/avatar2d/live2dZipLoader';
import type { Avatar2dActiveTool, Avatar2dMode, Avatar2dState } from '@/lib/avatar2d/types';
import { AnimatePresence, motion } from 'framer-motion';
import {
	Activity,
	Check,
	Copy,
	Layers,
	Maximize2,
	Minimize2,
	Sparkles,
	Tv,
	Upload,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface Props {
	className?: string;
	mode?: Avatar2dMode;
}

const fileToDataUrl = (file: File): Promise<string> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
};

export function Avatar2dCanvas({ className = '', mode }: Props) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [state, setState] = useState<Avatar2dState>(avatar2dManager.getState());
	const [activeTool, setActiveTool] = useState<Avatar2dActiveTool>(null);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [isHudVisible, setIsHudVisible] = useState(true);
	const [isPlayingAudio, setIsPlayingAudio] = useState(false);
	const [copied, setCopied] = useState(false);
	const [bgState, setBgState] = useState<VrmBackgroundState>(DEFAULT_VRM_BACKGROUND_STATE);
	const [isDragging, setIsDragging] = useState(false);

	const currentMode = mode ?? state.mode;

	useEffect(() => {
		if (mode && mode !== avatar2dManager.getState().mode) {
			avatar2dManager.setMode(mode);
		}
	}, [mode]);

	useEffect(() => {
		const unsubState = avatar2dManager.subscribe((next) => setState(next));
		const storedBg = getStoredBackgroundState();
		setBgState(storedBg);

		const unsubAudio = AudioQueueManager.getInstance().subscribe((playing) => {
			setIsPlayingAudio(playing);
		});

		const handleFullscreenChange = () => {
			setIsFullscreen(Boolean(document.fullscreenElement));
		};
		document.addEventListener('fullscreenchange', handleFullscreenChange);

		return () => {
			unsubState();
			unsubAudio();
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
		};
	}, []);

	const handleToggleFullscreen = async () => {
		try {
			const target = containerRef.current;
			if (!target) return;

			if (!document.fullscreenElement) {
				if (target.requestFullscreen) {
					await target.requestFullscreen();
				}
			} else if (document.exitFullscreen) {
				await document.exitFullscreen();
			}
		} catch {
			toast.error('No se pudo alternar pantalla completa');
		}
	};

	const copyOverlayUrl = async () => {
		const overlayUrl = `${window.location.origin}/overlay/avatar2d`;
		try {
			await navigator.clipboard.writeText(overlayUrl);
			setCopied(true);
			toast.success('Enlace de Overlay 2D para OBS copiado al portapapeles', {
				description: 'Añádelo como Fuente de Navegador (Browser Source) en OBS Studio',
			});
			setTimeout(() => setCopied(false), 2500);
		} catch {
			toast.error('No se pudo copiar el enlace', {
				description: overlayUrl,
			});
		}
	};

	const handleBackgroundChange = (next: VrmBackgroundState) => {
		setBgState(next);
		storeBackgroundState(next);
	};

	const handleFileUpload = async (file: File) => {
		const fileName = file.name.toLowerCase();

		// 1. Imagen para fondo o sprite PNGTuber
		if (file.type.startsWith('image/')) {
			try {
				toast.loading('Cargando imagen como fondo del estudio...', { id: 'drop-2d' });
				const dataUrl = await fileToDataUrl(file);
				const nextState: VrmBackgroundState = {
					...bgState,
					mode: 'image',
					imageUrl: dataUrl,
					imageName: file.name,
				};
				handleBackgroundChange(nextState);
				setActiveTool('background');
				toast.success(`Fondo del estudio 2D actualizado con "${file.name}"`, { id: 'drop-2d' });
			} catch {
				toast.error('Error al procesar la imagen de fondo', { id: 'drop-2d' });
			}
			return;
		}

		// 2. Archivo ZIP de modelo Live2D (ej. RetrynowMiku.zip, huohuo2.zip)
		if (fileName.endsWith('.zip')) {
			const toastId = toast.loading(`Desempaquetando modelo Live2D: ${file.name}...`);
			try {
				const loadedPackage = await unpackLive2dZip(file);
				live2dStore.setPackage(loadedPackage);
				avatar2dManager.setLive2dModel('loaded', loadedPackage.modelName);
				avatar2dManager.setMode('live2d');
				toast.success(`¡Modelo Live2D "${loadedPackage.modelName}" cargado en el navegador!`, {
					id: toastId,
					description: 'Se ha cargado con físicas, seguimiento de cursor y sincronización de voz.',
				});
			} catch (err) {
				const msg = err instanceof Error ? err.message : 'Error al procesar el archivo .ZIP';
				toast.error(msg, {
					id: toastId,
					description:
						'Asegúrate de que el archivo .ZIP contenga un modelo Live2D con archivo .model3.json.',
				});
			}
			return;
		}

		// 3. Archivo .model3.json de Live2D
		if (fileName.endsWith('.model3.json') || fileName.endsWith('.moc3')) {
			toast.info(`Modelo Live2D detectado: "${file.name}"`, {
				description:
					'Para usarlo en VTube Studio, copia toda la carpeta que contiene el archivo .model3.json y sus texturas a la carpeta "Live2DModels" de VTube Studio.',
				duration: 9000,
			});
			return;
		}

		// 4. Archivo VRM (3D)
		if (fileName.endsWith('.vrm')) {
			toast.info(`Detectado avatar 3D: "${file.name}"`, {
				description:
					'Selecciona "Avatar 3D (VRM)" en el selector superior para cargar este modelo en el visor 3D.',
				duration: 7000,
			});
			return;
		}

		// 5. Archivo MMD (.pmx / .pmd)
		if (fileName.endsWith('.pmx') || fileName.endsWith('.pmd')) {
			toast.error(`Modelo MMD 3D detectado: "${file.name}"`, {
				description:
					'Los modelos MMD (.pmx) no son compatibles directamente con VTube Studio 2D. VTube Studio solo admite modelos Live2D (.model3.json).',
				duration: 9000,
			});
			return;
		}

		toast.error(
			'Formato no reconocido. Arrastra una imagen (.png, .jpg), un modelo Live2D descomprimido o .vrm.',
		);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		const file = e.dataTransfer.files?.[0];
		if (file) {
			void handleFileUpload(file);
		}
	};

	// Capa de fondo configurable idéntica a la del 3D
	const renderBackgroundLayer = () => {
		if (bgState.mode === 'preset' && bgState.presetId === 'checker') {
			return (
				<div className='pointer-events-none absolute inset-0 bg-[repeating-conic-gradient(#27272a_0%_25%,#18181b_0%_50%)] bg-[size:24px_24px] opacity-70' />
			);
		}

		if (bgState.mode === 'color') {
			return (
				<div
					className='absolute inset-0 transition-colors duration-300'
					style={{ backgroundColor: bgState.customColor }}
				/>
			);
		}

		if (bgState.mode === 'image' && bgState.imageUrl) {
			return (
				<>
					<div
						className='absolute inset-0 transition-all duration-300'
						style={{
							backgroundImage: `url("${bgState.imageUrl}")`,
							backgroundSize: bgState.imageFit,
							backgroundPosition: 'center',
							backgroundRepeat: 'no-repeat',
							filter: bgState.imageBlur > 0 ? `blur(${bgState.imageBlur}px)` : undefined,
							transform: bgState.imageBlur > 0 ? 'scale(1.04)' : undefined,
						}}
					/>
					{bgState.imageDim > 0 && (
						<div
							className='pointer-events-none absolute inset-0 bg-black transition-opacity'
							style={{ opacity: bgState.imageDim }}
						/>
					)}
				</>
			);
		}

		const match =
			VRM_BACKGROUND_PRESETS.find((p) => p.id === bgState.presetId) || VRM_BACKGROUND_PRESETS[0];

		if (match.backgroundColor) {
			return (
				<div
					className='absolute inset-0 transition-colors duration-300'
					style={{ backgroundColor: match.backgroundColor }}
				/>
			);
		}

		return <div className={`absolute inset-0 transition-all duration-300 ${match.styleClass}`} />;
	};

	return (
		<Card
			ref={containerRef}
			className={`relative flex w-full flex-col overflow-hidden bg-card shadow-2xl transition-all duration-300 ${
				isFullscreen
					? 'fixed inset-0 z-50 h-screen w-screen rounded-none border-0'
					: 'rounded-2xl border border-border/80'
			} ${className}`}
			onDragOver={(e) => {
				e.preventDefault();
				setIsDragging(true);
			}}
			onDragLeave={(e) => {
				if (!containerRef.current?.contains(e.relatedTarget as Node)) {
					setIsDragging(false);
				}
			}}
			onDrop={handleDrop}
		>
			{/* Encabezado HUD superior del Estudio 2D */}
			{isHudVisible && (
				<CardHeader
					className={`z-20 border-border/60 border-b px-4 py-2.5 backdrop-blur-md sm:px-5 ${
						isFullscreen ? 'absolute inset-x-0 top-0 bg-card/85 shadow-md' : 'relative bg-card/85'
					}`}
				>
					<div className='flex flex-wrap items-center justify-between gap-3'>
						<div className='flex items-center gap-3'>
							<div className='flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs'>
								<Tv className='size-5' />
							</div>

							<div>
								<div className='flex items-center gap-2'>
									<h2 className='font-bold font-display text-foreground text-sm tracking-tight sm:text-base'>
										{currentMode === 'pngtuber'
											? 'Estudio PNGTuber en Navegador'
											: 'Estudio Live2D en Navegador'}
									</h2>
									<Badge variant='secondary' className='h-5 gap-1 px-1.5 font-mono text-[10px]'>
										{currentMode === 'pngtuber' ? (
											<>
												<Layers className='size-2.5 text-primary' /> PNGTuber
											</>
										) : (
											<>
												<Activity className='size-2.5 text-cyan-400' /> Live2D
											</>
										)}
									</Badge>
									{isPlayingAudio && (
										<Badge
											variant='outline'
											className='h-5 border-emerald-500/40 bg-emerald-500/10 font-mono text-[10px] text-emerald-400'
										>
											<span className='mr-1 size-1.5 animate-pulse rounded-full bg-emerald-400' />
											AUDIO ON
										</Badge>
									)}
								</div>

								<div className='mt-0.5 flex items-center gap-2 text-xs'>
									<span className='flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground'>
										<Sparkles className='size-3 text-primary' />
										<span>
											{currentMode === 'pngtuber'
												? 'Sandy Chibi Reactiva · Reactividad por Voz'
												: 'Visor WebGL Live2D'}
										</span>
									</span>
								</div>
							</div>
						</div>

						{/* Botones de acción directos */}
						<div className='flex items-center gap-2'>
							{/* Botón Overlay OBS */}
							<Button
								variant='outline'
								size='sm'
								onClick={copyOverlayUrl}
								className='h-8 gap-1.5 border-border/70 px-3 font-medium font-sans text-xs shadow-xs hover:border-primary/50'
								title='Copiar enlace de Navegador para OBS Studio'
							>
								{copied ? (
									<Check className='size-3.5 text-emerald-400' />
								) : (
									<Copy className='size-3.5 text-primary' />
								)}
								<span className='hidden sm:inline'>Overlay OBS 2D</span>
							</Button>

							{/* Botón Pantalla Completa */}
							<Button
								variant='ghost'
								size='icon'
								onClick={handleToggleFullscreen}
								className='size-8 text-muted-foreground hover:text-foreground'
								title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
							>
								{isFullscreen ? <Minimize2 className='size-4' /> : <Maximize2 className='size-4' />}
							</Button>
						</div>
					</div>
				</CardHeader>
			)}

			{/* Escenario 2D interactivo con Dock y Paneles */}
			<CardContent
				className={`relative flex flex-col p-0 ${isFullscreen ? 'h-full min-h-0 flex-1' : ''}`}
			>
				<div
					className={`relative w-full min-w-0 overflow-hidden ${
						isFullscreen ? 'h-full min-h-0 flex-1' : 'h-[560px] md:h-[620px] lg:h-[660px]'
					}`}
				>
					{/* Capa de fondo */}
					{renderBackgroundLayer()}

					{/* Renderizador activo: PNGTuber o Live2D */}
					{currentMode === 'pngtuber' ? (
						<PngTuberRenderer
							config={state.pngtuber}
							onTransformChange={(transform) => avatar2dManager.setTransform(transform, 'pngtuber')}
						/>
					) : (
						<Live2dRenderer
							config={state.live2d}
							onTransformChange={(transform) => avatar2dManager.setTransform(transform, 'live2d')}
						/>
					)}

					{/* Dock Lateral Vertical */}
					<Avatar2dStudioDock
						activeTool={activeTool}
						onToggleTool={(tool) => setActiveTool(tool)}
						isPlayingAudio={isPlayingAudio}
						isFullscreen={isFullscreen}
						onToggleFullscreen={handleToggleFullscreen}
						isHudVisible={isHudVisible}
						onToggleHud={() => setIsHudVisible(!isHudVisible)}
						hasCustomBackground={bgState.mode !== 'preset' || bgState.presetId !== 'studio'}
					/>

					{/* Paneles Flotantes Modulares dentro del Escenario */}
					<AnimatePresence>
						{activeTool && isHudVisible && (
							<>
								{activeTool === 'emotions' && (
									<Avatar2dExpressionsPanel onClose={() => setActiveTool(null)} />
								)}

								{activeTool === 'lipsync' && (
									<Avatar2dLipSyncPanel onClose={() => setActiveTool(null)} />
								)}

								{activeTool === 'background' && (
									<motion.div
										initial={{ opacity: 0, scale: 0.95, x: -10 }}
										animate={{ opacity: 1, scale: 1, x: 0 }}
										exit={{ opacity: 0, scale: 0.95, x: -10 }}
										transition={{ duration: 0.2 }}
										className='pointer-events-auto absolute top-4 left-18 z-30 max-h-[calc(100%-2rem)] overflow-y-auto'
									>
										<VrmStudioBackgroundPanel
											state={bgState}
											onChange={handleBackgroundChange}
											onClose={() => setActiveTool(null)}
										/>
									</motion.div>
								)}

								{activeTool === 'settings' && (
									<Avatar2dSettingsPanel onClose={() => setActiveTool(null)} />
								)}
							</>
						)}
					</AnimatePresence>

					{/* Zona de Drop visual mientras se arrastra un archivo */}
					<AnimatePresence>
						{isDragging && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className='pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 border-2 border-primary border-dashed bg-background/90 p-6 text-center backdrop-blur-md'
							>
								<div className='flex size-16 animate-bounce items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-lg'>
									<Upload className='size-8' />
								</div>
								<div className='max-w-md space-y-1'>
									<p className='font-display font-semibold text-base text-foreground'>
										Suelta tu archivo aquí
									</p>
									<p className='text-muted-foreground text-xs leading-relaxed'>
										Imágenes (.png, .jpg) para fondos o sprites, o paquetes de modelos
									</p>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</CardContent>
		</Card>
	);
}
