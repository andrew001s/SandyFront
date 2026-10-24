'use client';

import { useVTubeStudio } from '@/hooks/useVTubeStudio';
import { AudioQueueManager } from '@/lib/audioQueueSingleton';
import {
	AVATAR_CONFIGS_STORAGE_KEY,
	AVATAR_SOFTWARE_LIST,
	AVATAR_SOFTWARE_STORAGE_KEY,
	DEFAULT_SOFTWARE_CONFIGS,
} from '@/lib/avatar/constants';
import { vnyanClient } from '@/lib/avatar/vnyanClient';
import { createVrmLipSyncHandler } from '@/lib/avatar/vrmLipSync';
import { vrmManager } from '@/lib/avatar/vrmManager';
import { createAvatar2dLipSyncHandler } from '@/lib/avatar2d/avatar2dLipSync';
import { avatar2dManager } from '@/lib/avatar2d/avatar2dManager';
import { createLive2dLipSyncHandler } from '@/lib/avatar2d/live2dLipSync';
import type { AvatarBackendPayload } from '@/lib/vtsAvatarPayload';
import { createVtsLipSyncHandler, stopVtsLipSync } from '@/lib/vtsLipSync';
import type {
	AvatarSoftware,
	AvatarSoftwareConfigs,
	SoftwareConfig,
	SoftwareMeta,
} from '@/types/avatar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export function useAvatar() {
	const vts = useVTubeStudio();

	const [activeSoftware, setActiveSoftware] = useState<AvatarSoftware>(() => {
		if (typeof window === 'undefined') return 'pngtuber';
		const stored = window.localStorage.getItem(
			AVATAR_SOFTWARE_STORAGE_KEY,
		) as AvatarSoftware | null;
		if (
			stored === 'pngtuber' ||
			stored === 'live2d' ||
			stored === 'vrm' ||
			stored === 'vtubestudio'
		) {
			return stored;
		}
		if (stored === 'vseeface' || stored === 'vnyan') return 'vrm';
		return 'pngtuber';
	});
	const [configs, setConfigs] = useState<AvatarSoftwareConfigs>(DEFAULT_SOFTWARE_CONFIGS);
	const [vnyanState, setVnyanState] = useState(vnyanClient.getState());

	const hasAutoConnectedRef = useRef(false);
	const manualDisconnectedRef = useRef(false);

	// Cargar configuración guardada al montar
	useEffect(() => {
		if (typeof window === 'undefined') return;

		const storedSoftware = window.localStorage.getItem(
			AVATAR_SOFTWARE_STORAGE_KEY,
		) as AvatarSoftware | null;
		if (storedSoftware) {
			if (storedSoftware === 'vseeface' || storedSoftware === 'vnyan') {
				setActiveSoftware('vrm');
				window.localStorage.setItem(AVATAR_SOFTWARE_STORAGE_KEY, 'vrm');
			} else if (
				storedSoftware === 'pngtuber' ||
				storedSoftware === 'live2d' ||
				storedSoftware === 'vtubestudio' ||
				storedSoftware === 'vrm'
			) {
				setActiveSoftware(storedSoftware);
				if (storedSoftware === 'pngtuber' || storedSoftware === 'live2d') {
					avatar2dManager.setMode(storedSoftware);
				}
			}
		}

		try {
			const storedConfigs = window.localStorage.getItem(AVATAR_CONFIGS_STORAGE_KEY);
			if (storedConfigs) {
				const parsed = JSON.parse(storedConfigs);
				setConfigs((prev) => ({ ...prev, ...parsed }));
				if (parsed.vnyan?.transitionDurationMs !== undefined) {
					vnyanClient.setTransitionDuration(parsed.vnyan.transitionDurationMs);
				}
			}
		} catch {
			// Ignorar JSON corrupto
		}
	}, []);

	// Suscribirse a cambios de VNyan
	useEffect(() => {
		const unsubscribe = vnyanClient.subscribe(() => {
			setVnyanState(vnyanClient.getState());
		});
		return unsubscribe;
	}, []);

	// Cambiar software activo
	const setSoftware = useCallback(
		(software: AvatarSoftware) => {
			manualDisconnectedRef.current = false;
			const targetSoftware = software === 'vseeface' ? 'vnyan' : software;
			setActiveSoftware(targetSoftware);
			if (typeof window !== 'undefined') {
				window.localStorage.setItem(AVATAR_SOFTWARE_STORAGE_KEY, targetSoftware);
			}

			if (targetSoftware === 'pngtuber' || targetSoftware === 'live2d') {
				avatar2dManager.setMode(targetSoftware);
			}

			// Desconectar el otro software al alternar
			if (activeSoftware === 'vtubestudio' && targetSoftware === 'vnyan') {
				if (vts.connected) {
					void vts.disconnect();
				}
			} else if (activeSoftware === 'vnyan' && targetSoftware === 'vtubestudio') {
				if (vnyanState.connected) {
					vnyanClient.disconnect();
				}
			}
		},
		[activeSoftware, vnyanState.connected, vts],
	);

	// Actualizar configuración
	const updateConfig = useCallback((software: AvatarSoftware, updates: Partial<SoftwareConfig>) => {
		const targetSoftware = software === 'vseeface' ? 'vnyan' : software;
		if (targetSoftware === 'vnyan' && updates.transitionDurationMs !== undefined) {
			vnyanClient.setTransitionDuration(updates.transitionDurationMs);
		}
		setConfigs((prev) => {
			const updated = {
				...prev,
				[targetSoftware]: { ...prev[targetSoftware], ...updates },
			};
			if (typeof window !== 'undefined') {
				window.localStorage.setItem(AVATAR_CONFIGS_STORAGE_KEY, JSON.stringify(updated));
			}
			return updated;
		});
	}, []);

	const is3D =
		activeSoftware === 'vrm' || activeSoftware === 'vnyan' || activeSoftware === 'vseeface';
	const activeConfig = useMemo(
		() => configs[activeSoftware] ?? configs.vrm ?? configs.vnyan,
		[configs, activeSoftware],
	);
	const softwareMeta = useMemo<SoftwareMeta>(() => {
		return AVATAR_SOFTWARE_LIST.find((s) => s.id === activeSoftware) ?? AVATAR_SOFTWARE_LIST[0];
	}, [activeSoftware]);

	const connected = activeSoftware === 'vrm' ? true : is3D ? vnyanState.connected : vts.connected;
	const connecting =
		activeSoftware === 'vrm' ? false : is3D ? vnyanState.connecting : vts.connecting;
	const error = activeSoftware === 'vrm' ? null : is3D ? vnyanState.error : vts.error;

	// Conectar
	const connect = useCallback(
		async (portOrOptions?: number | { port?: number; host?: string }) => {
			manualDisconnectedRef.current = false;
			const targetPort =
				typeof portOrOptions === 'number'
					? portOrOptions
					: (portOrOptions?.port ?? activeConfig.port);

			if (activeSoftware === 'vtubestudio') {
				await vts.connect(targetPort);
			} else {
				await vnyanClient.connect({
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
		manualDisconnectedRef.current = true;
		if (activeSoftware === 'vtubestudio') {
			await vts.disconnect();
		} else {
			vnyanClient.disconnect();
		}
	}, [activeSoftware, vts]);

	// Establecer emoción
	const setEmotion = useCallback(
		async (emotion: string, intensity = 1.0): Promise<void> => {
			if (activeSoftware === 'vrm') {
				vrmManager.setEmotion(emotion, intensity);
			} else if (is3D) {
				await vnyanClient.setEmotion(emotion, intensity);
			} else {
				await vts.activateExpression(emotion);
			}
		},
		[activeSoftware, is3D, vts],
	);

	// Resetear emociones
	const resetEmotions = useCallback(async (): Promise<void> => {
		if (activeSoftware === 'vrm') {
			vrmManager.resetEmotions();
		} else if (is3D) {
			await vnyanClient.resetEmotions();
		}
	}, [activeSoftware, is3D]);

	// Inyectar boca de forma unificada (2D y 3D)
	const injectMouth = useCallback(
		async (open: number, smile: number): Promise<void> => {
			if (activeSoftware === 'vrm') {
				vrmManager.setVowels({ A: open, I: smile });
			} else if (is3D) {
				await vnyanClient.injectMouth(open, smile);
			} else {
				await vts.injectParameters([
					{ id: 'SandyLipOpen', value: open },
					{ id: 'SandyLipSmile', value: smile },
				]);
			}
		},
		[activeSoftware, is3D, vts],
	);

	// Despacho unificado de payload (speech, reaction, emotion)
	const sendAvatarPayload = useCallback(
		async (payload: AvatarBackendPayload): Promise<boolean> => {
			if (activeSoftware === 'vrm') {
				const emotion = String(payload.emotion ?? 'neutral').toLowerCase();
				vrmManager.setEmotion(emotion, payload.intensity ?? 1.0);
				return true;
			}
			if (activeSoftware === 'vtubestudio') {
				return vts.sendAvatarPayload(payload);
			}
			return vnyanClient.sendAvatarPayload(payload);
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
			if (activeSoftware === 'vrm') {
				if (active) {
					vrmManager.setEmotion(nameOrFile, 1.0);
				} else {
					vrmManager.resetEmotions();
				}
				return true;
			}
			if (activeSoftware === 'vtubestudio') {
				return vts.setExpressionActive(nameOrFile, active);
			}
			if (active) {
				await vnyanClient.setEmotion(nameOrFile, 1.0);
			} else {
				await vnyanClient.resetEmotions();
			}
			return true;
		},
		[activeSoftware, vts],
	);

	// Auto-conectar a VNyan solo si está seleccionado ese modo
	useEffect(() => {
		if (
			!hasAutoConnectedRef.current &&
			!manualDisconnectedRef.current &&
			activeSoftware === 'vnyan' &&
			!vnyanState.connected &&
			!vnyanState.connecting
		) {
			hasAutoConnectedRef.current = true;
			void vnyanClient.connect(configs.vnyan).catch(() => {
				// Silencioso en auto-conexión inicial
			});
		}
	}, [activeSoftware, vnyanState.connected, vnyanState.connecting, configs.vnyan]);

	// Coordinación de Lip Sync en tiempo real con AudioQueueManager
	const { connected: vtsConnected, injectParameters: vtsInjectParameters } = vts;

	useEffect(() => {
		const vrmHandler = createVrmLipSyncHandler(async (vowels) => {
			if (activeSoftware === 'vrm') {
				vrmManager.setVowels(vowels);
			} else {
				await vnyanClient.injectVrmVowels(vowels);
			}
		});

		const vtsHandler = createVtsLipSyncHandler(async (params) => {
			await vtsInjectParameters(params);
		});

		const avatar2dHandler = createAvatar2dLipSyncHandler((isSpeaking) => {
			avatar2dManager.setSpeaking(isSpeaking);
		});

		const live2dHandler = createLive2dLipSyncHandler((frame) => {
			avatar2dManager.setMouthParams(frame.mouthOpenY, frame.mouthForm);
			avatar2dManager.setSpeaking(frame.mouthOpenY > 0.05);
		});

		AudioQueueManager.getInstance().setLipSyncHandler({
			prepare: async (blob) => {
				if (
					activeSoftware === 'vrm' ||
					activeSoftware === 'vnyan' ||
					activeSoftware === 'vseeface'
				) {
					await vrmHandler.prepare(blob);
				} else if (activeSoftware === 'pngtuber') {
					await avatar2dHandler.prepare(blob);
				} else if (activeSoftware === 'live2d') {
					await live2dHandler.prepare(blob);
				}
			},
			start: async (blob, clock) => {
				if (activeSoftware === 'vrm') {
					await vrmHandler.start(blob, clock);
				} else if (
					(activeSoftware === 'vnyan' || activeSoftware === 'vseeface') &&
					vnyanState.connected
				) {
					await vrmHandler.start(blob, clock);
				} else if (activeSoftware === 'vtubestudio' && vtsConnected) {
					await vtsHandler(blob, clock);
				} else if (activeSoftware === 'pngtuber') {
					await avatar2dHandler.start(blob, clock);
				} else if (activeSoftware === 'live2d') {
					await live2dHandler.start(blob, clock);
				}
			},
			stop: () => {
				if (
					activeSoftware === 'vrm' ||
					activeSoftware === 'vnyan' ||
					activeSoftware === 'vseeface'
				) {
					vrmHandler.stop();
				} else if (activeSoftware === 'vtubestudio') {
					stopVtsLipSync();
				} else if (activeSoftware === 'pngtuber') {
					avatar2dHandler.stop();
				} else if (activeSoftware === 'live2d') {
					live2dHandler.stop();
				}
			},
		});

		return () => {
			vrmHandler.stop();
			stopVtsLipSync();
			avatar2dHandler.stop();
			live2dHandler.stop();
		};
	}, [activeSoftware, vnyanState.connected, vtsConnected, vtsInjectParameters]);

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

		stats: is3D ? vnyanState.stats : vts.stats,

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
