'use client';

import { useVTubeStudio } from '@/hooks/useVTubeStudio';
import { AudioQueueManager } from '@/lib/audioQueueSingleton';
import {
	AVATAR_CONFIGS_STORAGE_KEY,
	AVATAR_SOFTWARE_LIST,
	AVATAR_SOFTWARE_STORAGE_KEY,
	DEFAULT_SOFTWARE_CONFIGS,
} from '@/lib/avatar/constants';
import { createVrmLipSyncHandler } from '@/lib/avatar/vrmLipSync';
import { vseefaceClient } from '@/lib/avatar/vseefaceClient';
import type { AvatarBackendPayload } from '@/lib/vtsAvatarPayload';
import { createVtsLipSyncHandler, stopVtsLipSync } from '@/lib/vtsLipSync';
import type {
	AvatarSoftware,
	AvatarSoftwareConfigs,
	SoftwareConfig,
	SoftwareMeta,
} from '@/types/avatar';
import { useCallback, useEffect, useMemo, useState } from 'react';

export function useAvatar() {
	const vts = useVTubeStudio();

	const [activeSoftware, setActiveSoftware] = useState<AvatarSoftware>('vtubestudio');
	const [configs, setConfigs] = useState<AvatarSoftwareConfigs>(DEFAULT_SOFTWARE_CONFIGS);
	const [vseefaceState, setVseefaceState] = useState(vseefaceClient.getState());

	// Cargar configuración guardada al montar
	useEffect(() => {
		if (typeof window === 'undefined') return;

		const storedSoftware = window.localStorage.getItem(
			AVATAR_SOFTWARE_STORAGE_KEY,
		) as AvatarSoftware | null;
		if (storedSoftware && (storedSoftware === 'vtubestudio' || storedSoftware === 'vseeface')) {
			setActiveSoftware(storedSoftware);
		}

		try {
			const storedConfigs = window.localStorage.getItem(AVATAR_CONFIGS_STORAGE_KEY);
			if (storedConfigs) {
				const parsed = JSON.parse(storedConfigs);
				setConfigs((prev) => ({ ...prev, ...parsed }));
				if (parsed.vseeface?.transitionDurationMs !== undefined) {
					vseefaceClient.setTransitionDuration(parsed.vseeface.transitionDurationMs);
				}
			}
		} catch {
			// Ignorar JSON corrupto
		}
	}, []);

	// Suscribirse a cambios de VSeeFace
	useEffect(() => {
		const unsubscribe = vseefaceClient.subscribe(() => {
			setVseefaceState(vseefaceClient.getState());
		});
		return unsubscribe;
	}, []);

	// Cambiar software activo
	const setSoftware = useCallback(
		(software: AvatarSoftware) => {
			setActiveSoftware(software);
			if (typeof window !== 'undefined') {
				window.localStorage.setItem(AVATAR_SOFTWARE_STORAGE_KEY, software);
			}

			// Desconectar el otro software al alternar
			if (activeSoftware === 'vtubestudio' && software === 'vseeface') {
				if (vts.connected) {
					void vts.disconnect();
				}
			} else if (activeSoftware === 'vseeface' && software === 'vtubestudio') {
				if (vseefaceState.connected) {
					vseefaceClient.disconnect();
				}
			}
		},
		[activeSoftware, vseefaceState.connected, vts],
	);

	// Actualizar configuración
	const updateConfig = useCallback((software: AvatarSoftware, updates: Partial<SoftwareConfig>) => {
		if (software === 'vseeface' && updates.transitionDurationMs !== undefined) {
			vseefaceClient.setTransitionDuration(updates.transitionDurationMs);
		}
		setConfigs((prev) => {
			const updated = {
				...prev,
				[software]: { ...prev[software], ...updates },
			};
			if (typeof window !== 'undefined') {
				window.localStorage.setItem(AVATAR_CONFIGS_STORAGE_KEY, JSON.stringify(updated));
			}
			return updated;
		});
	}, []);

	const is3D = activeSoftware === 'vseeface';
	const activeConfig = useMemo(() => configs[activeSoftware], [configs, activeSoftware]);
	const softwareMeta = useMemo<SoftwareMeta>(() => {
		return AVATAR_SOFTWARE_LIST.find((s) => s.id === activeSoftware) ?? AVATAR_SOFTWARE_LIST[0];
	}, [activeSoftware]);

	const connected = is3D ? vseefaceState.connected : vts.connected;
	const connecting = is3D ? vseefaceState.connecting : vts.connecting;
	const error = is3D ? vseefaceState.error : vts.error;

	// Conectar
	const connect = useCallback(
		async (portOrOptions?: number | { port?: number; host?: string }) => {
			const targetPort =
				typeof portOrOptions === 'number'
					? portOrOptions
					: (portOrOptions?.port ?? activeConfig.port);

			if (activeSoftware === 'vtubestudio') {
				await vts.connect(targetPort);
			} else {
				await vseefaceClient.connect({
					port: targetPort,
					host:
						typeof portOrOptions === 'object' && portOrOptions.host
							? portOrOptions.host
							: activeConfig.host,
					transitionDurationMs: activeConfig.transitionDurationMs,
				});
			}
		},
		[activeConfig, activeSoftware, vts],
	);

	// Desconectar
	const disconnect = useCallback(async () => {
		if (activeSoftware === 'vtubestudio') {
			await vts.disconnect();
		} else {
			vseefaceClient.disconnect();
		}
	}, [activeSoftware, vts]);

	// Establecer emoción
	const setEmotion = useCallback(
		async (emotion: string, intensity = 1.0): Promise<void> => {
			if (is3D) {
				await vseefaceClient.setEmotion(emotion, intensity);
			} else {
				await vts.activateExpression(emotion);
			}
		},
		[is3D, vts],
	);

	// Resetear emociones
	const resetEmotions = useCallback(async (): Promise<void> => {
		if (is3D) {
			await vseefaceClient.resetEmotions();
		}
	}, [is3D]);

	// Inyectar boca de forma unificada (2D y 3D)
	const injectMouth = useCallback(
		async (open: number, smile: number): Promise<void> => {
			if (is3D) {
				await vseefaceClient.injectMouth(open, smile);
			} else {
				await vts.injectParameters([
					{ id: 'SandyLipOpen', value: open },
					{ id: 'SandyLipSmile', value: smile },
				]);
			}
		},
		[is3D, vts],
	);

	// Despacho unificado de payload (speech, reaction, emotion)
	const sendAvatarPayload = useCallback(
		async (payload: AvatarBackendPayload): Promise<boolean> => {
			if (activeSoftware === 'vtubestudio') {
				return vts.sendAvatarPayload(payload);
			}
			return vseefaceClient.sendAvatarPayload(payload);
		},
		[activeSoftware, vts],
	);

	const triggerHotkey = useCallback(
		async (key: string): Promise<boolean> => {
			if (activeSoftware === 'vtubestudio') {
				return vts.triggerHotkey(key);
			}
			return false;
		},
		[activeSoftware, vts],
	);

	const setExpressionActive = useCallback(
		async (nameOrFile: string, active: boolean): Promise<boolean> => {
			if (activeSoftware === 'vtubestudio') {
				return vts.setExpressionActive(nameOrFile, active);
			}
			if (active) {
				await vseefaceClient.setEmotion(nameOrFile, 1.0);
			} else {
				await vseefaceClient.resetEmotions();
			}
			return true;
		},
		[activeSoftware, vts],
	);

	// Auto-conectar a VSeeFace si está activo y aún no se ha conectado
	useEffect(() => {
		if (activeSoftware === 'vseeface' && !vseefaceState.connected && !vseefaceState.connecting) {
			void vseefaceClient.connect(configs.vseeface).catch(() => {
				// Silencioso en auto-conexión inicial
			});
		}
	}, [activeSoftware, vseefaceState.connected, vseefaceState.connecting, configs.vseeface]);

	// Coordinación de Lip Sync en tiempo real con AudioQueueManager
	useEffect(() => {
		const vrmHandler = createVrmLipSyncHandler(async (vowels) => {
			await vseefaceClient.injectVrmVowels(vowels);
		});

		const vtsHandler = createVtsLipSyncHandler(async (params) => {
			await vts.injectParameters(params);
		});

		AudioQueueManager.getInstance().setLipSyncHandler({
			prepare: async (blob) => {
				if (activeSoftware === 'vseeface') {
					await vrmHandler.prepare(blob);
				}
			},
			start: async (blob, clock) => {
				if (activeSoftware === 'vseeface' && vseefaceState.connected) {
					await vrmHandler.start(blob, clock);
				} else if (activeSoftware === 'vtubestudio' && vts.connected) {
					await vtsHandler(blob, clock);
				}
			},
			stop: () => {
				if (activeSoftware === 'vseeface') {
					vrmHandler.stop();
				} else {
					stopVtsLipSync();
				}
			},
		});

		return () => {
			vrmHandler.stop();
			stopVtsLipSync();
		};
	}, [activeSoftware, vseefaceState.connected, vts.connected, vts.injectParameters]);

	return {
		activeSoftware,
		setSoftware,
		softwareMeta,
		softwareList: AVATAR_SOFTWARE_LIST,
		activeConfig,
		configs,
		updateConfig,
		is3D,

		connected,
		connecting,
		error,
		connect,
		disconnect,
		sendAvatarPayload,
		triggerHotkey,
		setExpressionActive,
		setEmotion,
		resetEmotions,
		injectMouth,

		stats: is3D ? vseefaceState.stats : vts.stats,

		// Propiedades específicas de 2D VTube Studio
		vts: {
			stats: vts.stats,
			models: vts.models,
			currentModel: vts.currentModel,
			folderInfo: vts.folderInfo,
			hotkeys: vts.hotkeys,
			expressions: vts.expressions,
			loadModel: vts.loadModel,
			refreshModels: vts.refreshModels,
			moveModel: vts.moveModel,
			triggerHotkey: vts.triggerHotkey,
			setExpressionActive: vts.setExpressionActive,
			injectParameters: vts.injectParameters,
		},
	};
}
