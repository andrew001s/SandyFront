'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiClient, VTubeStudioError } from 'vtubestudio';

interface VTSModel {
	modelLoaded: boolean;
	modelName: string;
	modelID: string;
	vtsModelName: string;
	vtsModelIconName: string;
}

interface VTSModelInfo {
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

interface VTSStats {
	uptime: number;
	framerate: number;
	vTubeStudioVersion: string;
}

interface UseVTSReturn {
	connecting: boolean;
	connected: boolean;
	error: string | null;
	stats: VTSStats | null;
	models: VTSModel[];
	currentModel: VTSModelInfo | null;
	connect: (port?: number) => Promise<void>;
	disconnect: () => Promise<void>;
	loadModel: (modelID: string) => Promise<void>;
	refreshModels: () => Promise<void>;
	injectParameters: (params: { id: string; value: number }[]) => Promise<void>;
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

export function useVTubeStudio(): UseVTSReturn {
	const [connecting, setConnecting] = useState(false);
	const [connected, setConnected] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [stats, setStats] = useState<VTSStats | null>(null);
	const [models, setModels] = useState<VTSModel[]>([]);
	const [currentModel, setCurrentModel] = useState<VTSModelInfo | null>(null);
	const clientRef = useRef<ApiClient | null>(null);

	useEffect(() => {
		return () => {
			clientRef.current?.disconnect();
		};
	}, []);

	const handleError = useCallback((e: unknown) => {
		if (e instanceof VTubeStudioError) {
			return `VTS Error [${e.data.errorID}]: ${e.data.message}`;
		}
		if (e instanceof Error) return e.message;
		return 'Error desconocido';
	}, []);

	const connect = useCallback(
		async (port = 8001) => {
			if (connecting) return;
			setConnecting(true);
			setError(null);

			try {
				clientRef.current?.disconnect();

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

				client.on('connect', () => {
					setConnected(true);
				});
				client.on('disconnect', () => {
					setConnected(false);
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

				const [statsResp, modelsResp, modelResp] = await Promise.all([
					client.statistics(),
					client.availableModels(),
					client.currentModel(),
				]);

				setStats(statsResp);
				setModels(modelsResp.availableModels);
				if (modelResp.modelLoaded) {
					setCurrentModel(modelResp);
				}
			} catch (e) {
				const msg = handleError(e);
				setError(msg);
			} finally {
				setConnecting(false);
			}
		},
		[connecting, handleError],
	);

	const disconnect = useCallback(async () => {
		await clientRef.current?.disconnect();
		clientRef.current = null;
		setConnected(false);
		setStats(null);
		setModels([]);
		setCurrentModel(null);
		setError(null);
	}, []);

	const loadModel = useCallback(
		async (modelID: string) => {
			if (!clientRef.current) return;
			setError(null);
			try {
				await clientRef.current.modelLoad({ modelID });
				const modelResp = await clientRef.current.currentModel();
				if (modelResp.modelLoaded) {
					setCurrentModel(modelResp);
				}
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

	return {
		connecting,
		connected,
		error,
		stats,
		models,
		currentModel,
		connect,
		disconnect,
		loadModel,
		refreshModels,
		injectParameters,
	};
}
