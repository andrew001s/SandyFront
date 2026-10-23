'use client';

import { avatar2dManager } from '@/lib/avatar2d/avatar2dManager';
import { type Live2dPackage, live2dStore } from '@/lib/avatar2d/live2dStore';
import { unpackLive2dZip } from '@/lib/avatar2d/live2dZipLoader';
import type { Avatar2dTransform, Live2dConfig } from '@/lib/avatar2d/types';
import {
	AlertCircle,
	Focus,
	Loader2,
	Maximize,
	RotateCcw,
	Sparkles,
	Upload,
	UserCheck,
	ZoomIn,
	ZoomOut,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface Props {
	config: Live2dConfig;
	onTransformChange?: (transform: Avatar2dTransform) => void;
	interactive?: boolean;
}

// Asegurar que Live2D Cubism Core esté cargado en window antes de importar la librería de Pixi
async function ensureCubismCore(): Promise<void> {
	if (typeof window === 'undefined') return;
	if ((window as unknown as { Live2DCubismCore?: unknown }).Live2DCubismCore) return;

	return new Promise((resolve, reject) => {
		const existing = document.querySelector('script[src*="live2dcubismcore"]');
		if (existing) {
			existing.addEventListener('load', () => resolve());
			existing.addEventListener('error', () =>
				reject(new Error('Error al cargar Live2D Cubism Core.')),
			);
			return;
		}

		const script = document.createElement('script');
		script.src = '/live2d/live2dcubismcore.min.js';
		script.async = true;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error('No se pudo cargar el motor Live2D Cubism Core.'));
		document.head.appendChild(script);
	});
}

export function Live2dRenderer({ config, onTransformChange, interactive = true }: Props) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	// biome-ignore lint/suspicious/noExplicitAny: dynamic Pixi application instance
	const appRef = useRef<any>(null);
	// biome-ignore lint/suspicious/noExplicitAny: dynamic Live2D model instance
	const modelRef = useRef<any>(null);
	const visualBoundsRef = useRef<{ x: number; y: number; width: number; height: number } | null>(
		null,
	);

	const [pkg, setPkg] = useState<Live2dPackage | null>(live2dStore.getPackage());
	const [isSpeaking, setIsSpeaking] = useState(avatar2dManager.getIsSpeaking());
	const [isLoading, setIsLoading] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);

	const [dragPosition, setDragPosition] = useState({
		x: config.transform.x || 0,
		y: config.transform.y || 0,
	});
	const [scale, setScale] = useState(config.transform.scale || 1);

	// Control de arrastre
	const isDraggingRef = useRef(false);
	const dragStartRef = useRef({
		startX: 0,
		startY: 0,
		initialX: 0,
		initialY: 0,
	});

	// Suscribirse al store de Live2DPackage en memoria
	useEffect(() => {
		const unsub = live2dStore.subscribe((nextPkg) => {
			setPkg(nextPkg);
		});
		return () => unsub();
	}, []);

	// Suscribirse a la detección de voz para lip sync
	useEffect(() => {
		const unsub = avatar2dManager.subscribeSpeaking((speaking) => {
			setIsSpeaking(speaking);
		});
		return () => unsub();
	}, []);

	// Sincronizar transformación externa
	useEffect(() => {
		setDragPosition({ x: config.transform.x || 0, y: config.transform.y || 0 });
		setScale(config.transform.scale || 1);
	}, [config.transform.x, config.transform.y, config.transform.scale]);

	// Función centralizada para aplicar escala y posición con centrado matemático perfecto
	const applyModelTransform = useCallback(
		(overrideX?: number, overrideY?: number, overrideScale?: number) => {
			const model = modelRef.current;
			const app = appRef.current;
			const bounds = visualBoundsRef.current;
			if (!model || !app || !bounds) return;

			const curX = overrideX !== undefined ? overrideX : dragPosition.x;
			const curY = overrideY !== undefined ? overrideY : dragPosition.y;
			const curScale = overrideScale !== undefined ? overrideScale : scale;

			const screenW = app.screen.width;
			const screenH = app.screen.height;

			if (screenW <= 0 || screenH <= 0 || bounds.width <= 0 || bounds.height <= 0) return;

			// Margen de seguridad del 6% para que el modelo nunca se corte en los bordes
			const marginX = screenW * 0.06;
			const marginY = screenH * 0.06;
			const availW = Math.max(80, screenW - marginX * 2);
			const availH = Math.max(80, screenH - marginY * 2);

			const baseFitScale = Math.min(availW / bounds.width, availH / bounds.height);
			const effectiveScale = Math.max(0.0001, baseFitScale * curScale);

			model.scale.set(effectiveScale);

			// Centro del viewport
			const screenCenterX = screenW / 2;
			const screenCenterY = screenH / 2;

			// Centro visual del modelo en su espacio de coordenadas locales
			const modelCenterX = bounds.x + bounds.width / 2;
			const modelCenterY = bounds.y + bounds.height / 2;

			// Posicionar el modelo para que el centro visual coincida exactamente con el centro del viewport + desplazamiento del usuario
			model.x = screenCenterX + curX - modelCenterX * effectiveScale;
			model.y = screenCenterY + curY - modelCenterY * effectiveScale;
		},
		[dragPosition.x, dragPosition.y, scale],
	);

	// Actualizar modelo cuando cambian dragPosition o scale
	useEffect(() => {
		applyModelTransform();
	}, [applyModelTransform]);

	// Inicializar PixiJS y compilar el modelo Live2D WebGL
	useEffect(() => {
		let isMounted = true;

		async function initLive2D() {
			if (!canvasRef.current || !containerRef.current || !pkg) {
				return;
			}

			setIsLoading(true);
			setLoadError(null);

			try {
				await ensureCubismCore();
				if (!isMounted) return;

				const PIXI = await import('pixi.js');
				const { Live2DModel, Live2DFactory } = await import('pixi-live2d-display/cubism4');

				try {
					Live2DModel.registerTicker(PIXI.Ticker);
				} catch {
					// Ya registrado
				}

				if (!isMounted) return;

				const rect = containerRef.current.getBoundingClientRect();
				const initialW = Math.max(300, Math.floor(rect.width || 800));
				const initialH = Math.max(300, Math.floor(rect.height || 600));

				let app = appRef.current;
				if (!app) {
					app = new PIXI.Application({
						view: canvasRef.current,
						width: initialW,
						height: initialH,
						backgroundAlpha: 0,
						autoDensity: true,
						resolution: Math.min(window.devicePixelRatio || 1, 2),
						antialias: true,
					});
					appRef.current = app;
				} else if (app.renderer) {
					app.renderer.resize(initialW, initialH);
				}

				// Destruir modelo previo si existía
				if (modelRef.current) {
					try {
						app.stage.removeChild(modelRef.current);
						modelRef.current.destroy();
					} catch {
						// Ignorar
					}
					modelRef.current = null;
				}

				// Obtener el runtime correspondiente e instanciar ModelSettings
				const runtime = Live2DFactory.findRuntime(pkg.modelSettingsJson);
				if (!runtime) {
					throw new Error(
						'No se pudo encontrar el motor Cubism adecuado para este modelo .model3.json.',
					);
				}

				const settings = runtime.createModelSettings(pkg.modelSettingsJson);

				// Reemplazar la función resolveURL para alimentar los recursos desde el mapa de Blob URLs
				settings.resolveURL = (path: string) => {
					const norm = path.replace(/\\/g, '/').replace(/^\.?\//, '');
					if (pkg.fileMap[norm]) return pkg.fileMap[norm];

					const fname = norm.split('/').pop() || norm;
					if (pkg.fileMap[fname]) return pkg.fileMap[fname];

					for (const [k, v] of Object.entries(pkg.fileMap)) {
						if (k.endsWith(`/${fname}`)) return v;
					}

					return path;
				};

				// Cargar modelo pasando la instancia de ModelSettings directamente
				const model = await Live2DModel.from(settings, {
					autoInteract: false,
				});

				if (!isMounted) {
					model.destroy();
					return;
				}

				// Mantener ancla en (0,0) para calcular límites visuales reales
				try {
					model.anchor?.set?.(0, 0);
				} catch {
					// Ignorar si no soporta anchor
				}

				// Calcular caja delimitadora visual real (AABB) de todos los drawables
				let bounds = {
					x: 0,
					y: 0,
					width: model.width || 800,
					height: model.height || 900,
				};

				try {
					const lb = model.getLocalBounds();
					if (lb && lb.width > 20 && lb.height > 20) {
						bounds = {
							x: lb.x,
							y: lb.y,
							width: lb.width,
							height: lb.height,
						};
					}
				} catch {
					// Fallback a layout predeterminado de Live2D
				}

				visualBoundsRef.current = bounds;
				app.stage.addChild(model);
				modelRef.current = model;

				// Aplicar transformación inicial centrada
				applyModelTransform(dragPosition.x, dragPosition.y, scale);
				setIsLoading(false);
			} catch (err) {
				if (!isMounted) return;
				console.error('Error al inicializar Live2D WebGL:', err);
				setLoadError(
					err instanceof Error ? err.message : 'Error al cargar el modelo Live2D en WebGL.',
				);
				setIsLoading(false);
			}
		}

		void initLive2D();

		return () => {
			isMounted = false;
		};
	}, [pkg]);

	// Observador de Redimensión: adaptar el canvas dinámicamente al contenedor en tiempo real
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const ro = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const { width, height } = entry.contentRect;
				if (width > 50 && height > 50) {
					const app = appRef.current;
					if (app?.renderer) {
						app.renderer.resize(Math.floor(width), Math.floor(height));
						applyModelTransform();
					}
				}
			}
		});

		ro.observe(container);
		return () => ro.disconnect();
	}, [applyModelTransform]);

	// Animar el habla (Lip Sync) en cada frame del modelo
	useEffect(() => {
		const app = appRef.current;
		if (!app) return;

		let frameId: number;
		const animateLipSync = () => {
			const model = modelRef.current;
			if (model?.internalModel?.coreModel) {
				const core = model.internalModel.coreModel;
				try {
					if (isSpeaking) {
						const mouthValue = 0.35 + Math.sin(Date.now() / 90) * 0.45;
						core.setParameterValueById?.('ParamMouthOpenY', mouthValue);
					} else {
						core.setParameterValueById?.('ParamMouthOpenY', 0);
					}
				} catch {
					// Parámetro no soportado en este modelo
				}
			}
			frameId = requestAnimationFrame(animateLipSync);
		};

		frameId = requestAnimationFrame(animateLipSync);
		return () => cancelAnimationFrame(frameId);
	}, [isSpeaking]);

	// Seguimiento de cursor (Eye tracking) y Arrastre del Modelo
	const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!interactive || !modelRef.current) return;
		if (e.button !== 0) return; // Solo clic izquierdo o toque principal

		isDraggingRef.current = true;
		dragStartRef.current = {
			startX: e.clientX,
			startY: e.clientY,
			initialX: dragPosition.x,
			initialY: dragPosition.y,
		};

		try {
			e.currentTarget.setPointerCapture(e.pointerId);
		} catch {
			// Ignorar si el navegador no soporta pointer capture
		}
	};

	const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
		// 1. Manejo de arrastre (pan)
		if (isDraggingRef.current) {
			const dx = e.clientX - dragStartRef.current.startX;
			const dy = e.clientY - dragStartRef.current.startY;
			const nextX = dragStartRef.current.initialX + dx;
			const nextY = dragStartRef.current.initialY + dy;

			setDragPosition({ x: nextX, y: nextY });
			applyModelTransform(nextX, nextY, scale);
			return;
		}

		// 2. Seguimiento de ojos / cabeza cuando no se está arrastrando
		if (!interactive || !config.eyeTracking || !modelRef.current) return;
		const rect = e.currentTarget.getBoundingClientRect();
		const normX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
		const normY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

		try {
			const model = modelRef.current;
			if (model.internalModel?.focus) {
				model.internalModel.focus(normX, -normY);
			}
		} catch {
			// Ignorar
		}
	};

	const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
		if (isDraggingRef.current) {
			isDraggingRef.current = false;
			try {
				e.currentTarget.releasePointerCapture(e.pointerId);
			} catch {
				// Ignorar
			}
			onTransformChange?.({
				x: dragPosition.x,
				y: dragPosition.y,
				scale,
				rotation: 0,
			});
		}
	};

	// Zoom fluido con rueda del ratón SIN que haga scroll la página entera
	const dragPositionRef = useRef(dragPosition);
	dragPositionRef.current = dragPosition;

	const scaleRef = useRef(scale);
	scaleRef.current = scale;

	useEffect(() => {
		const container = containerRef.current;
		if (!container || !interactive) return;

		const onWheel = (e: WheelEvent) => {
			if (!modelRef.current) return;
			// Evitar que la página web se desplace verticalmente
			e.preventDefault();
			e.stopPropagation();

			const factor = e.deltaY < 0 ? 1.08 : 0.92;
			const currentScale = scaleRef.current;
			const nextScale = Math.min(Math.max(currentScale * factor, 0.35), 4.5);
			const currentPos = dragPositionRef.current;

			setScale(nextScale);
			applyModelTransform(currentPos.x, currentPos.y, nextScale);
			onTransformChange?.({
				x: currentPos.x,
				y: currentPos.y,
				scale: nextScale,
				rotation: 0,
			});
		};

		container.addEventListener('wheel', onWheel, { passive: false });
		return () => {
			container.removeEventListener('wheel', onWheel);
		};
	}, [interactive, applyModelTransform, onTransformChange]);

	// Ajustes de encuadre predefinidos (Cuerpo Completo, Busto, Rostro)
	const applyFramingPreset = (preset: 'fit' | 'bust' | 'face') => {
		const app = appRef.current;
		const screenH = app?.screen?.height || 600;

		let newScale = 1;
		let newX = 0;
		let newY = 0;

		if (preset === 'fit') {
			// Cuerpo Completo: escala base ajustada 100%, centrada con margen
			newScale = 1;
			newX = 0;
			newY = 0;
		} else if (preset === 'bust') {
			// Busto / Webcam de Streaming: aumento 1.85x y encuadre de torso y cabeza
			newScale = 1.85;
			newX = 0;
			newY = screenH * 0.32;
		} else if (preset === 'face') {
			// Rostro / Primer Plano: aumento 2.8x para calibración de expresiones
			newScale = 2.8;
			newX = 0;
			newY = screenH * 0.62;
		}

		setDragPosition({ x: newX, y: newY });
		setScale(newScale);
		applyModelTransform(newX, newY, newScale);
		onTransformChange?.({ x: newX, y: newY, scale: newScale, rotation: 0 });
	};

	const handleZoomStep = (delta: number) => {
		const nextScale = Math.min(Math.max(scale + delta, 0.35), 4.5);
		setScale(nextScale);
		applyModelTransform(dragPosition.x, dragPosition.y, nextScale);
		onTransformChange?.({
			x: dragPosition.x,
			y: dragPosition.y,
			scale: nextScale,
			rotation: 0,
		});
	};

	// Cargar archivo ZIP manualmente
	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.name.toLowerCase().endsWith('.zip')) {
			toast.error('Por favor selecciona un archivo comprimido .ZIP de Live2D.');
			return;
		}

		const toastId = toast.loading(`Desempaquetando ${file.name}...`);
		try {
			const loadedPackage = await unpackLive2dZip(file);
			live2dStore.setPackage(loadedPackage);
			avatar2dManager.setLive2dModel('loaded', loadedPackage.modelName);
			toast.success(`Modelo "${loadedPackage.modelName}" listo en WebGL`, { id: toastId });
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Error al procesar el archivo .ZIP';
			toast.error(msg, { id: toastId });
		}
		e.target.value = '';
	};

	const hasActiveModel = Boolean(pkg && !loadError);

	return (
		<div
			ref={containerRef}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerCancel={handlePointerUp}
			className={`relative h-full w-full touch-none select-none overflow-hidden overscroll-contain ${
				interactive ? 'cursor-grab active:cursor-grabbing' : ''
			}`}
		>
			<input
				ref={fileInputRef}
				type='file'
				accept='.zip'
				onChange={handleFileSelect}
				className='hidden'
			/>

			{/* Canvas WebGL a pantalla completa del contenedor */}
			<canvas
				ref={canvasRef}
				className={`absolute inset-0 block h-full w-full drop-shadow-2xl transition-opacity duration-300 ${
					hasActiveModel && !isLoading ? 'opacity-100' : 'pointer-events-none opacity-0'
				}`}
			/>

			{/* Estado de carga */}
			{isLoading && (
				<div className='absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-card/60 p-6 backdrop-blur-md'>
					<Loader2 className='size-8 animate-spin text-primary' />
					<p className='font-medium text-foreground text-xs'>
						Compilando y optimizando modelo Live2D WebGL...
					</p>
				</div>
			)}

			{/* Error al compilar o cargar */}
			{loadError && !isLoading && (
				<div className='absolute inset-0 z-20 flex items-center justify-center p-6'>
					<div className='flex max-w-sm flex-col items-center justify-center rounded-3xl border border-destructive/40 bg-card/90 p-6 text-center shadow-2xl backdrop-blur-md'>
						<div className='flex size-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive'>
							<AlertCircle className='size-6' />
						</div>
						<h3 className='mt-3 font-bold font-display text-destructive text-sm'>
							Error al compilar el modelo
						</h3>
						<p className='mt-1 text-muted-foreground text-xs'>{loadError}</p>
						<button
							type='button'
							onClick={() => fileInputRef.current?.click()}
							className='mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 font-medium text-primary-foreground text-xs'
						>
							<Upload className='size-3.5' /> Seleccionar otro archivo .ZIP
						</button>
					</div>
				</div>
			)}

			{/* Tarjeta interactiva cuando NO hay modelo cargado */}
			{!hasActiveModel && !isLoading && !loadError && (
				<div className='absolute inset-0 z-10 flex items-center justify-center p-6'>
					<button
						type='button'
						onClick={() => fileInputRef.current?.click()}
						className='group relative flex max-w-sm cursor-pointer flex-col items-center justify-center rounded-3xl border border-primary/30 border-dashed bg-card/75 p-7 text-center shadow-xl backdrop-blur-md transition-all hover:border-primary hover:bg-card/90'
					>
						<div className='flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner transition-transform group-hover:scale-110'>
							<Upload className='size-7' />
						</div>

						<h3 className='mt-3.5 font-bold font-display text-foreground text-sm tracking-tight'>
							Cargar Modelo Live2D (.ZIP)
						</h3>

						<p className='mt-1.5 text-muted-foreground text-xs leading-relaxed'>
							Arrastra tu archivo <code>.zip</code> aquí o haz clic para seleccionarlo de tu
							computadora. Se ajustará automáticamente a este contenedor.
						</p>

						<span className='mt-4 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1 font-medium font-sans text-primary text-xs shadow-xs group-hover:bg-primary group-hover:text-primary-foreground'>
							<Sparkles className='size-3' /> Seleccionar archivo .ZIP
						</span>
					</button>
				</div>
			)}

			{/* Barra flotante de Encuadre Rápido y Zoom Dinámico */}
			{hasActiveModel && !isLoading && interactive && (
				<div className='pointer-events-auto absolute right-4 bottom-4 z-20 flex items-center gap-1 rounded-2xl border border-border/80 bg-background/90 p-1.5 shadow-2xl backdrop-blur-xl transition-all sm:right-6'>
					{/* Auto-Ajustar / Cuerpo Completo */}
					<button
						type='button'
						onClick={() => applyFramingPreset('fit')}
						className='flex items-center gap-1.5 rounded-xl px-2.5 py-1 font-medium font-sans text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
						title='Ajustar modelo completo al contenedor (100% visible sin cortes)'
					>
						<Maximize className='size-3.5 text-primary' />
						<span className='hidden sm:inline'>Ajustar</span>
					</button>

					{/* Busto (Webcam Streaming) */}
					<button
						type='button'
						onClick={() => applyFramingPreset('bust')}
						className='flex items-center gap-1.5 rounded-xl px-2.5 py-1 font-medium font-sans text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
						title='Encuadre Busto / Webcam (Torso y Cabeza)'
					>
						<UserCheck className='size-3.5 text-primary' />
						<span className='hidden sm:inline'>Busto</span>
					</button>

					{/* Primer Plano Rostro */}
					<button
						type='button'
						onClick={() => applyFramingPreset('face')}
						className='flex items-center gap-1.5 rounded-xl px-2.5 py-1 font-medium font-sans text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
						title='Primer Plano (Rostro y Ojos)'
					>
						<Focus className='size-3.5 text-primary' />
						<span className='hidden sm:inline'>Rostro</span>
					</button>

					<div className='mx-0.5 h-3.5 w-px bg-border/60' />

					{/* Zoom Menos */}
					<button
						type='button'
						onClick={() => handleZoomStep(-0.15)}
						className='flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
						title='Alejar zoom (-)'
					>
						<ZoomOut className='size-3.5' />
					</button>

					{/* Porcentaje de Escala */}
					<span className='min-w-[40px] text-center font-mono text-[10px] text-muted-foreground'>
						{Math.round(scale * 100)}%
					</span>

					{/* Zoom Más */}
					<button
						type='button'
						onClick={() => handleZoomStep(0.15)}
						className='flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
						title='Acercar zoom (+)'
					>
						<ZoomIn className='size-3.5' />
					</button>

					<div className='mx-0.5 h-3.5 w-px bg-border/60' />

					{/* Restablecer Posición y Centrado */}
					<button
						type='button'
						onClick={() => applyFramingPreset('fit')}
						className='flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
						title='Restablecer posición al centro'
					>
						<RotateCcw className='size-3.5' />
					</button>
				</div>
			)}
		</div>
	);
}
