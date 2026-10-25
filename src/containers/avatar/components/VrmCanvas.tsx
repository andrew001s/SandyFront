'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
	type StudioActiveTool,
	StudioDock,
} from '@/containers/avatar/components/common/StudioDock';
import { VrmStudioBackgroundPanel } from '@/containers/avatar/components/vrm/VrmStudioBackgroundPanel';
import { VrmStudioCameraPanel } from '@/containers/avatar/components/vrm/VrmStudioCameraPanel';
import { VrmStudioExpressionsPanel } from '@/containers/avatar/components/vrm/VrmStudioExpressionsPanel';
import { VrmStudioIdlePanel } from '@/containers/avatar/components/vrm/VrmStudioIdlePanel';
import { VrmStudioLipSyncPanel } from '@/containers/avatar/components/vrm/VrmStudioLipSyncPanel';
import { VrmStudioModelPanel } from '@/containers/avatar/components/vrm/VrmStudioModelPanel';
import { VrmStudioTriggersPanel } from '@/containers/avatar/components/vrm/VrmStudioTriggersPanel';
import { AudioQueueManager } from '@/lib/audioQueueSingleton';
import {
	DEFAULT_VRM_BACKGROUND_STATE,
	VRM_BACKGROUND_PRESETS,
	type VrmBackgroundState,
	fileToDataUrl,
	getStoredBackgroundState,
	storeBackgroundState,
} from '@/lib/avatar/vrmBackground';
import { vrmManager } from '@/lib/avatar/vrmManager';
import { type VrmCameraPreset, VrmViewer } from '@/lib/avatar/vrmViewer';
import { AnimatePresence, motion } from 'framer-motion';
import {
	Box,
	Check,
	Copy,
	Maximize2,
	Minimize2,
	RefreshCw,
	Sparkles,
	Upload,
	User,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import AvatarFooter from './AvatarFooter';

interface Props {
	className?: string;
	onEmotionSelect?: (emotion: string) => void;
}

export function VrmCanvas({ className = '' }: Props) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const viewportRef = useRef<HTMLDivElement | null>(null);
	const viewerRef = useRef<VrmViewer | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const [fps, setFps] = useState<number>(60);
	const [modelMeta, setModelMeta] = useState(vrmManager.getMeta());
	const [isDragging, setIsDragging] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [cameraPreset, setCameraPreset] = useState<VrmCameraPreset>('face');
	const [copied, setCopied] = useState(false);

	// Estado de la suite VTube Studio / VNyan
	const [activeTool, setActiveTool] = useState<StudioActiveTool>(null);
	const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
	const [isHudVisible, setIsHudVisible] = useState<boolean>(true);
	const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

	// Estado avanzado del Fondo (Color sólido, Presets, Imagen propia)
	const [bgState, setBgState] = useState<VrmBackgroundState>(DEFAULT_VRM_BACKGROUND_STATE);

	// Cargar configuración guardada del fondo al montar y sincronizar con vrmManager
	useEffect(() => {
		const stored = getStoredBackgroundState();
		setBgState(stored);
		vrmManager.setBackground(stored);

		const unregisterBg = vrmManager.subscribeBackground((next) => {
			setBgState(next);
		});
		return () => unregisterBg();
	}, []);

	// Suscribirse al reproductor de audio global
	useEffect(() => {
		const manager = AudioQueueManager.getInstance();
		const unsubscribe = manager.subscribe((playing) => {
			setIsPlayingAudio(playing);
		});
		return () => unsubscribe();
	}, []);

	// Montar y gestionar el renderizador WebGL
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const viewer = new VrmViewer({
			canvas,
			transparent: true,
		});
		viewerRef.current = viewer;

		const unregisterFps = viewer.onFpsUpdate((val) => setFps(val));
		const unregisterViewer = vrmManager.registerViewer(viewer);
		const unregisterCamera = viewer.onCameraChange((transform) => {
			vrmManager.setCameraTransform(transform);
		});

		const unsubscribeMeta = vrmManager.subscribe(() => {
			setModelMeta(vrmManager.getMeta());
		});

		return () => {
			unregisterFps();
			unregisterViewer();
			unregisterCamera();
			unsubscribeMeta();
			viewer.dispose();
			viewerRef.current = null;
		};
	}, []);

	// Observador de dimensiones exactas del viewport (elimina cualquier estiramiento en fullscreen o al ocultar HUD)
	useEffect(() => {
		const viewport = viewportRef.current;
		if (!viewport) return;

		const handleResize = (width: number, height: number) => {
			if (width > 0 && height > 0 && viewerRef.current) {
				viewerRef.current.resize(width, height);
			}
		};

		const ro = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const { width, height } = entry.contentRect;
				handleResize(width, height);
			}
		});

		ro.observe(viewport);
		handleResize(viewport.clientWidth, viewport.clientHeight);

		return () => ro.disconnect();
	}, []);

	// Escuchar cambios de pantalla completa del navegador (incluyendo tecla Escape)
	useEffect(() => {
		const handleFullscreenChange = () => {
			const isFs = Boolean(document.fullscreenElement);
			setIsFullscreen(isFs);
			setTimeout(() => {
				const viewport = viewportRef.current;
				if (viewport && viewerRef.current) {
					viewerRef.current.resize(viewport.clientWidth, viewport.clientHeight);
				}
			}, 50);
		};

		document.addEventListener('fullscreenchange', handleFullscreenChange);
		return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
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

	const handleBackgroundChange = (next: VrmBackgroundState) => {
		setBgState(next);
		storeBackgroundState(next);
		vrmManager.setBackground(next);
	};

	const handleFileUpload = async (file: File) => {
		// Detección inteligente: archivo .vrm o imagen de fondo
		if (file.name.toLowerCase().endsWith('.vrm')) {
			setIsLoading(true);
			const toastId = toast.loading(`Cargando modelo VRM: ${file.name}...`);
			try {
				await vrmManager.loadModelFile(file);
				toast.success(`Avatar "${file.name}" cargado con éxito`, { id: toastId });
			} catch (err) {
				const msg = err instanceof Error ? err.message : 'Error al cargar el avatar VRM';
				toast.error(msg, { id: toastId });
			} finally {
				setIsLoading(false);
			}
			return;
		}

		if (file.type.startsWith('image/')) {
			try {
				toast.loading('Cargando imagen como fondo del estudio...', { id: 'drop-bg' });
				const dataUrl = await fileToDataUrl(file);
				const nextState: VrmBackgroundState = {
					...bgState,
					mode: 'image',
					imageUrl: dataUrl,
					imageName: file.name,
				};
				handleBackgroundChange(nextState);
				setActiveTool('background');
				toast.success(`Fondo actualizado con "${file.name}"`, { id: 'drop-bg' });
			} catch {
				toast.error('Error al procesar la imagen de fondo', { id: 'drop-bg' });
			}
			return;
		}

		toast.error('Formato no compatible. Arrastra un modelo .vrm o una imagen .png/.jpg');
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		const file = e.dataTransfer.files?.[0];
		if (file) {
			void handleFileUpload(file);
		}
	};

	const handleCameraChange = (preset: VrmCameraPreset) => {
		setCameraPreset(preset);
		vrmManager.setCameraPreset(preset);
	};

	const copyOverlayUrl = () => {
		if (typeof window === 'undefined') return;
		const url = `${window.location.origin}/overlay/avatar`;
		void navigator.clipboard.writeText(url);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
		toast.success(`URL de OBS copiada: ${url}`);
	};

	// Generar estilos visuales del fondo
	const renderBackgroundLayer = () => {
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
							transform: bgState.imageBlur > 0 ? 'scale(1.04)' : undefined, // evita bordes blancos al desenfocar
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

		// Presets
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
			className={`relative flex w-full flex-col overflow-hidden bg-card shadow-2xl ${
				isFullscreen
					? 'fixed inset-0 z-50 h-screen w-screen rounded-none border-0'
					: 'rounded-2xl border border-border/80 transition-shadow duration-300'
			} ${className}`}
			onDragOver={(e) => {
				e.preventDefault();
				setIsDragging(true);
			}}
			onDragLeave={() => setIsDragging(false)}
			onDrop={handleDrop}
		>
			{/* Encabezado HUD superior (Flotante en fullscreen para no redimensionar el canvas) */}
			{isHudVisible && (
				<CardHeader
					className={`z-20 backdrop-blur-xl transition-all ${
						isFullscreen
							? 'pointer-events-auto absolute top-3 right-20 left-4 rounded-2xl border border-border/80 bg-background/85 px-4 py-2 shadow-2xl'
							: 'relative shrink-0 border-border/60 border-b bg-card/85 px-4 py-2.5 sm:px-5'
					}`}
				>
					<div className='flex flex-wrap items-center justify-between gap-3'>
						{/* Estado del Modelo y Branding */}
						<div className='flex min-w-0 items-center gap-3'>
							<button
								type='button'
								onClick={() => setActiveTool(activeTool === 'model' ? null : 'model')}
								className='flex size-9 items-center justify-center rounded-xl bg-secondary/15 text-secondary shadow-xs transition-transform hover:scale-105'
								title='Ver detalles del avatar'
							>
								<Box className='size-5' />
							</button>

							<div className='min-w-0'>
								<div className='flex flex-wrap items-center gap-2'>
									<span className='font-bold font-display text-foreground text-sm tracking-tight sm:text-base'>
										Sandy Studio 3D (VRM)
									</span>
									<Badge
										variant='outline'
										className='h-5 border-emerald-500/30 bg-emerald-500/10 px-2 font-mono text-[10px] text-emerald-400'
									>
										<span className='mr-1.5 size-1.5 animate-pulse rounded-full bg-emerald-400' />
										{fps} FPS
									</Badge>
									{isPlayingAudio && (
										<Badge
											variant='outline'
											className='h-5 border-primary/40 bg-primary/10 px-2 font-mono text-[10px] text-primary'
										>
											<span className='mr-1.5 size-1.5 animate-ping rounded-full bg-primary' />
											AUDIO ON
										</Badge>
									)}
								</div>

								<div className='mt-0.5 flex items-center gap-2 text-xs'>
									{modelMeta ? (
										<span
											className='flex max-w-[240px] items-center gap-1.5 truncate font-mono text-[11px] text-muted-foreground sm:max-w-md'
											title={modelMeta.name}
										>
											<Sparkles className='size-3 shrink-0 text-secondary' />
											<span className='truncate font-medium text-foreground'>{modelMeta.name}</span>
											<span className='text-muted-foreground/60'>· VRM en memoria</span>
										</span>
									) : (
										<span className='font-sans text-[11px] text-muted-foreground'>
											Sin avatar cargado · Arrastra tu archivo .vrm
										</span>
									)}
								</div>
							</div>
						</div>

						{/* Botones de acción directos superiores */}
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
								<span className='hidden sm:inline'>Overlay OBS</span>
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

			{/* Escenario 3D Interactivo con Dock y Paneles Flotantes (VTube Studio / VNyan Style) */}
			<CardContent
				className={`relative flex flex-col p-0 ${
					isFullscreen ? 'absolute inset-0 h-full w-full' : ''
				}`}
			>
				<div
					ref={viewportRef}
					className={`relative w-full min-w-0 overflow-hidden ${
						isFullscreen ? 'h-full flex-1' : 'h-[560px] md:h-[620px] lg:h-[660px]'
					}`}
				>
					{/* Capa de Fondo (Presets / Color / Imagen) */}
					{renderBackgroundLayer()}

					{/* Canvas WebGL Three.js a 60 FPS */}
					<canvas
						ref={canvasRef}
						className='relative z-10 block h-full w-full cursor-grab active:cursor-grabbing'
					/>

					{/* Dock Lateral Vertical (Estilo VTube Studio / VNyan) */}
					<StudioDock
						mode='vrm'
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
							<motion.div
								initial={{ opacity: 0, x: 20, scale: 0.96 }}
								animate={{ opacity: 1, x: 0, scale: 1 }}
								exit={{ opacity: 0, x: 20, scale: 0.96 }}
								transition={{ duration: 0.2, ease: 'easeOut' }}
								className='absolute top-4 right-20 z-30 max-h-[calc(100%-2rem)] overflow-y-auto'
							>
								{activeTool === 'expressions' && (
									<VrmStudioExpressionsPanel onClose={() => setActiveTool(null)} />
								)}

								{activeTool === 'idle' && (
									<VrmStudioIdlePanel onClose={() => setActiveTool(null)} />
								)}

								{activeTool === 'lipsync' && (
									<VrmStudioLipSyncPanel onClose={() => setActiveTool(null)} />
								)}

								{activeTool === 'background' && (
									<VrmStudioBackgroundPanel
										state={bgState}
										onChange={handleBackgroundChange}
										onClose={() => setActiveTool(null)}
									/>
								)}

								{activeTool === 'camera' && (
									<VrmStudioCameraPanel
										currentPreset={cameraPreset}
										onSelectPreset={handleCameraChange}
										onClose={() => setActiveTool(null)}
									/>
								)}

								{activeTool === 'model' && (
									<VrmStudioModelPanel
										modelMeta={modelMeta}
										onUploadClick={() => fileInputRef.current?.click()}
										onClose={() => setActiveTool(null)}
									/>
								)}

								{activeTool === 'triggers' && (
									<VrmStudioTriggersPanel onClose={() => setActiveTool(null)} />
								)}
							</motion.div>
						)}
					</AnimatePresence>

					{/* Zona de Drop / Carga cuando no hay modelo o mientras se arrastra */}
					{(!modelMeta || isDragging) && (
						<button
							type='button'
							onClick={() => fileInputRef.current?.click()}
							className={`absolute inset-0 z-20 flex cursor-pointer flex-col items-center justify-center gap-4 p-6 text-center transition-all ${
								isDragging
									? 'border-2 border-secondary border-dashed bg-secondary/20 backdrop-blur-md'
									: 'bg-background/85 backdrop-blur-md hover:bg-background/80'
							}`}
						>
							<div className='rounded-3xl border border-secondary/30 bg-secondary/10 p-5 text-secondary shadow-lg'>
								<Upload className='size-10 animate-bounce' />
							</div>
							<div className='max-w-md space-y-1.5'>
								<p className='font-display font-semibold text-base text-foreground'>
									{isDragging
										? 'Suelta tu archivo .VRM o imagen aquí'
										: 'Carga tu avatar 3D (.vrm)'}
								</p>
								<p className='text-muted-foreground text-xs leading-relaxed'>
									Arrastra tu modelo .vrm o haz clic para seleccionarlo. También puedes arrastrar
									imágenes para usarlas de fondo.
								</p>
							</div>
							<span
								className={`inline-flex h-9 items-center gap-2 rounded-xl bg-secondary px-4 font-medium text-secondary-foreground text-xs shadow-md transition-transform hover:scale-[1.02] ${
									isLoading ? 'pointer-events-none opacity-60' : ''
								}`}
							>
								{isLoading ? (
									<>
										<RefreshCw className='size-4 animate-spin' /> Cargando modelo...
									</>
								) : (
									<>
										<User className='size-4' /> Seleccionar archivo .vrm
									</>
								)}
							</span>
						</button>
					)}

					<input
						ref={fileInputRef}
						type='file'
						accept='.vrm,image/*'
						className='hidden'
						onChange={(e) => {
							const file = e.target.files?.[0];
							if (file) void handleFileUpload(file);
						}}
					/>
				</div>
			</CardContent>
			<AvatarFooter isHudVisible={isHudVisible} isFullscreen={isFullscreen} />
		</Card>
	);
}

export default VrmCanvas;
