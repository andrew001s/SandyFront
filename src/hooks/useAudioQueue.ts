import { AudioQueueManager } from '@/lib/audioQueueSingleton';
import { useState, useRef, useCallback, useEffect } from 'react';

interface AudioQueueHook {
	isPlaying: boolean;
	addToQueue: (audioBlob: Blob) => Promise<void>;
	clearQueue: () => void;
}

export const useAudioQueue = (): AudioQueueHook => {
	const [isPlaying, setIsPlaying] = useState(false);
	const managerRef = useRef<AudioQueueManager>(AudioQueueManager.getInstance());

	// Suscribirse a cambios en el estado de reproducción
	useEffect(() => {
		const manager = managerRef.current;
		const unsubscribe = manager.subscribe(setIsPlaying);
		return () => {
			unsubscribe();
		};
	}, []);

	const addToQueue = useCallback(async (audioBlob: Blob) => {
		await managerRef.current.addToQueue(audioBlob);
	}, []);

	const clearQueue = useCallback(() => {
		managerRef.current.clearQueue();
	}, []);

	return {
		isPlaying,
		addToQueue,
		clearQueue,
	};
};
