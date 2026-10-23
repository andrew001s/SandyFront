'use client';

import { avatar2dManager } from '@/lib/avatar2d/avatar2dManager';
import { type Live2dPackage, live2dStore } from '@/lib/avatar2d/live2dStore';
import { unpackLive2dZip } from '@/lib/avatar2d/live2dZipLoader';
import type { Avatar2dTransform, Live2dConfig } from '@/lib/avatar2d/types';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2, Sparkles, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	// biome-ignore lint/suspicious/noExplicitAny: dynamic Pixi application instance
	const appRef = useRef<any>(null);
	// biome-ignore lint/suspicious/noExplicitAny: dynamic Live2D model instance
	const modelRef = useRef<any>(null);

	const [pkg, setPkg] = useState<Live2dPackage | null>(live2dStore.getPackage());
	const [isSpeaking, setIsSpeaking] = useState(avatar2dManager.getIsSpeaking());
	const [isLoading, setIsLoading] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [dragPosition, setDragPosition] = useState({
		x: config.transform.x,
		y: config.transform.y,
	});
	const [scale, setScale] = useState(config.transform.scale || 1);

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
		setDragPosition({ x: config.transform.x, y: config.transform.y });
		setScale(config.transform.scale || 1);
	}, [config.transform.x, config.transform.y, config.transform.scale]);

	// Inicializar PixiJS y compilar el modelo Live2D WebGL
	useEffect(() => {
		let isMounted = true;

		async function initLive2D() {
			if (!canvasRef.current || !pkg) {
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

				let app = appRef.current;
				if (!app) {
					app = new PIXI.Application({
						view: canvasRef.current,
						width: 800,
						height: 900,
						backgroundAlpha: 0,
						autoDensity: true,
						resolution: Math.min(window.devicePixelRatio || 1, 2),
						antialias: true,
					});
					appRef.current = app;
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

				// Centrar y escalar el modelo en el viewport del canvas
				const modelWidth = model.width || 800;
				const modelHeight = model.height || 900;
				const scaleFactor = Math.min(750 / modelWidth, 850 / modelHeight) * 0.95;

				model.scale.set(scaleFactor);
				model.anchor.set(0.5, 0.5);
				model.x = app.screen.width / 2;
				model.y = app.screen.height / 2;

				app.stage.addChild(model);
				modelRef.current = model;
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
						const mouthValue = 0.35 + Math.sin(Date.now() / 90) * 0.5;
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

	// Seguimiento de cursor (Eye tracking)
	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
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

	// Zoom con rueda del ratón
	const handleWheel = (e: React.WheelEvent) => {
		if (!interactive) return;
		e.preventDefault();
		const factor = e.deltaY < 0 ? 1.05 : 0.95;
		const nextScale = Math.min(Math.max(scale * factor, 0.3), 3.0);
		setScale(nextScale);
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
			onMouseMove={handleMouseMove}
			onWheel={handleWheel}
			className='relative flex h-full w-full items-center justify-center overflow-hidden'
		>
			<input
				ref={fileInputRef}
				type='file'
				accept='.zip'
				onChange={handleFileSelect}
				className='hidden'
			/>

			<motion.div
				drag={interactive}
				dragMomentum={false}
				onDragEnd={(_e, info) => {
					const nextX = dragPosition.x + info.offset.x;
					const nextY = dragPosition.y + info.offset.y;
					setDragPosition({ x: nextX, y: nextY });
					onTransformChange?.({
						x: nextX,
						y: nextY,
						scale,
						rotation: 0,
					});
				}}
				animate={{
					x: dragPosition.x,
					y: dragPosition.y,
					scale,
				}}
				transition={{ type: 'spring', stiffness: 350, damping: 25 }}
				className={`relative select-none ${
					interactive ? 'cursor-grab active:cursor-grabbing' : ''
				}`}
			>
				{/* Canvas WebGL de Live2D */}
				<div className='relative flex flex-col items-center justify-center'>
					<canvas
						ref={canvasRef}
						width={800}
						height={900}
						className={`h-[560px] w-auto max-w-[500px] object-contain drop-shadow-2xl transition-opacity duration-300 md:h-[620px] ${
							hasActiveModel && !isLoading ? 'opacity-100' : 'pointer-events-none opacity-0'
						}`}
					/>

					{/* Estado de carga */}
					{isLoading && (
						<div className='absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-card/60 p-6 backdrop-blur-md'>
							<Loader2 className='size-8 animate-spin text-primary' />
							<p className='font-medium text-foreground text-xs'>
								Compilando modelo Live2D WebGL...
							</p>
						</div>
					)}

					{/* Error al cargar */}
					{loadError && !isLoading && (
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
					)}

					{/* Tarjeta interactiva cuando NO hay modelo cargado */}
					{!hasActiveModel && !isLoading && !loadError && (
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
								computadora. Se procesará 100% en tu navegador.
							</p>

							<span className='mt-4 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1 font-medium font-sans text-primary text-xs shadow-xs group-hover:bg-primary group-hover:text-primary-foreground'>
								<Sparkles className='size-3' /> Seleccionar archivo .ZIP
							</span>
						</button>
					)}
				</div>
			</motion.div>
		</div>
	);
}
