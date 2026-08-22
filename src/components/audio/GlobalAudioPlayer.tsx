'use client';

import { AudioQueueManager } from '@/lib/audioQueueSingleton';
import { useEffect, useRef } from 'react';

export function GlobalAudioPlayer() {
	const audioRef = useRef<HTMLAudioElement | null>(null);

	useEffect(() => {
		const manager = AudioQueueManager.getInstance();
		manager.setAudioElement(audioRef.current);

		return () => {
			manager.setAudioElement(null);
		};
	}, []);

	return (
		<audio ref={audioRef} preload='auto' className='hidden'>
			<track kind='captions' />
		</audio>
	);
}
