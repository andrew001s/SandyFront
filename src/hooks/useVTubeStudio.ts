'use client';

import { AudioQueueManager } from '@/lib/audioQueueSingleton';
import {
	type AvatarBackendPayload,
	resolveAvatarExpression,
	resolveAvatarHotkey,
	resolveAvatarPose,
} from '@/lib/vtsAvatarPayload';
import { createVtsLipSyncHandler, stopVtsLipSync } from '@/lib/vtsLipSync';
import posthog from 'posthog-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiClient, VTubeStudioError } from 'vtubestudio';

export interface VTSModel {
	modelLoaded: boolean;
	modelName: string;
	modelID: string;
	vtsModelName: string;
	vtsModelIconName: string;
}

export interface VTSModelInfo {
	modelLoaded: boolean;
	modelName: string;
	modelID: string;
	vtsModelName: string;
	vtsModelIconName: string;
	live2DModelName: string;
	modelLoadTime: number;
	timeSinceModelLoaded: number;
	numberOfLive2DParameters: number;
	numberOfLive2DArtmeshes: number;
	hasPhysicsFile: boolean;
	numberOfTextures: number;
	textureResolution: number;
	modelPosition: {
		positionX: number;
		positionY: number;
		rotation: number;
		size: number;
	};
}

export interface VTSStats {
	uptime: number;
	framerate: number;
	vTubeStudioVersion: string;
}

export interface VTSHotkey {
	name: string;
	type: string;
	description: string;
	file: string;
	hotkeyID: string;
	keyCombination: unknown[];
	onScreenButtonID: number;
}

export interface VTSExpression {
	name: string;
	file: string;
	active: boolean;
	deactivateWhenKeyIsLetGo: boolean;
	autoDeactivateAfterSeconds: boolean;
	secondsRemaining: boolean;
	usedInHotkeys: { name: string; id: string }[];
	parameters: { name: string; value: number }[];
}

interface UseVTSReturn {
	connecting: boolean;
	connected: boolean;
	error: string | null;
	stats: VTSStats | null;
	models: VTSModel[];
	currentModel: VTSModelInfo | null;
	folderInfo: { models: string; backgrounds: string; items: string } | null;
	connect: (port?: number) => Promise<void>;
	disconnect: () => Promise<void>;
	loadModel: (modelID: string) => Promise<void>;
	refreshModels: () => Promise<void>;
	injectParameters: (params: { id: string; value: number }[]) => Promise<void>;
	hotkeys: VTSHotkey[];
	expressions: VTSExpression[];
	triggerHotkey: (key: string) => Promise<boolean>;
	activateExpression: (nameOrFile: string) => Promise<boolean>;
	setExpressionActive: (nameOrFile: string, active: boolean) => Promise<boolean>;
	moveModel: (opts: {
		positionX?: number;
		positionY?: number;
		rotation?: number;
		size?: number;
		timeInSeconds?: number;
		valuesAreRelativeToModel?: boolean;
	}) => Promise<void>;
	sendAvatarPayload: (payload: AvatarBackendPayload) => Promise<boolean>;
}

const PLUGIN_NAME = 'SandyIA';
const PLUGIN_DEVELOPER = 'SandyFront';
const LIPSYNC_INPUTS = [
	{
		parameterName: 'SandyLipOpen',
		explanation: 'Lip sync mouth openness input driven by SandyFront.',
		min: 0,
		max: 1,
		defaultValue: 0,
	},
	{
		parameterName: 'SandyLipSmile',
		explanation: 'Lip sync mouth form input driven by SandyFront.',
		min: 0,
		max: 1,
		defaultValue: 0,
	},
] as const;

// La conexión con VTS es única para toda la app, pero `useVTubeStudio` se usa
// desde varios componentes a la vez (chat, avatar, onboarding). El estado vive
// en el módulo y cada instancia se suscribe: antes, la que no había creado el
// cliente nunca se enteraba de que la conexión se abría o se caía.
let sharedClient: ApiClient | null = null;
let sharedConnected = false;
let sharedConnecting = false;
let sharedParametersReady = false;
let sharedConnectPromise: Promise<void> | null = null;
let sharedAutoConnectTried = false;
// Reconexión tras una caída inesperada: VTS reiniciado, el equipo despertando
// de suspensión o un corte de red. Sin esto la conexión quedaba muerta hasta que
// el usuario recargaba, y el modelo se quedaba sin recibir parámetros.
let sharedReconnectTimer: ReturnType<typeof setTimeout> | null = null;
let sharedReconnectAttempt = 0;
let sharedManualDisconnect = false;
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;
const VTS_TOKEN_KEY = 'vts_auth_token';

const cancelReconnect = () => {
	if (sharedReconnectTimer) {
		clearTimeout(sharedReconnectTimer);
		sharedReconnectTimer = null;
	}
	sharedReconnectAttempt = 0;
};
const sharedListeners = new Set<() => void>();

const notifySharedState = () => {
	for (const listener of sharedListeners) {
		listener();
	}
};

/**
 * Inyecta parámetros leyendo el cliente compartido en cada llamada, en vez de
 * capturarlo en un closure: el handler de lip sync sobrevive a reconexiones.
 */
const injectSharedParameters = async (params: { id: string; value: number }[]) => {
	const client = sharedClient;
	if (!client || !sharedParametersReady) return;

	await client.injectParameterData({
		mode: 'set',
		parameterValues: params.map((p) => ({ id: p.id, value: p.value })),
	});
};

const attachLipSync = () => {
	AudioQueueManager.getInstance().setLipSyncHandler(
		createVtsLipSyncHandler(injectSharedParameters),
	);
};

const detachLipSync = () => {
	AudioQueueManager.getInstance().setLipSyncHandler(null);
	stopVtsLipSync();
};

export function useVTubeStudio(): UseVTSReturn {
	const [connecting, setConnecting] = useState(false);
	const [connected, setConnected] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [stats, setStats] = useState<VTSStats | null>(null);
	const [models, setModels] = useState<VTSModel[]>([]);
	const [currentModel, setCurrentModel] = useState<VTSModelInfo | null>(null);
	const [folderInfo, setFolderInfo] = useState<{
		models: string;
		backgrounds: string;
		items: string;
	} | null>(null);
	const [hotkeys, setHotkeys] = useState<VTSHotkey[]>([]);
	const [expressions, setExpressions] = useState<VTSExpression[]>([]);
	const clientRef = useRef<ApiClient | null>(null);

	const handleError = useCallback((e: unknown) => {
		if (e instanceof VTubeStudioError) {
			return `VTS Error [${e.data.errorID}]: ${e.data.message}`;
		}
		if (e instanceof Error) return e.message;
		return 'Error desconocido';
	}, []);

	const syncClientState = useCallback(
		async (client: ApiClient) => {
			try {
				const [statsResp, modelsResp, modelResp, hotkeysResp, expressionsResp, folderInfoResp] =
					await Promise.all([
						client.statistics(),
						client.availableModels(),
						client.currentModel(),
						client.hotkeysInCurrentModel({}),
						client.expressionState({ details: true }),
						client.vtsFolderInfo(),
					]);

				setStats(statsResp);
				setModels(modelsResp.availableModels);
				setCurrentModel(modelResp.modelLoaded ? modelResp : null);
				setHotkeys(hotkeysResp.availableHotkeys);
				setExpressions(expressionsResp.expressions);
				setFolderInfo(folderInfoResp);
			} catch (e) {
				setError(handleError(e));
			}
		},
		[handleError],
	);

	const syncModelState = useCallback(
		async (client: ApiClient) => {
			try {
				const [modelsResp, modelResp, hotkeysResp, expressionsResp] = await Promise.all([
					client.availableModels(),
					client.currentModel(),
					client.hotkeysInCurrentModel({}),
					client.expressionState({ details: true }),
				]);
				setModels(modelsResp.availableModels);
				setCurrentModel(modelResp.modelLoaded ? modelResp : null);
				setHotkeys(hotkeysResp.availableHotkeys);
				setExpressions(expressionsResp.expressions);
			} catch (e) {
				setError(handleError(e));
			}
		},
		[handleError],
	);

	const injectParameters = useCallback(
		(params: { id: string; value: number }[]) => injectSharedParameters(params),
		[],
	);

	const triggerHotkey = useCallback(
		async (key: string) => {
			const client = clientRef.current;
			if (!client) return false;

			let availableHotkeys = hotkeys;
			if (availableHotkeys.length === 0) {
				try {
					const hotkeysResp = await client.hotkeysInCurrentModel({});
					availableHotkeys = hotkeysResp.availableHotkeys;
					setHotkeys(availableHotkeys);
				} catch {
					return false;
				}
			}

			const normalizedKey = key.trim().toLowerCase();
			const hotkey =
				availableHotkeys.find((item) => item.hotkeyID === key) ??
				availableHotkeys.find((item) => item.name.trim().toLowerCase() === normalizedKey) ??
				availableHotkeys.find((item) => item.file.trim().toLowerCase() === normalizedKey);

			if (!hotkey) return false;

			await client.hotkeyTrigger({ hotkeyID: hotkey.hotkeyID });
			return true;
		},
		[hotkeys],
	);

	const setExpressionActive = useCallback(
		async (nameOrFile: string, active: boolean) => {
			const client = clientRef.current;
			if (!client) return false;

			let availableExpressions = expressions;
			if (availableExpressions.length === 0) {
				try {
					const expressionsResp = await client.expressionState({ details: true });
					availableExpressions = expressionsResp.expressions;
					setExpressions(availableExpressions);
				} catch {
					return false;
				}
			}

			const normalizedKey = nameOrFile.trim().toLowerCase();
			const expression = availableExpressions.find((item) => {
				const nameMatch = item.name.trim().toLowerCase() === normalizedKey;
				const fileMatch = item.file.trim().toLowerCase() === normalizedKey;
				return nameMatch || fileMatch;
			});

			if (!expression) return false;

			await client.expressionActivation({
				expressionFile: expression.file,
				active,
				fadeTime: 0.25,
			});

			setExpressions((prev) =>
				prev.map((item) => (item.file === expression.file ? { ...item, active } : item)),
			);
			return true;
		},
		[expressions],
	);

	const activateExpression = useCallback(
		async (nameOrFile: string) => setExpressionActive(nameOrFile, true),
		[setExpressionActive],
	);

	const moveModel = useCallback(
		async (opts: {
			positionX?: number;
			positionY?: number;
			rotation?: number;
			size?: number;
			timeInSeconds?: number;
			valuesAreRelativeToModel?: boolean;
		}) => {
			const client = clientRef.current;
			if (!client) return;

			await client.moveModel({
				timeInSeconds: opts.timeInSeconds ?? 0.5,
				valuesAreRelativeToModel: opts.valuesAreRelativeToModel ?? false,
				positionX: opts.positionX,
				positionY: opts.positionY,
				rotation: opts.rotation,
				size: opts.size,
			});

			const modelResp = await client.currentModel();
			if (modelResp.modelLoaded) {
				setCurrentModel(modelResp);
			}
		},
		[],
	);

	const sendAvatarPayload = useCallback(
		async (payload: AvatarBackendPayload) => {
			const client = clientRef.current;
			if (!client) return false;

			const normalizedType = String(payload.type ?? '').toLowerCase();
			const pose = resolveAvatarPose(payload);
			const tasks: Promise<unknown>[] = [];

			if (
				normalizedType === 'speech' ||
				normalizedType === 'reaction' ||
				normalizedType === 'idle'
			) {
				tasks.push(
					injectParameters([
						{ id: 'SandyLipOpen', value: pose.open },
						{ id: 'SandyLipSmile', value: pose.smile },
					]),
				);
			}

			const hotkeyKey = resolveAvatarHotkey(payload);
			if (hotkeyKey) {
				tasks.push(
					(async () => {
						await triggerHotkey(hotkeyKey);
					})(),
				);
			}

			const expressionKey = resolveAvatarExpression(payload);
			if (expressionKey) {
				tasks.push(
					(async () => {
						await activateExpression(expressionKey);
					})(),
				);
			}

			await Promise.allSettled(tasks);
			return true;
		},
		[activateExpression, injectParameters, triggerHotkey],
	);

	useEffect(() => {
		const syncFromShared = () => {
			clientRef.current = sharedClient;
			setConnected(sharedConnected);
			setConnecting(sharedConnecting);
		};

		syncFromShared();
		sharedListeners.add(syncFromShared);
		return () => {
			sharedListeners.delete(syncFromShared);
		};
	}, []);

	// Se recarga el catálogo del modelo cada vez que esta instancia pasa a
	// conectada, venga de su propio connect() o de otra pestaña del dashboard.
	useEffect(() => {
		if (connected && clientRef.current) {
			void syncClientState(clientRef.current);
		}
	}, [connected, syncClientState]);

	// Se declara antes de `connect` y lo invoca por referencia para no crear una
	// dependencia circular entre ambos callbacks.
	const connectRef = useRef<
		((port?: number, options?: { silent?: boolean }) => Promise<void>) | null
	>(null);

	const scheduleReconnect = useCallback(() => {
		// Una desconexión pedida por el usuario no se deshace sola.
		if (sharedManualDisconnect || sharedReconnectTimer) {
			return;
		}
		if (typeof window === 'undefined' || !window.localStorage.getItem(VTS_TOKEN_KEY)) {
			return;
		}

		const delay = Math.min(RECONNECT_BASE_MS * 2 ** sharedReconnectAttempt, RECONNECT_MAX_MS);
		sharedReconnectAttempt += 1;
		sharedReconnectTimer = setTimeout(() => {
			sharedReconnectTimer = null;
			void connectRef.current?.(8001, { silent: true });
		}, delay);
	}, []);

	const connect = useCallback(
		async (port = 8001, options: { silent?: boolean } = {}) => {
			// Una sola conexión en vuelo para toda la app: si dos componentes piden
			// conectar a la vez, el segundo espera a la misma promesa en lugar de
			// abrir un cliente paralelo o seguir sin conexión.
			sharedManualDisconnect = false;

			if (sharedConnectPromise) {
				await sharedConnectPromise;
				return;
			}

			if (sharedClient && sharedConnected && sharedParametersReady) {
				clientRef.current = sharedClient;
				setConnected(true);
				attachLipSync();
				await syncClientState(sharedClient);
				return;
			}

			setError(null);
			sharedConnecting = true;
			notifySharedState();

			const run = async () => {
				if (sharedClient) {
					try {
						await sharedClient.disconnect();
					} catch {
						// Ignore stale client teardown errors.
					}
				}

				const client = new ApiClient({
					pluginName: PLUGIN_NAME,
					pluginDeveloper: PLUGIN_DEVELOPER,
					authTokenGetter: () => localStorage.getItem(VTS_TOKEN_KEY),
					authTokenSetter: async (token) => {
						localStorage.setItem(VTS_TOKEN_KEY, token);
					},
					port,
					pluginIcon: undefined,
				});

				sharedClient = client;
				sharedParametersReady = false;

				client.on('connect', () => {
					sharedConnected = true;
					cancelReconnect();
					posthog.capture('vtube_studio_connected');
					notifySharedState();
					void client.events.modelLoaded.subscribe(() => {
						void syncModelState(client);
					}, {});
				});
				client.on('disconnect', () => {
					sharedConnected = false;
					sharedParametersReady = false;
					sharedClient = null;
					detachLipSync();
					notifySharedState();
					scheduleReconnect();
				});
				client.on('error', (err) => {
					setError(handleError(err));
				});

				const apiState = await client.apiState();
				if (!apiState.active) {
					throw new Error(
						'API de VTube Studio no activa. Activá "Allow Plugin API access" en VTS.',
					);
				}

				if (!apiState.currentSessionAuthenticated) {
					let token = localStorage.getItem(VTS_TOKEN_KEY);
					if (!token) {
						const tokenResp = await client.authenticationToken({
							pluginName: PLUGIN_NAME,
							pluginDeveloper: PLUGIN_DEVELOPER,
						});
						token = tokenResp.authenticationToken;
						localStorage.setItem(VTS_TOKEN_KEY, token);
					}

					const authResp = await client.authentication({
						pluginName: PLUGIN_NAME,
						pluginDeveloper: PLUGIN_DEVELOPER,
						authenticationToken: token,
					});

					if (!authResp.authenticated) {
						throw new Error(`Autenticación rechazada: ${authResp.reason}`);
					}
				}

				for (const param of LIPSYNC_INPUTS) {
					try {
						await client.parameterCreation({
							parameterName: param.parameterName,
							explanation: param.explanation,
							min: param.min,
							max: param.max,
							defaultValue: param.defaultValue,
						});
					} catch (paramErr) {
						if (paramErr instanceof VTubeStudioError) {
							if (paramErr.data.errorID !== 352) {
								throw paramErr;
							}
						} else {
							throw paramErr;
						}
					}
				}

				// Recién acá se engancha el lip sync. Si se enganchaba en el evento
				// 'connect' quedaba activo durante la autenticación (que la primera vez
				// espera al popup de VTS) y antes de que existieran los parámetros
				// custom, así que toda inyección de esa ventana se perdía.
				sharedParametersReady = true;
				attachLipSync();

				await syncClientState(client);
			};

			sharedConnectPromise = run();

			try {
				await sharedConnectPromise;
			} catch (e) {
				// El reintento automático tras recargar no debe pintar un error si
				// VTS simplemente no está abierto: el usuario no pidió conectar.
				if (!options.silent) {
					setError(handleError(e));
				}
			} finally {
				sharedConnectPromise = null;
				sharedConnecting = false;
				notifySharedState();
			}
		},
		[handleError, scheduleReconnect, syncClientState, syncModelState],
	);

	// Al recargar se pierde el WebSocket con VTS. Si ya hubo emparejamiento (hay
	// token guardado) se reconecta solo: la autenticación es silenciosa y no
	// dispara el popup de VTS. Una sola vez por carga, la dispare quien la dispare.
	useEffect(() => {
		if (sharedAutoConnectTried || sharedClient || typeof window === 'undefined') {
			return;
		}
		if (!window.localStorage.getItem(VTS_TOKEN_KEY)) {
			return;
		}

		sharedAutoConnectTried = true;
		void connect(8001, { silent: true });
	}, [connect]);

	useEffect(() => {
		connectRef.current = connect;
	}, [connect]);

	const disconnect = useCallback(async () => {
		sharedManualDisconnect = true;
		cancelReconnect();
		await sharedClient?.disconnect();
		posthog.capture('vtube_studio_disconnected');
		sharedConnected = false;
		sharedParametersReady = false;
		sharedClient = null;
		detachLipSync();
		notifySharedState();
		setStats(null);
		setModels([]);
		setCurrentModel(null);
		setError(null);
	}, []);

	const loadModel = useCallback(
		async (modelID: string) => {
			const client = clientRef.current;
			if (!client) return;
			setError(null);
			try {
				setModels((prev) =>
					prev.map((model) => ({ ...model, modelLoaded: model.modelID === modelID })),
				);

				await client.modelLoad({ modelID });
				posthog.capture('vtube_studio_model_loaded');

				let modelResp = await client.currentModel();
				for (
					let attempt = 0;
					attempt < 20 && !(modelResp.modelLoaded && modelResp.modelID === modelID);
					attempt++
				) {
					await new Promise((resolve) => setTimeout(resolve, 150));
					modelResp = await client.currentModel();
				}
				if (modelResp.modelLoaded) {
					setCurrentModel(modelResp);
				}

				const [modelsResp, hotkeysResp, expressionsResp] = await Promise.all([
					client.availableModels(),
					client.hotkeysInCurrentModel({}),
					client.expressionState({ details: true }),
				]);
				setModels(modelsResp.availableModels);
				setHotkeys(hotkeysResp.availableHotkeys);
				setExpressions(expressionsResp.expressions);
			} catch (e) {
				setError(handleError(e));
			}
		},
		[handleError],
	);

	const refreshModels = useCallback(async () => {
		if (!clientRef.current) return;
		try {
			const [modelsResp, modelResp] = await Promise.all([
				clientRef.current.availableModels(),
				clientRef.current.currentModel(),
			]);
			setModels(modelsResp.availableModels);
			if (modelResp.modelLoaded) {
				setCurrentModel(modelResp);
			}
		} catch (e) {
			setError(handleError(e));
		}
	}, [handleError]);

	return {
		connecting,
		connected,
		error,
		stats,
		models,
		currentModel,
		folderInfo,
		connect,
		disconnect,
		loadModel,
		refreshModels,
		injectParameters,
		hotkeys,
		expressions,
		triggerHotkey,
		activateExpression,
		setExpressionActive,
		moveModel,
		sendAvatarPayload,
	};
}
