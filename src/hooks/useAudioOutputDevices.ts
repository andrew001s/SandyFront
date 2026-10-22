'use client';

import { AudioQueueManager } from '@/lib/audioQueueSingleton';
import { useCallback, useEffect, useState } from 'react';

export interface AudioOutputDeviceInfo {
	deviceId: string;
	label: string;
	groupId: string;
}

export function useAudioOutputDevices() {
	const [devices, setDevices] = useState<AudioOutputDeviceInfo[]>([]);
	const [primarySinkId, setPrimarySinkIdState] = useState<string>('');
	const [mirrorSinkId, setMirrorSinkIdState] = useState<string>('');
	const [isSupported, setIsSupported] = useState<boolean>(true);
	const [hasPermission, setHasPermission] = useState<boolean>(false);

	const refreshDevices = useCallback(async () => {
		if (typeof window === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
			setIsSupported(false);
			return;
		}

		// Comprobar soporte de setSinkId
		const supported = 'setSinkId' in HTMLMediaElement.prototype;
		setIsSupported(supported);

		try {
			const allDevices = await navigator.mediaDevices.enumerateDevices();
			const outputs = allDevices
				.filter((d) => d.kind === 'audiooutput')
				.map((d, index) => ({
					deviceId: d.deviceId,
					label:
						d.label ||
						(d.deviceId === 'default' ? 'Dispositivo por defecto' : `Salida de audio ${index + 1}`),
					groupId: d.groupId,
				}));

			setDevices(outputs);

			// Detectar si tenemos permiso (las etiquetas no están vacías)
			const hasLabels = allDevices.some((d) => d.label.length > 0);
			setHasPermission(hasLabels);

			// Cargar sinks guardados
			const manager = AudioQueueManager.getInstance();
			const savedPrimary = manager.getPrimarySinkId();
			const savedMirror = manager.getMirrorSinkId();

			setPrimarySinkIdState(savedPrimary);
			setMirrorSinkIdState(savedMirror);
		} catch {
			// Ignorar fallos de enumeración si no hay soporte o permisos
		}
	}, []);

	useEffect(() => {
		void refreshDevices();

		if (typeof window !== 'undefined' && navigator.mediaDevices) {
			navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
			return () => {
				navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
			};
		}
	}, [refreshDevices]);

	const requestPermission = useCallback(async () => {
		try {
			if (navigator.mediaDevices?.getUserMedia) {
				const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
				// Liberar el stream inmediatamente
				for (const track of stream.getTracks()) {
					track.stop();
				}
				await refreshDevices();
				return true;
			}
		} catch {
			// Permiso denegado
		}
		return false;
	}, [refreshDevices]);

	const setPrimarySink = useCallback(async (deviceId: string) => {
		setPrimarySinkIdState(deviceId);
		await AudioQueueManager.getInstance().setPrimarySinkId(deviceId);
	}, []);

	const setMirrorSink = useCallback(async (deviceId: string) => {
		setMirrorSinkIdState(deviceId);
		await AudioQueueManager.getInstance().setMirrorSinkId(deviceId);
	}, []);

	const testDevice = useCallback(async (deviceId: string) => {
		try {
			const audioCtx = new AudioContext();
			const osc = audioCtx.createOscillator();
			const gain = audioCtx.createGain();

			osc.type = 'sine';
			osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
			osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.12); // E5
			osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.24); // G5

			gain.gain.setValueAtTime(0, audioCtx.currentTime);
			gain.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.05);
			gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);

			osc.connect(gain);

			// Intentar setSinkId en AudioContext si el navegador lo soporta
			if (deviceId && 'setSinkId' in audioCtx) {
				await (audioCtx as unknown as { setSinkId: (id: string) => Promise<void> }).setSinkId(
					deviceId,
				);
			}

			gain.connect(audioCtx.destination);
			osc.start();
			osc.stop(audioCtx.currentTime + 0.5);

			setTimeout(() => {
				void audioCtx.close();
			}, 600);
		} catch {
			// Ignorar fallo de reproducción de tono de prueba
		}
	}, []);

	return {
		devices,
		primarySinkId,
		mirrorSinkId,
		isSupported,
		hasPermission,
		setPrimarySink,
		setMirrorSink,
		requestPermission,
		refreshDevices,
		testDevice,
	};
}
