'use client';

import { Live2dRenderer } from '@/containers/avatar/components/2d/Live2dRenderer';
import { PngTuberRenderer } from '@/containers/avatar/components/2d/PngTuberRenderer';
import { SupportWatermark } from '@/containers/avatar/components/common/SupportWatermark';
import { avatar2dManager } from '@/lib/avatar2d/avatar2dManager';
import { restoreSavedLive2dModel } from '@/lib/avatar2d/live2dModel';
import type { Avatar2dState } from '@/lib/avatar2d/types';
import { useEffect, useState } from 'react';

export default function Avatar2dOverlayPage() {
	const [state, setState] = useState<Avatar2dState | null>(null);

	useEffect(() => {
		const unsubscribe = avatar2dManager.subscribe(setState);
		avatar2dManager.requestSync();
		return unsubscribe;
	}, []);

	useEffect(() => {
		if (state?.mode !== 'live2d') return;
		void restoreSavedLive2dModel().catch((error) => {
			console.error('No se pudo restaurar el modelo Live2D del overlay:', error);
		});
	}, [state?.mode]);

	return (
		<main className='@container fixed inset-0 m-0 h-screen w-screen overflow-hidden bg-transparent p-0'>
			{state?.mode === 'live2d' ? (
				<Live2dRenderer config={state.live2d} interactive={false} />
			) : state ? (
				<PngTuberRenderer config={state.pngtuber} interactive={false} />
			) : null}
			<SupportWatermark />
		</main>
	);
}
