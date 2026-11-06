'use client';

import { useVTubeStudio } from '@/hooks/useVTubeStudio';
import { AudioQueueManager } from '@/lib/audioQueueSingleton';
import {
	AVATAR_CONFIGS_STORAGE_KEY,
	AVATAR_SOFTWARE_LIST,
	AVATAR_SOFTWARE_STORAGE_KEY,
	DEFAULT_SOFTWARE_CONFIGS,
} from '@/lib/avatar/constants';
import { getScopedAutomaticReactionConfig } from '@/lib/avatar/reactionMappings';
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

const AVATAR_SOFTWARE_CHANGE_EVENT = 'sandy:avatar-software-change';
const SUPPORTED_AVATAR_SOFTWARES: AvatarSoftware[] = ['pngtuber', 'live2d', 'vtubestudio', 'vrm'];

export function useAvatar() {
	const vts = useVTubeStudio();

	const [activeSoftware, setActiveSoftware] = useState<AvatarSoftware>('pngtuber');
	const [configs, setConfigs] = useState<AvatarSoftwareConfigs>(DEFAULT_SOFTWARE_CONFIGS);
	const activeVtsReactionsRef = useRef<string[]>([]);
	const automaticReactionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const automaticReactionPendingRef = useRef(false);
	const automaticReactionHasSpeechRef = useRef(false);
	const resetEmotionsRef = useRef<() => Promise<void>>(async () => undefined);
	useEffect(
		() => () => {
			if (automaticReactionTimerRef.current) clearTimeout(automaticReactionTimerRef.current);
		},
		[],
	);

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
			}
		} catch {
			// Ignorar JSON corrupto
		}
	}, []);

	// AvatarContainer, Chat y otros consumidores tienen instancias independientes del hook.
	// El evento sincroniza el formato activo entre ellas dentro de la misma pestaña.
	useEffect(() => {
		const handleSoftwareChange = (event: Event) => {
			const software = (event as CustomEvent<AvatarSoftware>).detail;
			if (!SUPPORTED_AVATAR_SOFTWARES.includes(software)) return;
			setActiveSoftware(software);
			if (software === 'pngtuber' || software === 'live2d') {
				avatar2dManager.setMode(software);
			}
		};

		window.addEventListener(AVATAR_SOFTWARE_CHANGE_EVENT, handleSoftwareChange);
		return () => window.removeEventListener(AVATAR_SOFTWARE_CHANGE_EVENT, handleSoftwareChange);
	}, []);

	// Cambiar software activo
	const setSoftware = useCallback(
		(software: AvatarSoftware) => {
			const targetSoftware = software === 'vseeface' || software === 'vnyan' ? 'vrm' : software;
			automaticReactionPendingRef.current = false;
			automaticReactionHasSpeechRef.current = false;
			if (automaticReactionTimerRef.current) {
				clearTimeout(automaticReactionTimerRef.current);
				automaticReactionTimerRef.current = null;
			}
			const baseConfig = getScopedAutomaticReactionConfig('neutral', activeSoftware);
			if (activeSoftware === 'vrm') {
				if (baseConfig.expressions.length) {
					vrmManager.setEmotions(baseConfig.expressions, baseConfig.intensity);
				} else {
					vrmManager.resetEmotions();
				}
			} else if (activeSoftware === 'pngtuber') {
				avatar2dManager.setEmotion(baseConfig.expressions[0] ?? 'neutral');
			} else if (activeSoftware === 'live2d') {
				avatar2dManager.setLive2dExpressions(baseConfig.expressions);
			} else if (activeSoftware === 'vtubestudio') {
				for (const expression of activeVtsReactionsRef.current) {
					void vts.setExpressionActive(expression, false);
				}
				activeVtsReactionsRef.current = [];
				for (const expression of baseConfig.expressions) {
					void vts.activateExpression(expression);
					activeVtsReactionsRef.current.push(expression);
				}
			}

			const targetBaseConfig = getScopedAutomaticReactionConfig('neutral', targetSoftware);
			if (targetSoftware === 'vrm') {
				if (targetBaseConfig.expressions.length) {
					vrmManager.setEmotions(targetBaseConfig.expressions, targetBaseConfig.intensity);
				} else {
					vrmManager.resetEmotions();
				}
			} else if (targetSoftware === 'pngtuber') {
				avatar2dManager.setEmotion(targetBaseConfig.expressions[0] ?? 'neutral');
			} else if (targetSoftware === 'live2d') {
				avatar2dManager.setLive2dExpressions(targetBaseConfig.expressions);
			} else if (targetSoftware === 'vtubestudio') {
				activeVtsReactionsRef.current = [];
				for (const expression of targetBaseConfig.expressions) {
					void vts.activateExpression(expression);
					activeVtsReactionsRef.current.push(expression);
				}
			}
			setActiveSoftware(targetSoftware);
			if (typeof window !== 'undefined') {
				window.localStorage.setItem(AVATAR_SOFTWARE_STORAGE_KEY, targetSoftware);
				window.dispatchEvent(
					new CustomEvent<AvatarSoftware>(AVATAR_SOFTWARE_CHANGE_EVENT, {
						detail: targetSoftware,
					}),
				);
			}

			if (targetSoftware === 'pngtuber' || targetSoftware === 'live2d') {
				avatar2dManager.setMode(targetSoftware);
			}

			// Desconectar VTube Studio al alternar a otro software
			if (activeSoftware === 'vtubestudio' && targetSoftware !== 'vtubestudio') {
				if (vts.connected) {
					void vts.disconnect();
				}
			}
		},
		[activeSoftware, vts],
	);

	// Actualizar configuración
	const updateConfig = useCallback((software: AvatarSoftware, updates: Partial<SoftwareConfig>) => {
		const targetSoftware = software === 'vseeface' || software === 'vnyan' ? 'vrm' : software;
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

	const is3D = activeSoftware === 'vrm';
	const activeConfig = useMemo(
		() => configs[activeSoftware] ?? configs.vrm,
		[configs, activeSoftware],
	);
	const softwareMeta = useMemo<SoftwareMeta>(() => {
		return AVATAR_SOFTWARE_LIST.find((s) => s.id === activeSoftware) ?? AVATAR_SOFTWARE_LIST[0];
	}, [activeSoftware]);

	const connected = activeSoftware === 'vtubestudio' ? vts.connected : true;
	const connecting = activeSoftware === 'vtubestudio' ? vts.connecting : false;
	const error = activeSoftware === 'vtubestudio' ? vts.error : null;

	// Conectar
	const connect = useCallback(
		async (portOrOptions?: number | { port?: number; host?: string }) => {
			if (activeSoftware !== 'vtubestudio') return;
			const targetPort =
				typeof portOrOptions === 'number'
					? portOrOptions
					: (portOrOptions?.port ?? activeConfig.port);

			await vts.connect(targetPort);
		},
		[activeConfig, activeSoftware, vts],
	);

	// Desconectar
	const disconnect = useCallback(async () => {
		if (activeSoftware === 'vtubestudio') {
			await vts.disconnect();
		}
	}, [activeSoftware, vts]);

	// Establecer emoción
	const setEmotion = useCallback(
		async (emotion: string, intensity = 1.0): Promise<void> => {
			if (activeSoftware === 'vrm') {
				vrmManager.setEmotion(emotion, intensity);
			} else if (activeSoftware === 'pngtuber') {
				avatar2dManager.setEmotion(emotion);
			} else if (activeSoftware === 'live2d') {
				avatar2dManager.setLive2dExpression(emotion);
			} else {
				if (activeSoftware === 'vtubestudio') {
					activeVtsReactionsRef.current = [emotion];
				}
				await vts.activateExpression(emotion);
			}
		},
		[activeSoftware, vts],
	);

	// Resetear emociones
	const resetEmotions = useCallback(async (): Promise<void> => {
		if (automaticReactionTimerRef.current) {
			clearTimeout(automaticReactionTimerRef.current);
			automaticReactionTimerRef.current = null;
		}
		automaticReactionPendingRef.current = false;
		automaticReactionHasSpeechRef.current = false;
		const baseConfig = getScopedAutomaticReactionConfig('neutral', activeSoftware);
		if (activeSoftware === 'vrm') {
			if (baseConfig.expressions.length) {
				vrmManager.setEmotions(baseConfig.expressions, baseConfig.intensity);
			} else {
				vrmManager.resetEmotions();
			}
		} else if (activeSoftware === 'pngtuber') {
			avatar2dManager.setEmotion(baseConfig.expressions[0] ?? 'neutral');
		} else if (activeSoftware === 'live2d') {
			avatar2dManager.setLive2dExpressions(baseConfig.expressions);
		} else if (activeSoftware === 'vtubestudio') {
			for (const expression of activeVtsReactionsRef.current) {
				await vts.setExpressionActive(expression, false);
			}
			activeVtsReactionsRef.current = [];
			for (const expression of baseConfig.expressions) {
				await vts.activateExpression(expression);
				activeVtsReactionsRef.current.push(expression);
			}
		}
	}, [activeSoftware, vts]);

	useEffect(() => {
		resetEmotionsRef.current = resetEmotions;
	}, [resetEmotions]);

	useEffect(() => {
		if (activeSoftware === 'pngtuber' || activeSoftware === 'live2d') {
			void resetEmotionsRef.current();
		}
	}, [activeSoftware]);

	useEffect(() => {
		const audioQueue = AudioQueueManager.getInstance();
		return audioQueue.subscribeSpeechState((active) => {
			if (active) {
				if (!automaticReactionPendingRef.current) return;
				automaticReactionHasSpeechRef.current = true;
				if (automaticReactionTimerRef.current) {
					clearTimeout(automaticReactionTimerRef.current);
					automaticReactionTimerRef.current = null;
				}
				return;
			}

			if (automaticReactionPendingRef.current && automaticReactionHasSpeechRef.current) {
				automaticReactionPendingRef.current = false;
				automaticReactionHasSpeechRef.current = false;
				if (automaticReactionTimerRef.current) {
					clearTimeout(automaticReactionTimerRef.current);
					automaticReactionTimerRef.current = null;
				}
				void resetEmotionsRef.current();
			}
		});
	}, []);

	// Inyectar boca de forma unificada (2D y 3D)
	const injectMouth = useCallback(
		async (open: number, smile: number): Promise<void> => {
			if (activeSoftware === 'vrm') {
				vrmManager.setVowels({ A: open, I: smile });
			} else if (activeSoftware === 'pngtuber' || activeSoftware === 'live2d') {
				avatar2dManager.setMouthParams(open, smile);
			} else {
				await vts.injectParameters([
					{ id: 'SandyLipOpen', value: open },
					{ id: 'SandyLipSmile', value: smile },
				]);
			}
		},
		[activeSoftware, vts],
	);

	// Despacho unificado de payload (speech, reaction, emotion)
	const sendAvatarPayload = useCallback(
		async (payload: AvatarBackendPayload): Promise<boolean> => {
			const emotion = String(payload.emotion ?? payload.expression ?? '').toLowerCase();
			if (emotion && getScopedAutomaticReactionConfig(emotion, activeSoftware).enabled === false) {
				await resetEmotions();
				return true;
			}
			const selectedConfig =
				payload.reaction && payload.emotion
					? getScopedAutomaticReactionConfig(payload.emotion, activeSoftware)
					: { expressions: [], intensity: 1 };
			const selectedExpressions = selectedConfig.expressions;
			const selectedExpression = selectedExpressions[0];
			const fallbackReactionExpression =
				payload.reaction === true &&
				(activeSoftware === 'pngtuber' || activeSoftware === 'live2d') &&
				String(payload.expression ?? payload.emotion ?? '').toLowerCase() !== 'neutral'
					? (payload.expression ?? payload.emotion ?? undefined)
					: undefined;
			const resolvedReactionExpression = selectedExpression ?? fallbackReactionExpression;
			const hasReactionDecision = typeof payload.reaction === 'boolean';
			if (hasReactionDecision) {
				if (automaticReactionTimerRef.current) {
					clearTimeout(automaticReactionTimerRef.current);
					automaticReactionTimerRef.current = null;
				}
				automaticReactionPendingRef.current = false;
				automaticReactionHasSpeechRef.current = false;
				await resetEmotions();
				if (!payload.reaction || !resolvedReactionExpression) return true;
			}
			const resolvedPayload = hasReactionDecision
				? resolvedReactionExpression
					? {
							...payload,
							emotion: resolvedReactionExpression,
							expression: resolvedReactionExpression,
						}
					: { ...payload, emotion: undefined, expression: null }
				: payload;
			if (
				activeSoftware === 'vtubestudio' &&
				hasReactionDecision &&
				selectedExpressions.length > 0 &&
				activeVtsReactionsRef.current.length > 0
			) {
				for (const expression of activeVtsReactionsRef.current) {
					await vts.setExpressionActive(expression, false);
				}
				activeVtsReactionsRef.current = [];
			}

			let sent = false;
			switch (activeSoftware) {
				case 'vrm': {
					if (hasReactionDecision && selectedExpressions.length > 0) {
						vrmManager.setEmotions(selectedExpressions, selectedConfig.intensity);
					} else {
						const emotion = String(resolvedPayload.emotion ?? 'neutral').toLowerCase();
						vrmManager.setEmotion(emotion, resolvedPayload.intensity ?? 1.0);
					}
					sent = true;
					break;
				}
				case 'pngtuber': {
					const emotion = String(resolvedPayload.emotion ?? 'neutral').toLowerCase();
					avatar2dManager.setEmotion(emotion);
					sent = true;
					break;
				}
				case 'live2d': {
					if (hasReactionDecision && selectedExpressions.length > 0) {
						avatar2dManager.setLive2dExpressions(selectedExpressions);
					} else {
						const expression = resolvedPayload.expression ?? resolvedPayload.emotion ?? null;
						avatar2dManager.setLive2dExpression(expression ? String(expression) : null);
					}
					sent = true;
					break;
				}
				case 'vtubestudio': {
					sent = await vts.sendAvatarPayload(resolvedPayload);
					if (sent && hasReactionDecision && selectedExpressions.length > 0) {
						for (const expression of selectedExpressions.slice(1)) {
							await vts.activateExpression(expression);
						}
						activeVtsReactionsRef.current = selectedExpressions;
					}
					break;
				}
				case 'vnyan':
				case 'vseeface':
					return false;
			}

			if (hasReactionDecision && selectedExpression && sent) {
				automaticReactionPendingRef.current = true;
				automaticReactionHasSpeechRef.current = AudioQueueManager.getInstance().isSpeechActive();
				const durationMs = Math.max(3000, payload.durationMs ?? 3000);
				automaticReactionTimerRef.current = setTimeout(() => {
					automaticReactionTimerRef.current = null;
					if (automaticReactionPendingRef.current && !automaticReactionHasSpeechRef.current) {
						automaticReactionPendingRef.current = false;
						void resetEmotionsRef.current();
					}
				}, durationMs);
			}
			return sent;
		},
		[activeSoftware, resetEmotions, vts],
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
			if (activeSoftware === 'pngtuber') {
				avatar2dManager.setEmotion(active ? nameOrFile : 'neutral');
				return true;
			}
			if (activeSoftware === 'live2d') {
				avatar2dManager.setLive2dExpression(active ? nameOrFile : null);
				return true;
			}
			return false;
		},
		[activeSoftware, vts],
	);

	// Coordinación de Lip Sync en tiempo real con AudioQueueManager
	const { connected: vtsConnected, injectParameters: vtsInjectParameters } = vts;

	useEffect(() => {
		const vrmHandler = createVrmLipSyncHandler((vowels) => {
			vrmManager.setVowels(vowels);
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
				if (activeSoftware === 'vrm') {
					await vrmHandler.prepare(blob);
				} else if (activeSoftware === 'pngtuber') {
					await avatar2dHandler.prepare(blob);
				} else if (activeSoftware === 'live2d' && !vtsConnected) {
					await live2dHandler.prepare(blob);
				}
			},
			start: async (blob, clock) => {
				if (activeSoftware === 'vrm') {
					await vrmHandler.start(blob, clock);
				} else if (activeSoftware === 'vtubestudio' && vtsConnected) {
					await vtsHandler(blob, clock);
				} else if (activeSoftware === 'pngtuber') {
					await avatar2dHandler.start(blob, clock);
				} else if (activeSoftware === 'live2d') {
					if (vtsConnected) await vtsHandler(blob, clock);
					else await live2dHandler.start(blob, clock);
				}
			},
			stop: () => {
				if (activeSoftware === 'vrm') {
					vrmHandler.stop();
				} else if (activeSoftware === 'vtubestudio') {
					stopVtsLipSync();
				} else if (activeSoftware === 'pngtuber') {
					avatar2dHandler.stop();
				} else if (activeSoftware === 'live2d') {
					live2dHandler.stop();
					if (vtsConnected) stopVtsLipSync();
				}
			},
		});

		return () => {
			vrmHandler.stop();
			stopVtsLipSync();
			avatar2dHandler.stop();
			live2dHandler.stop();
		};
	}, [activeSoftware, vtsConnected, vtsInjectParameters]);

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

		stats: vts.stats,

		// Propiedades específicas de 2D VTube Studio
		vts: {
			connected: vts.connected,
			connecting: vts.connecting,
			error: vts.error,
			connect: vts.connect,
			disconnect: vts.disconnect,
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
