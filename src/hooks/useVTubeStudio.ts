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

let sharedClient: ApiClient | null = null;
let sharedConnected = false;

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

	const injectParameters = useCallback(async (params: { id: string; value: number }[]) => {
		const client = clientRef.current;
		if (!client) return;
		await client.injectParameterData({
			mode: 'set',
			parameterValues: params.map((p) => ({
				id: p.id,
				value: p.value,
			})),
		});
	}, []);

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
		clientRef.current = sharedClient;
		setConnected(sharedConnected);

		if (sharedClient && sharedConnected) {
			void syncClientState(sharedClient);
			AudioQueueManager.getInstance().setLipSyncHandler(createVtsLipSyncHandler(injectParameters));
		}
	}, [injectParameters, syncClientState]);

	const connect = useCallback(
		async (port = 8001) => {
			if (connecting) return;
			setConnecting(true);
			setError(null);

			try {
				if (sharedClient && sharedConnected) {
					clientRef.current = sharedClient;
					setConnected(true);
					AudioQueueManager.getInstance().setLipSyncHandler(
						createVtsLipSyncHandler(injectParameters),
					);
					await syncClientState(sharedClient);
					return;
				}

				if (sharedClient && !sharedConnected) {
					try {
						await sharedClient.disconnect();
					} catch {
						// Ignore stale client teardown errors.
					}
				}

				const client = new ApiClient({
					pluginName: PLUGIN_NAME,
					pluginDeveloper: PLUGIN_DEVELOPER,
					authTokenGetter: () => localStorage.getItem('vts_auth_token'),
					authTokenSetter: async (token) => {
						localStorage.setItem('vts_auth_token', token);
					},
					port,
					pluginIcon: undefined,
				});

				clientRef.current = client;
				sharedClient = client;

				client.on('connect', () => {
					sharedConnected = true;
					posthog.capture('vtube_studio_connected');
					setConnected(true);
					AudioQueueManager.getInstance().setLipSyncHandler(
						createVtsLipSyncHandler(injectParameters),
					);
					void client.events.modelLoaded.subscribe(() => {
						void syncModelState(client);
					}, {});
				});
				client.on('disconnect', () => {
					sharedConnected = false;
					setConnected(false);
					AudioQueueManager.getInstance().setLipSyncHandler(null);
					stopVtsLipSync();
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
					let token = localStorage.getItem('vts_auth_token');
					if (!token) {
						const tokenResp = await client.authenticationToken({
							pluginName: PLUGIN_NAME,
							pluginDeveloper: PLUGIN_DEVELOPER,
						});
						token = tokenResp.authenticationToken;
						localStorage.setItem('vts_auth_token', token);
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

				await syncClientState(client);
			} catch (e) {
				const msg = handleError(e);
				setError(msg);
			} finally {
				setConnecting(false);
			}
		},
		[connecting, handleError, injectParameters, syncClientState, syncModelState],
	);

	const disconnect = useCallback(async () => {
		await clientRef.current?.disconnect();
		posthog.capture('vtube_studio_disconnected');
		sharedConnected = false;
		sharedClient = null;
		clientRef.current = null;
		AudioQueueManager.getInstance().setLipSyncHandler(null);
		stopVtsLipSync();
		setConnected(false);
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
