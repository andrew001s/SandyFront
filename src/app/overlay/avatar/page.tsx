'use client';

import {
	DEFAULT_VRM_BACKGROUND_STATE,
	VRM_BACKGROUND_PRESETS,
	type VrmBackgroundState,
} from '@/lib/avatar/vrmBackground';
import { vrmManager } from '@/lib/avatar/vrmManager';
import { VrmViewer } from '@/lib/avatar/vrmViewer';
import { useEffect, useRef, useState } from 'react';

export default function AvatarOverlayPage() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const viewerRef = useRef<VrmViewer | null>(null);
	const [mounted, setMounted] = useState(false);
	const [bgState, setBgState] = useState<VrmBackgroundState>(DEFAULT_VRM_BACKGROUND_STATE);

	useEffect(() => {
		setMounted(true);
		setBgState(vrmManager.getBackground());

		const canvas = canvasRef.current;
		if (!canvas) return;

		const viewer = new VrmViewer({
			canvas,
			transparent: true,
		});
		viewerRef.current = viewer;

		const unregisterViewer = vrmManager.registerViewer(viewer);
		const unregisterBg = vrmManager.subscribeBackground((next) => {
			setBgState(next);
		});

		// Pedir sincronización activa al estudio
		vrmManager.requestSync();

		const handleResize = () => {
			viewer.resize(window.innerWidth, window.innerHeight);
		};

		window.addEventListener('resize', handleResize);
		handleResize();

		return () => {
			window.removeEventListener('resize', handleResize);
			unregisterViewer();
			unregisterBg();
			viewer.dispose();
			viewerRef.current = null;
		};
	}, []);

	// Renderizar la capa de fondo idéntica a la del estudio (evita mismatch de SSR)
	const renderBackgroundLayer = () => {
		if (!mounted) {
			return null;
		}

		// En modo transparencia de cuadrícula, mantener fondo 100% transparente para recorte OBS
		if (bgState.mode === 'preset' && bgState.presetId === 'checker') {
			return null;
		}

		if (bgState.mode === 'color') {
			return (
				<div
					className='absolute inset-0 transition-colors duration-300'
					style={{ backgroundColor: bgState.customColor }}
				/>
			);
		}

		if (bgState.mode === 'image' && bgState.imageUrl) {
			return (
				<>
					<div
						className='absolute inset-0 transition-all duration-300'
						style={{
							backgroundImage: `url("${bgState.imageUrl}")`,
							backgroundSize: bgState.imageFit,
							backgroundPosition: 'center',
							backgroundRepeat: 'no-repeat',
							filter: bgState.imageBlur > 0 ? `blur(${bgState.imageBlur}px)` : undefined,
							transform: bgState.imageBlur > 0 ? 'scale(1.04)' : undefined,
						}}
					/>
					{bgState.imageDim > 0 && (
						<div
							className='pointer-events-none absolute inset-0 bg-black transition-opacity'
							style={{ opacity: bgState.imageDim }}
						/>
					)}
				</>
			);
		}

		// Presets
		const match =
			VRM_BACKGROUND_PRESETS.find((p) => p.id === bgState.presetId) || VRM_BACKGROUND_PRESETS[0];

		if (match.backgroundColor) {
			return (
				<div
					className='absolute inset-0 transition-colors duration-300'
					style={{ backgroundColor: match.backgroundColor }}
				/>
			);
		}

		return <div className={`absolute inset-0 transition-all duration-300 ${match.styleClass}`} />;
	};

	return (
		<main className='fixed inset-0 m-0 h-screen w-screen overflow-hidden bg-transparent p-0'>
			{/* Capa de fondo sincronizada en tiempo real con el estudio */}
			{renderBackgroundLayer()}

			{/* Canvas WebGL 3D sin controles */}
			<canvas
				ref={canvasRef}
				className='relative z-10 block h-full w-full'
				style={{ background: 'transparent' }}
			/>
		</main>
	);
}
