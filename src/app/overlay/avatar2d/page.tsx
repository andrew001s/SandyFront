'use client';

import { Live2dRenderer } from '@/containers/avatar/components/2d/Live2dRenderer';
import { PngTuberRenderer } from '@/containers/avatar/components/2d/PngTuberRenderer';
import {
	DEFAULT_VRM_BACKGROUND_STATE,
	VRM_BACKGROUND_PRESETS,
	type VrmBackgroundState,
	getStoredBackgroundState,
} from '@/lib/avatar/vrmBackground';
import { DEFAULT_AVATAR2D_STATE, avatar2dManager } from '@/lib/avatar2d/avatar2dManager';
import type { Avatar2dState } from '@/lib/avatar2d/types';
import { useEffect, useState } from 'react';

export default function Avatar2dOverlayPage() {
	const [mounted, setMounted] = useState(false);
	const [state, setState] = useState<Avatar2dState>(DEFAULT_AVATAR2D_STATE);
	const [bgState, setBgState] = useState<VrmBackgroundState>(DEFAULT_VRM_BACKGROUND_STATE);

	useEffect(() => {
		setMounted(true);
		setState(avatar2dManager.getState());
		setBgState(getStoredBackgroundState());

		const unsubState = avatar2dManager.subscribe((next) => {
			setState(next);
		});

		avatar2dManager.requestSync();

		const handleStorage = (e: StorageEvent) => {
			if (e.key === 'sandy_vrm_background_state' || e.key === 'sandy_vrm_background_image_data') {
				setBgState(getStoredBackgroundState());
			}
		};
		window.addEventListener('storage', handleStorage);

		return () => {
			unsubState();
			window.removeEventListener('storage', handleStorage);
		};
	}, []);

	// Renderizar la capa de fondo idéntica a la del estudio (evita mismatch de SSR)
	const renderBackgroundLayer = () => {
		if (!mounted) {
			return null;
		}

		// En modo transparencia o checker, mantener 100% transparente para recorte nativo en OBS
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
			{/* Capa de fondo sincronizada */}
			{renderBackgroundLayer()}

			{/* Avatar 2D reactivo sin controles */}
			<div className='relative z-10 h-full w-full'>
				{state.mode === 'pngtuber' ? (
					<PngTuberRenderer config={state.pngtuber} interactive={false} />
				) : (
					<Live2dRenderer config={state.live2d} interactive={false} />
				)}
			</div>
		</main>
	);
}
