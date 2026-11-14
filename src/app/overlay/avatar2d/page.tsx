'use client';

import { Live2dRenderer } from '@/containers/avatar/components/2d/Live2dRenderer';
import { PngTuberRenderer } from '@/containers/avatar/components/2d/PngTuberRenderer';
import { SupportWatermark } from '@/containers/avatar/components/common/SupportWatermark';
import {
	DEFAULT_VRM_BACKGROUND_STATE,
	VRM_BACKGROUND_PRESETS,
	type VrmBackgroundState,
} from '@/lib/avatar/vrmBackground';
import { vrmManager } from '@/lib/avatar/vrmManager';
import { avatar2dManager } from '@/lib/avatar2d/avatar2dManager';
import { restoreSavedLive2dModel } from '@/lib/avatar2d/live2dModel';
import type { Avatar2dState } from '@/lib/avatar2d/types';
import { useEffect, useState } from 'react';

export default function Avatar2dOverlayPage() {
	const [state, setState] = useState<Avatar2dState | null>(null);
	const [bgState, setBgState] = useState<VrmBackgroundState>(DEFAULT_VRM_BACKGROUND_STATE);

	useEffect(() => {
		const unsubscribe = avatar2dManager.subscribe(setState);
		avatar2dManager.requestSync();
		setBgState(vrmManager.getBackground());
		const unsubscribeBackground = vrmManager.subscribeBackground(setBgState);
		vrmManager.requestSync();
		return () => {
			unsubscribe();
			unsubscribeBackground();
		};
	}, []);

	useEffect(() => {
		if (state?.mode !== 'live2d') return;
		void restoreSavedLive2dModel().catch((error) => {
			console.error('No se pudo restaurar el modelo Live2D del overlay:', error);
		});
	}, [state?.mode]);

	const renderBackgroundLayer = () => {
		if (bgState.mode === 'preset' && bgState.presetId === 'checker') return null;
		if (bgState.mode === 'color') {
			return <div className='absolute inset-0' style={{ backgroundColor: bgState.customColor }} />;
		}
		if (bgState.mode === 'image' && bgState.imageUrl) {
			return (
				<>
					<div
						className='absolute inset-0'
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
							className='pointer-events-none absolute inset-0 bg-black'
							style={{ opacity: bgState.imageDim }}
						/>
					)}
				</>
			);
		}
		const preset =
			VRM_BACKGROUND_PRESETS.find((item) => item.id === bgState.presetId) ||
			VRM_BACKGROUND_PRESETS[0];
		return preset.backgroundColor ? (
			<div className='absolute inset-0' style={{ backgroundColor: preset.backgroundColor }} />
		) : (
			<div className={`absolute inset-0 ${preset.styleClass}`} />
		);
	};

	return (
		<main className='@container fixed inset-0 m-0 h-screen w-screen overflow-hidden bg-transparent p-0'>
			{renderBackgroundLayer()}
			{state?.mode === 'live2d' ? (
				<Live2dRenderer config={state.live2d} interactive={false} />
			) : state ? (
				<PngTuberRenderer config={state.pngtuber} interactive={false} />
			) : null}
			<SupportWatermark />
		</main>
	);
}
