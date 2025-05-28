import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioQueueManager } from '@/lib/audioQueueSingleton';

interface AudioQueueHook {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  addToQueue: (audioBlob: Blob) => Promise<void>;
  clearQueue: () => void;
}

export const useAudioQueue = (): AudioQueueHook => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const managerRef = useRef<AudioQueueManager>(AudioQueueManager.getInstance());

  // Configurar el elemento de audio
  useEffect(() => {
    const currentAudioRef = audioRef.current;
    const manager = managerRef.current;
    
    if (currentAudioRef) {
      manager.setAudioElement(currentAudioRef);
    }

    return () => {
      manager.setAudioElement(null);
    };
  }, []);

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
    audioRef,
    isPlaying,
    addToQueue,
    clearQueue
  };
};
