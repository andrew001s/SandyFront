'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { vrmManager } from '@/lib/avatar/vrmManager';
import { type VrmCameraPreset, VrmViewer } from '@/lib/avatar/vrmViewer';
import {
	Box,
	Camera,
	Check,
	Copy,
	ExternalLink,
	Palette,
	RefreshCw,
	RotateCcw,
	Sparkles,
	Trash2,
	Upload,
	User,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface Props {
	className?: string;
	onEmotionSelect?: (emotion: string) => void;
}

type VrmBackgroundMode = 'studio' | 'checker' | 'chroma';

export function VrmCanvas({ className = '' }: Props) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const viewerRef = useRef<VrmViewer | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const [fps, setFps] = useState<number>(60);
	const [modelMeta, setModelMeta] = useState(vrmManager.getMeta());
	const [isDragging, setIsDragging] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [cameraPreset, setCameraPreset] = useState<VrmCameraPreset>('face');
	const [bgMode, setBgMode] = useState<VrmBackgroundMode>('studio');
	const [copied, setCopied] = useState(false);

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

		const handleResize = () => {
			if (canvas.parentElement) {
				viewer.resize(canvas.parentElement.clientWidth, canvas.parentElement.clientHeight || 560);
			}
		};

		window.addEventListener('resize', handleResize);
		handleResize();

		const unsubscribeMeta = vrmManager.subscribe(() => {
			setModelMeta(vrmManager.getMeta());
		});

		return () => {
			window.removeEventListener('resize', handleResize);
			unregisterFps();
			unregisterViewer();
			unsubscribeMeta();
			viewer.dispose();
			viewerRef.current = null;
		};
	}, []);

	const handleFileUpload = async (file: File) => {
		if (!file.name.toLowerCase().endsWith('.vrm')) {
			toast.error('Por favor selecciona un archivo con formato .vrm');
			return;
		}

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
		viewerRef.current?.setCameraPreset(preset);
	};

	const copyOverlayUrl = () => {
		if (typeof window === 'undefined') return;
		const url = `${window.location.origin}/overlay/avatar`;
		void navigator.clipboard.writeText(url);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
		toast.success(`URL de OBS copiada: ${url}`);
	};

	const cycleBackground = () => {
		const next: Record<VrmBackgroundMode, VrmBackgroundMode> = {
			studio: 'checker',
			checker: 'chroma',
			chroma: 'studio',
		};
		const nextMode = next[bgMode];
		setBgMode(nextMode);
		const labels: Record<VrmBackgroundMode, string> = {
			studio: 'Fondo Estudio Oscuro',
			checker: 'Fondo Transparente (Cuadrícula)',
			chroma: 'Fondo Croma Verde (#00FF00)',
		};
		toast.info(labels[nextMode]);
	};

	const getBackgroundClass = () => {
		switch (bgMode) {
			case 'studio':
				return 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-zinc-950 to-black';
			case 'checker':
				return 'bg-[repeating-conic-gradient(#27272a_0%_25%,#18181b_0%_50%)] bg-[size:24px_24px]';
			case 'chroma':
				return 'bg-[#00FF00]';
		}
	};

	return (
		<Card
			className={`flex w-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-md ${className}`}
			onDragOver={(e) => {
				e.preventDefault();
				setIsDragging(true);
			}}
			onDragLeave={() => setIsDragging(false)}
			onDrop={handleDrop}
		>
			{/* Encabezado HUD superior (Estilo VTuber Studio) */}
			<CardHeader className='border-border/60 border-b bg-card/75 px-5 py-3 backdrop-blur-md'>
				<div className='flex flex-wrap items-center justify-between gap-3'>
					{/* Estado del Modelo y Branding */}
					<div className='flex min-w-0 items-center gap-3'>
						<div className='rounded-xl bg-secondary/15 p-2.5 text-secondary shadow-xs'>
							<Box className='size-5' />
						</div>
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

					{/* Botones de acción directos */}
					<div className='flex items-center gap-2'>
						{/* Botón Overlay OBS */}
						<Button
							variant='outline'
							size='sm'
							onClick={copyOverlayUrl}
							className='h-8.5 gap-1.5 border-border/70 px-3 font-medium font-sans text-xs shadow-xs hover:border-primary/50'
							title='Copiar enlace de Navegador para OBS Studio'
						>
							{copied ? (
								<Check className='size-3.5 text-emerald-400' />
							) : (
								<Copy className='size-3.5 text-primary' />
							)}
							<span>Overlay OBS</span>
						</Button>

						{/* Botón Cargar / Cambiar Avatar */}
						<Button
							variant='secondary'
							size='sm'
							onClick={() => fileInputRef.current?.click()}
							disabled={isLoading}
							className='h-8.5 gap-1.5 px-3 font-medium font-sans text-xs shadow-xs'
							title='Cargar o reemplazar avatar .vrm'
						>
							<Upload className='size-3.5' />
							<span>{modelMeta ? 'Cambiar Avatar' : 'Cargar Avatar .VRM'}</span>
						</Button>

						{/* Quitar Modelo */}
						{modelMeta && (
							<Button
								variant='ghost'
								size='icon'
								onClick={() => void vrmManager.removeModel()}
								className='h-8.5 w-8.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
								title='Quitar avatar actual'
							>
								<Trash2 className='size-4' />
							</Button>
						)}
					</div>
				</div>
			</CardHeader>

			{/* Escenario 3D a pantalla ancha (Full-Width Viewport) */}
			<CardContent className='relative p-0'>
				<div
					className={`relative h-[560px] w-full min-w-0 transition-all duration-300 md:h-[620px] ${getBackgroundClass()}`}
				>
					<canvas
						ref={canvasRef}
						className='block h-full w-full cursor-grab active:cursor-grabbing'
					/>

					{/* HUD Flotante de Controles Rápidos (Estilo VTube Studio / VNyan) */}
					<div className='absolute right-4 bottom-4 z-10 flex flex-wrap items-center gap-1.5 rounded-full border border-border/80 bg-background/90 p-1.5 shadow-2xl backdrop-blur-md'>
						{/* Selector de Encuadre */}
						<div className='flex items-center gap-1 px-2 font-mono text-[11px] text-muted-foreground'>
							<Camera className='size-3.5 text-secondary' />
							<span className='hidden sm:inline'>Cámara:</span>
						</div>

						<button
							type='button'
							onClick={() => handleCameraChange('face')}
							className={`rounded-full px-3 py-1 font-medium font-sans text-xs transition-all ${
								cameraPreset === 'face'
									? 'bg-secondary text-secondary-foreground shadow-xs'
									: 'text-muted-foreground hover:bg-muted hover:text-foreground'
							}`}
						>
							Rostro
						</button>
						<button
							type='button'
							onClick={() => handleCameraChange('upperBody')}
							className={`rounded-full px-3 py-1 font-medium font-sans text-xs transition-all ${
								cameraPreset === 'upperBody'
									? 'bg-secondary text-secondary-foreground shadow-xs'
									: 'text-muted-foreground hover:bg-muted hover:text-foreground'
							}`}
						>
							Busto
						</button>
						<button
							type='button'
							onClick={() => handleCameraChange('fullBody')}
							className={`rounded-full px-3 py-1 font-medium font-sans text-xs transition-all ${
								cameraPreset === 'fullBody'
									? 'bg-secondary text-secondary-foreground shadow-xs'
									: 'text-muted-foreground hover:bg-muted hover:text-foreground'
							}`}
						>
							Entero
						</button>

						<div className='mx-1 h-4 w-px bg-border/80' />

						{/* Botón de Fondo Activo (Cambia entre Estudio, Transparente y Croma) */}
						<button
							type='button'
							onClick={cycleBackground}
							className='flex items-center gap-1.5 rounded-full px-3 py-1 font-medium font-sans text-muted-foreground text-xs transition-colors hover:bg-muted hover:text-foreground'
							title={`Fondo actual: ${bgMode}. Clic para cambiar (Estudio / Transparente / Croma Verde)`}
						>
							<Palette className='size-3.5 text-primary' />
							<span className='capitalize'>
								{bgMode === 'studio'
									? 'Estudio'
									: bgMode === 'checker'
										? 'Transparente'
										: 'Croma Verde'}
							</span>
						</button>

						<button
							type='button'
							onClick={() => handleCameraChange(cameraPreset)}
							className='flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
							title='Centrar cámara'
						>
							<RotateCcw className='size-3.5' />
						</button>
					</div>

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
									{isDragging ? 'Suelta tu avatar .VRM aquí' : 'Carga tu avatar 3D (.vrm)'}
								</p>
								<p className='text-muted-foreground text-xs leading-relaxed'>
									Arrastra y suelta tu archivo de VRoid Studio o Booth, o haz clic para
									seleccionarlo. Se guardará automáticamente en tu navegador.
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
						accept='.vrm'
						className='hidden'
						onChange={(e) => {
							const file = e.target.files?.[0];
							if (file) void handleFileUpload(file);
						}}
					/>
				</div>
			</CardContent>

			{/* Pie informativo claro de navegación 3D */}
			<CardFooter className='flex flex-wrap items-center justify-between gap-3 border-border/60 border-t bg-card/50 px-5 py-2.5 text-xs'>
				<span className='font-mono text-[11px] text-muted-foreground'>
					Rotar: Clic izquierdo arrastrar · Zoom: Rueda ratón · Desplazar: Clic derecho arrastrar
				</span>
				<div className='flex items-center gap-3'>
					<a
						href='/overlay/avatar'
						target='_blank'
						rel='noopener noreferrer'
						className='flex items-center gap-1.5 font-medium text-secondary text-xs hover:underline'
					>
						<ExternalLink className='size-3.5' /> Abrir Overlay OBS en ventana independiente
					</a>
				</div>
			</CardFooter>
		</Card>
	);
}

export default VrmCanvas;
