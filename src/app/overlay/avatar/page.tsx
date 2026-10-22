'use client';

import { vrmManager } from '@/lib/avatar/vrmManager';
import { VrmViewer } from '@/lib/avatar/vrmViewer';
import { useEffect, useRef } from 'react';

export default function AvatarOverlayPage() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const viewerRef = useRef<VrmViewer | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const viewer = new VrmViewer({
			canvas,
			transparent: true,
		});
		viewerRef.current = viewer;

		const unregister = vrmManager.registerViewer(viewer);

		const handleResize = () => {
			viewer.resize(window.innerWidth, window.innerHeight);
		};

		window.addEventListener('resize', handleResize);
		handleResize();

		return () => {
			window.removeEventListener('resize', handleResize);
			unregister();
			viewer.dispose();
			viewerRef.current = null;
		};
	}, []);

	return (
		<main className='fixed inset-0 m-0 h-screen w-screen overflow-hidden bg-transparent p-0'>
			<canvas
				ref={canvasRef}
				className='block h-full w-full'
				style={{ background: 'transparent' }}
			/>
		</main>
	);
}
