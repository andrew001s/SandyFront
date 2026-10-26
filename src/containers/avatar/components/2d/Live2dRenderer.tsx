'use client';

import { avatar2dManager } from '@/lib/avatar2d/avatar2dManager';
import { type Live2dPackage, live2dStore } from '@/lib/avatar2d/live2dStore';
import { unpackLive2dZip } from '@/lib/avatar2d/live2dZipLoader';
import type { Avatar2dTransform, Live2dConfig } from '@/lib/avatar2d/types';
import { AlertCircle, Loader2, Sparkles, Upload } from 'lucide-react';
import type { Cubism4ModelSettings } from 'pixi-live2d-display/cubism4';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { extractLive2dExpressions } from './Live2dExpressionsPanel';

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

/**
 * Aplica los parámetros de modulación fonética a un modelo Live2D Cubism Core.
 * - ParamMouthOpenY: Apertura vertical continua (0.0 a 1.0)
 * - ParamMouthForm: Curvatura y forma horizontal (-1.0 redondeada a +1.0 ensanchada/sonrisa)
 */
export function applyLive2dMouthParams(
	// biome-ignore lint/suspicious/noExplicitAny: dynamic Live2D model instance
	coreModel: any, // eslint-disable-line @typescript-eslint/no-explicit-any -- Live2D core API is provided dynamically by the runtime.
	params: { mouthOpenY: number; mouthForm: number },
): void {
	if (!coreModel?.setParameterValueById) return;
	try {
		coreModel.setParameterValueById('ParamMouthOpenY', params.mouthOpenY);
		coreModel.setParameterValueById('ParamMouthForm', params.mouthForm);
	} catch {
		// Ignorar si el modelo no soporta los parámetros
	}
}

export interface Live2dFocusPoint {
	x: number;
	y: number;
}

/**
 * Calcula las coordenadas normalizadas de enfoque para Live2D dentro del rango [-clampLimit, clampLimit].
 * +X: derecha, -X: izquierda
 * +Y: arriba, -Y: abajo
 */
export function calculateLive2dFocusPoint(
	clientX: number,
	clientY: number,
	viewport: { width: number; height: number },
	clampLimit = 1.0,
): Live2dFocusPoint {
	if (viewport.width <= 0 || viewport.height <= 0) {
		return { x: 0, y: 0 };
	}
	const rawX = (clientX / viewport.width - 0.5) * 2;
	const rawY = -(clientY / viewport.height - 0.5) * 2;

	const x = Math.max(-clampLimit, Math.min(clampLimit, rawX));
	const y = Math.max(-clampLimit, Math.min(clampLimit, rawY));

	return { x, y };
}

/**
 * Aplica interpolación suave (lerp) hacia la posición objetivo, convergiendo a ella si la diferencia es insignificante.
 */
export function stepLive2dFocusDecay(
	current: Live2dFocusPoint,
	target: Live2dFocusPoint,
	speed = 0.1,
	threshold = 0.005,
): Live2dFocusPoint {
	const dx = target.x - current.x;
	const dy = target.y - current.y;

	const nextX = Math.abs(dx) < threshold ? target.x : current.x + dx * speed;
	const nextY = Math.abs(dy) < threshold ? target.y : current.y + dy * speed;

	return { x: nextX, y: nextY };
}

/**
 * Aplica la posición normalizada de enfoque al modelo Live2D.
 * Delega en focusController (estándar de pixi-live2d-display) y en los parámetros de coreModel.
 */
export function applyLive2dFocusPoint(
	// biome-ignore lint/suspicious/noExplicitAny: dynamic Live2D model instance
	model: any, // eslint-disable-line @typescript-eslint/no-explicit-any -- pixi-live2d-display exposes runtime-specific model internals.
	focus: Live2dFocusPoint,
): void {
	if (!model) return;

	try {
		// 1. Canal estándar de pixi-live2d-display vía focusController
		if (model.internalModel?.focusController) {
			model.internalModel.focusController.focus(focus.x, focus.y, true);
		} else if (typeof model.focus === 'function') {
			model.focus(focus.x, focus.y);
		}

		// 2. Inyección directa en coreModel como garantía inmediata (ojos y cabeza)
		const core = model.internalModel?.coreModel;
		if (core?.setParameterValueById) {
			core.setParameterValueById('ParamEyeBallX', focus.x);
			core.setParameterValueById('ParamEyeBallY', focus.y);
			core.setParameterValueById('ParamAngleX', focus.x * 30);
			core.setParameterValueById('ParamAngleY', focus.y * 30);
			core.setParameterValueById('ParamAngleZ', focus.x * focus.y * -30);
			core.setParameterValueById('ParamBodyAngleX', focus.x * 10);
		}
	} catch {
		// Ignorar si el modelo no soporta los parámetros
	}
}

/**
 * Aplica una expresión gestual al modelo Live2D en WebGL.
 * Si se pasa un identificador de expresión, la activa.
 * Si se pasa null, resetea la expresión al estado neutral.
 */
export function applyLive2dExpression(
	// biome-ignore lint/suspicious/noExplicitAny: dynamic Live2D model instance
	model: any, // eslint-disable-line @typescript-eslint/no-explicit-any -- pixi-live2d-display exposes runtime-specific model internals.
	expressionId: string | null | undefined,
): void {
	if (!model) return;
	try {
		if (expressionId) {
			if (typeof model.expression === 'function') {
				const res = model.expression(expressionId);
				if (res && typeof res.catch === 'function') {
					res.catch(() => {
						// Ignorar fallo de expresión nativa si el modelo no la define
					});
				}
			}
		} else if (model.internalModel?.motionManager?.expressionManager) {
			model.internalModel.motionManager.expressionManager.resetExpression();
		} else if (typeof model.expression === 'function') {
			model.expression('');
		}
	} catch {
		// Ignorar si el modelo no soporta la expresión
	}
}

export interface Live2dExpressionParameter {
	Id: string;
	Value: number;
	Blend?: 'Add' | 'Multiply' | 'Overwrite' | string;
}

/**
 * Busca la URL virtual (Blob) del archivo de expresión dentro de fileMap
 */
export function findExpressionUrlInFileMap(
	fileMap?: Record<string, string> | null,
	expressionId?: string | null,
): string | null {
	if (!fileMap || !expressionId) return null;
	const clean = expressionId.replace(/\.(exp3|exp)?\.json$/i, '').toLowerCase();

	if (fileMap[expressionId]) return fileMap[expressionId];
	if (fileMap[`${expressionId}.exp3.json`]) return fileMap[`${expressionId}.exp3.json`];
	if (fileMap[`${expressionId}.exp.json`]) return fileMap[`${expressionId}.exp.json`];

	for (const [key, url] of Object.entries(fileMap)) {
		const fileName = key.split(/[/\\]/).pop() || '';
		const keyClean = fileName.replace(/\.(exp3|exp)?\.json$/i, '').toLowerCase();

		if (keyClean === clean) {
			return url;
		}
	}

	return null;
}

/**
 * Parsea parámetros de expresiones tanto para Cubism 4 (Parameters) como Cubism 2/3 (params)
 */
export function parseLive2dExpressionParams(
	// biome-ignore lint/suspicious/noExplicitAny: dynamic JSON object
	data: any, // eslint-disable-line @typescript-eslint/no-explicit-any -- Supports multiple external Live2D expression JSON schemas.
): Live2dExpressionParameter[] {
	if (!data) return [];
	if (Array.isArray(data.Parameters)) {
		return data.Parameters.map((p: Record<string, unknown>) => ({
			Id: String(p.Id || ''),
			Value: typeof p.Value === 'number' ? p.Value : Number(p.Value || 0),
			Blend: typeof p.Blend === 'string' ? p.Blend : 'Overwrite',
		}));
	}
	if (Array.isArray(data.params)) {
		return data.params.map((p: Record<string, unknown>) => ({
			Id: String(p.id || ''),
			Value: typeof p.val === 'number' ? p.val : Number(p.val || 0),
			Blend: p.calc === 'add' ? 'Add' : p.calc === 'mult' ? 'Multiply' : 'Overwrite',
		}));
	}
	return [];
}

/**
 * Restablece los parámetros de una expresión desactivada a sus valores por defecto o neutrales
 */
export function resetLive2dExpressionParams(
	// biome-ignore lint/suspicious/noExplicitAny: dynamic Live2D core model
	core: any, // eslint-disable-line @typescript-eslint/no-explicit-any -- Live2D core APIs vary across Cubism versions.
	params: Live2dExpressionParameter[],
): void {
	if (!core || !Array.isArray(params)) return;
	for (const p of params) {
		try {
			if (
				typeof core.getParameterIndex === 'function' &&
				typeof core.getParameterDefaultValue === 'function'
			) {
				const idx = core.getParameterIndex(p.Id);
				if (idx >= 0) {
					const defVal = core.getParameterDefaultValue(idx);
					if (typeof core.setParameterValueByIndex === 'function') {
						core.setParameterValueByIndex(idx, typeof defVal === 'number' ? defVal : 0);
						continue;
					}
					if (typeof core.setParameterValueById === 'function') {
						core.setParameterValueById(p.Id, typeof defVal === 'number' ? defVal : 0);
						continue;
					}
				}
			}
			if (typeof core.setParameterValueById === 'function') {
				core.setParameterValueById(p.Id, 0);
			}
		} catch {
			// Ignorar si el modelo no tiene el parámetro
		}
	}
}

/**
 * Aplica los parámetros de modulación gestual directamente sobre el coreModel de Live2D.
 * Garantiza que morphs como Blush, Dead Eyes, Fanged Smile se reflejen inmediatamente en WebGL.
 */
export function applyLive2dExpressionParams(
	// biome-ignore lint/suspicious/noExplicitAny: dynamic Live2D model instance
	core: any, // eslint-disable-line @typescript-eslint/no-explicit-any -- Live2D core APIs vary across Cubism versions.
	params: Live2dExpressionParameter[],
): void {
	if (!core || !Array.isArray(params)) return;
	for (const p of params) {
		try {
			if (p.Blend === 'Add' && typeof core.addParameterValueById === 'function') {
				core.addParameterValueById(p.Id, p.Value);
			} else if (p.Blend === 'Multiply' && typeof core.multiplyParameterValueById === 'function') {
				core.multiplyParameterValueById(p.Id, p.Value);
			} else if (typeof core.setParameterValueById === 'function') {
				core.setParameterValueById(p.Id, p.Value);
			}
		} catch {
			// Ignorar si el modelo no tiene este parámetro específico
		}
	}
}

export function Live2dRenderer({ config, onTransformChange, interactive = true }: Props) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	// biome-ignore lint/suspicious/noExplicitAny: dynamic Pixi application instance
	const appRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any -- Pixi application type is loaded dynamically on the client.
	// biome-ignore lint/suspicious/noExplicitAny: dynamic Live2D model instance
	const modelRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any -- Live2D model type is loaded dynamically on the client.
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

	// Control de arrastre y referencias para animación fluida a 60fps
	const isDraggingRef = useRef(false);
	const dragStartRef = useRef({
		startX: 0,
		startY: 0,
		initialX: 0,
		initialY: 0,
	});
	const dragPositionRef = useRef({
		x: config.transform.x || 0,
		y: config.transform.y || 0,
	});
	dragPositionRef.current = dragPosition;

	const scaleRef = useRef(config.transform.scale || 1);
	scaleRef.current = scale;

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

	// Parámetros de modulación fonética calculados (apertura vertical y forma horizontal)
	const mouthParamsRef = useRef(avatar2dManager.getMouthParams());
	useEffect(() => {
		const unsub = avatar2dManager.subscribeMouthParams((mouthOpenY, mouthForm) => {
			mouthParamsRef.current = { mouthOpenY, mouthForm };
		});
		return () => unsub();
	}, []);

	// Mapa en memoria de parámetros cacheados por id de expresión
	const expressionParamsCacheRef = useRef<Map<string, Live2dExpressionParameter[]>>(new Map());
	// Parámetros activos consolidados para inyección continua en el ciclo de renderizado
	const activeExpressionParamsRef = useRef<Live2dExpressionParameter[]>([]);
	// Conjunto de parámetros aplicados en el ciclo anterior para resetear los que se apaguen
	const previouslyAppliedParamsRef = useRef<Live2dExpressionParameter[]>([]);

	const syncExpressions = useCallback(
		(activeIds: string[]) => {
			const model = modelRef.current;
			if (!model) return;

			if (activeIds.length === 0) {
				applyLive2dExpression(model, null);
				if (previouslyAppliedParamsRef.current.length > 0 && model.internalModel?.coreModel) {
					resetLive2dExpressionParams(
						model.internalModel.coreModel,
						previouslyAppliedParamsRef.current,
					);
				}
				previouslyAppliedParamsRef.current = [];
				activeExpressionParamsRef.current = [];
				return;
			}

			// Compatibilidad con motion manager nativo (última expresión activada)
			applyLive2dExpression(model, activeIds[activeIds.length - 1]);

			// Consolidar parámetros de todas las expresiones activas
			const consolidatedParams: Live2dExpressionParameter[] = [];

			for (const id of activeIds) {
				const cached = expressionParamsCacheRef.current.get(id);
				if (cached) {
					consolidatedParams.push(...cached);
				} else if (pkg?.fileMap) {
					const targetUrl = findExpressionUrlInFileMap(pkg.fileMap, id);
					if (targetUrl) {
						fetch(targetUrl)
							.then((res) => res.json())
							.then((data) => {
								const parsed = parseLive2dExpressionParams(data);
								expressionParamsCacheRef.current.set(id, parsed);
								// Re-sincronizar cuando los parámetros se descarguen
								const currentActive = avatar2dManager.getState().live2d.activeExpressions || [];
								if (currentActive.includes(id)) {
									syncExpressions(currentActive);
								}
							})
							.catch(() => {
								// Ignorar error de lectura de archivo de expresión
							});
					}
				}
			}

			// Resetear parámetros que ya no están en ninguna expresión activa
			const activeParamIds = new Set(consolidatedParams.map((p) => p.Id));
			const paramsToReset = previouslyAppliedParamsRef.current.filter(
				(p) => !activeParamIds.has(p.Id),
			);
			if (paramsToReset.length > 0 && model.internalModel?.coreModel) {
				resetLive2dExpressionParams(model.internalModel.coreModel, paramsToReset);
			}

			previouslyAppliedParamsRef.current = consolidatedParams;
			activeExpressionParamsRef.current = consolidatedParams;

			// Inyección inmediata sobre el coreModel
			if (consolidatedParams.length > 0 && model.internalModel?.coreModel) {
				applyLive2dExpressionParams(model.internalModel.coreModel, consolidatedParams);
			}
		},
		[pkg?.fileMap],
	);

	useEffect(() => {
		const currentExpressions =
			config.activeExpressions ??
			(config.activeExpression ? [config.activeExpression] : undefined) ??
			avatar2dManager.getState().live2d.activeExpressions ??
			[];
		syncExpressions(currentExpressions);
	}, [config.activeExpressions, config.activeExpression, syncExpressions]);

	useEffect(() => {
		const unsub = avatar2dManager.subscribe((state) => {
			const expressions =
				state.live2d.activeExpressions ??
				(state.live2d.activeExpression ? [state.live2d.activeExpression] : []);
			syncExpressions(expressions);
		});
		return () => unsub();
	}, [syncExpressions]);

	// Puntos de enfoque para seguimiento de cursor suave con amortiguación
	const targetFocusRef = useRef<Live2dFocusPoint>({ x: 0, y: 0 });
	const currentFocusRef = useRef<Live2dFocusPoint>({ x: 0, y: 0 });

	// Seguimiento de cursor a nivel de ventana para evitar pérdidas de tracking fuera del canvas
	useEffect(() => {
		if (typeof window === 'undefined' || !interactive) return;

		const handleWindowPointerMove = (e: PointerEvent) => {
			if (isDraggingRef.current || !config.eyeTracking) {
				targetFocusRef.current = { x: 0, y: 0 };
				return;
			}
			targetFocusRef.current = calculateLive2dFocusPoint(e.clientX, e.clientY, {
				width: window.innerWidth,
				height: window.innerHeight,
			});
		};

		const handleWindowPointerLeave = () => {
			targetFocusRef.current = { x: 0, y: 0 };
		};

		window.addEventListener('pointermove', handleWindowPointerMove);
		window.addEventListener('blur', handleWindowPointerLeave);
		document.addEventListener('mouseleave', handleWindowPointerLeave);

		return () => {
			window.removeEventListener('pointermove', handleWindowPointerMove);
			window.removeEventListener('blur', handleWindowPointerLeave);
			document.removeEventListener('mouseleave', handleWindowPointerLeave);
		};
	}, [config.eyeTracking, interactive]);

	// Función centralizada para aplicar escala y posición con centrado matemático perfecto
	const applyModelTransform = useCallback(
		(overrideX?: number, overrideY?: number, overrideScale?: number) => {
			const model = modelRef.current;
			const app = appRef.current;
			const bounds = visualBoundsRef.current;
			if (!model || !app || !bounds) return;

			const curX = overrideX !== undefined ? overrideX : dragPositionRef.current.x;
			const curY = overrideY !== undefined ? overrideY : dragPositionRef.current.y;
			const curScale = overrideScale !== undefined ? overrideScale : scaleRef.current;

			const screenW = app.screen.width;
			const screenH = app.screen.height;

			if (screenW <= 0 || screenH <= 0 || bounds.width <= 0 || bounds.height <= 0) return;

			// Margen de seguridad del 6% para que el modelo nunca se corte en los bordes
			const marginX = screenW * 0.06;
			const marginY = screenH * 0.06;
			const availW = Math.max(80, screenW - marginX * 2);
			const availH = Math.max(80, screenH - marginY * 2);

			// En encuadres de estudio y VTuber (busto, rostro, cuerpo completo), la escala base
			// se adapta proporcionalmente a la altura vertical de la pantalla para garantizar
			// consistencia matemática del 100% entre vista normal y pantalla completa.
			const fitByHeight = availH / bounds.height;
			const baseFitScale =
				screenW < 400 ? Math.min(availW / bounds.width, fitByHeight) : fitByHeight;
			const effectiveScale = Math.max(0.0001, baseFitScale * curScale);

			model.scale.set(effectiveScale);

			// Centro del viewport
			const screenCenterX = screenW / 2;
			const screenCenterY = screenH / 2;

			// Centro visual del modelo en su espacio de coordenadas locales
			const modelCenterX = bounds.x + bounds.width / 2;
			const modelCenterY = bounds.y + bounds.height / 2;

			// Proporción de escala relativa a la altura base (600px) para mantener encuadre y escala 100% consistentes
			const BASE_CANVAS_HEIGHT = 600;
			const heightRatio = screenH / BASE_CANVAS_HEIGHT;
			const scaledX = curX * heightRatio;
			const scaledY = curY * heightRatio;

			// Posicionar el modelo para que el centro visual coincida exactamente con el centro del viewport + desplazamiento escalado
			model.x = screenCenterX + scaledX - modelCenterX * effectiveScale;
			model.y = screenCenterY + scaledY - modelCenterY * effectiveScale;
		},
		[],
	);

	// Sincronizar transformación externa en tiempo real
	useEffect(() => {
		if (isDraggingRef.current) return;
		const nextX = config.transform.x || 0;
		const nextY = config.transform.y || 0;
		const nextScale = config.transform.scale || 1;
		setDragPosition({ x: nextX, y: nextY });
		setScale(nextScale);
		applyModelTransform(nextX, nextY, nextScale);
	}, [config.transform.x, config.transform.y, config.transform.scale, applyModelTransform]);

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
				const { Live2DModel, Live2DFactory, Cubism4ExpressionManager } = await import(
					'pixi-live2d-display/cubism4'
				);

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

				// Auto-descubrir y enriquecer expresiones en modelSettingsJson para que Cubism4ExpressionManager se instancie
				const discovered = extractLive2dExpressions(pkg.modelSettingsJson, pkg.fileMap);
				if (discovered.length > 0) {
					if (!pkg.modelSettingsJson.FileReferences) {
						pkg.modelSettingsJson.FileReferences = {};
					}
					if (
						!Array.isArray(pkg.modelSettingsJson.FileReferences.Expressions) ||
						pkg.modelSettingsJson.FileReferences.Expressions.length === 0
					) {
						pkg.modelSettingsJson.FileReferences.Expressions = discovered.map((e) => ({
							Name: e.id,
							File: e.file || `${e.id}.exp3.json`,
						}));
					}
				}

				// Obtener el runtime correspondiente e instanciar ModelSettings
				const runtime = Live2DFactory.findRuntime(pkg.modelSettingsJson);
				if (!runtime) {
					throw new Error(
						'No se pudo encontrar el motor Cubism adecuado para este modelo .model3.json.',
					);
				}

				const settings = runtime.createModelSettings(pkg.modelSettingsJson) as Cubism4ModelSettings;
				if (!settings.expressions && discovered.length > 0) {
					settings.expressions = discovered.map((e) => ({
						Name: e.id,
						File: e.file || `${e.id}.exp3.json`,
					}));
				}

				// Reemplazar la función resolveURL para alimentar los recursos desde el mapa de Blob URLs
				settings.resolveURL = (path: string) => {
					let decoded = path;
					try {
						decoded = decodeURIComponent(path);
					} catch {
						// Ignorar
					}
					const norm = decoded.replace(/\\/g, '/').replace(/^\.?\//, '');
					if (pkg.fileMap[norm]) return pkg.fileMap[norm];

					const fname = norm.split('/').pop() || norm;
					if (pkg.fileMap[fname]) return pkg.fileMap[fname];

					const lowerFname = fname.toLowerCase();
					for (const [k, v] of Object.entries(pkg.fileMap)) {
						const lowerK = k.toLowerCase();
						if (lowerK === lowerFname || lowerK.endsWith(`/${lowerFname}`)) {
							return v;
						}
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

				// Inicializar ExpressionManager si no se instanció automáticamente
				if (
					model.internalModel?.motionManager &&
					!model.internalModel.motionManager.expressionManager &&
					settings.expressions &&
					settings.expressions.length > 0 &&
					Cubism4ExpressionManager
				) {
					try {
						model.internalModel.motionManager.expressionManager = new Cubism4ExpressionManager(
							settings,
						);
					} catch {
						// Ignorar
					}
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

				// Inyectar parámetros de expresiones en beforeModelUpdate en cada tick
				const onBeforeModelUpdate = () => {
					if (activeExpressionParamsRef.current.length > 0 && model.internalModel?.coreModel) {
						applyLive2dExpressionParams(
							model.internalModel.coreModel,
							activeExpressionParamsRef.current,
						);
					}
				};
				if (typeof model.internalModel?.on === 'function') {
					model.internalModel.on('beforeModelUpdate', onBeforeModelUpdate);
				}

				// Sincronizar expresiones activas
				const initialExpressions =
					config.activeExpressions ??
					(config.activeExpression ? [config.activeExpression] : undefined) ??
					avatar2dManager.getState().live2d.activeExpressions ??
					[];
				syncExpressions(initialExpressions);
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
			if (modelRef.current?.internalModel?.off) {
				modelRef.current.internalModel.off('beforeModelUpdate');
			}
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

	// Animar el habla (Lip Sync) y seguimiento de cursor en cada frame
	useEffect(() => {
		let frameId: number;
		let isRunning = true;

		const animateFrame = () => {
			if (!isRunning) return;
			const model = modelRef.current;
			if (model) {
				// 1. Modulación labial
				if (model.internalModel?.coreModel) {
					const core = model.internalModel.coreModel;
					try {
						if (isSpeaking) {
							const currentParams = mouthParamsRef.current;
							if (currentParams.mouthOpenY > 0 || currentParams.mouthForm !== 0) {
								applyLive2dMouthParams(core, currentParams);
							} else {
								const fallbackOpen = 0.35 + Math.sin(Date.now() / 90) * 0.45;
								applyLive2dMouthParams(core, { mouthOpenY: fallbackOpen, mouthForm: 0 });
							}
						} else {
							applyLive2dMouthParams(core, { mouthOpenY: 0, mouthForm: 0 });
						}
					} catch {
						// Parámetro no soportado en este modelo
					}
				}

				// 2. Seguimiento suave de cursor con amortiguación continua (easing hacia target)
				const target =
					config.eyeTracking && !isDraggingRef.current ? targetFocusRef.current : { x: 0, y: 0 };
				const nextFocus = stepLive2dFocusDecay(currentFocusRef.current, target, 0.12);
				currentFocusRef.current = nextFocus;

				applyLive2dFocusPoint(model, nextFocus);

				// 3. Modulación gestual de expresión activa directamente en el coreModel
				if (activeExpressionParamsRef.current.length > 0 && model.internalModel?.coreModel) {
					applyLive2dExpressionParams(
						model.internalModel.coreModel,
						activeExpressionParamsRef.current,
					);
				}
			}
			frameId = requestAnimationFrame(animateFrame);
		};

		frameId = requestAnimationFrame(animateFrame);
		return () => {
			isRunning = false;
			cancelAnimationFrame(frameId);
		};
	}, [isSpeaking, config.eyeTracking]);

	// Seguimiento de cursor (Eye tracking) y Arrastre del Modelo
	const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!interactive || !modelRef.current) return;
		if (e.button !== 0) return; // Solo clic izquierdo o toque principal

		isDraggingRef.current = true;
		dragStartRef.current = {
			startX: e.clientX,
			startY: e.clientY,
			initialX: dragPositionRef.current.x,
			initialY: dragPositionRef.current.y,
		};

		try {
			e.currentTarget.setPointerCapture(e.pointerId);
		} catch {
			// Ignorar si el navegador no soporta pointer capture
		}
	};

	const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
		// Manejo de arrastre (pan) con escala de delta normalizada
		if (isDraggingRef.current) {
			const dx = e.clientX - dragStartRef.current.startX;
			const dy = e.clientY - dragStartRef.current.startY;
			const heightRatio = Math.max(0.2, (appRef.current?.screen?.height || 600) / 600);
			const nextX = dragStartRef.current.initialX + dx / heightRatio;
			const nextY = dragStartRef.current.initialY + dy / heightRatio;

			dragPositionRef.current = { x: nextX, y: nextY };
			applyModelTransform(nextX, nextY, scaleRef.current);
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
			const finalPos = dragPositionRef.current;
			setDragPosition(finalPos);
			onTransformChange?.({
				x: finalPos.x,
				y: finalPos.y,
				scale: scaleRef.current,
				rotation: 0,
			});
		}
	};

	// Zoom fluido con rueda del ratón SIN que haga scroll la página entera
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
			className={`absolute inset-0 touch-none select-none overflow-hidden overscroll-contain ${
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
		</div>
	);
}
