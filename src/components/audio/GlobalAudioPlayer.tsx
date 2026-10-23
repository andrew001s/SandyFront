'use client';

import { AudioQueueManager } from '@/lib/audioQueueSingleton';
import { useEffect, useRef } from 'react';

export function GlobalAudioPlayer() {
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const mirrorAudioRef = useRef<HTMLAudioElement | null>(null);

	useEffect(() => {
		const manager = AudioQueueManager.getInstance();
		manager.setAudioElement(audioRef.current, mirrorAudioRef.current);

		return () => {
			manager.setAudioElement(null, null);
		};
	}, []);

	return (
		<>
			<audio ref={audioRef} preload='auto' className='hidden'>
				<track kind='captions' />
			</audio>
			<audio ref={mirrorAudioRef} preload='auto' className='hidden'>
				<track kind='captions' />
			</audio>
		</>
	);
}
