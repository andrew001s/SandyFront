import type { LipSyncHandlerObject } from '@/lib/audioQueueSingleton';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAvatar } from './useAvatar';

const audio = vi.hoisted(() => ({
	connected: true,
	handler: null as LipSyncHandlerObject | null,
	local: { prepare: vi.fn(), start: vi.fn(), stop: vi.fn() },
	external: vi.fn(),
	inject: vi.fn(),
}));
vi.mock('@/hooks/useVTubeStudio', () => ({
	useVTubeStudio: () => ({ connected: audio.connected, injectParameters: audio.inject }),
}));
vi.mock('@/lib/audioQueueSingleton', () => ({
	AudioQueueManager: {
		getInstance: () => ({
			setLipSyncHandler: (handler: LipSyncHandlerObject) => {
				audio.handler = handler;
			},
			subscribeSpeechState: () => () => undefined,
			subscribe: () => () => undefined,
		}),
	},
}));
vi.mock('@/lib/avatar2d/live2dLipSync', () => ({ createLive2dLipSyncHandler: () => audio.local }));
vi.mock('@/lib/vtsLipSync', () => ({
	createVtsLipSyncHandler: () => audio.external,
	stopVtsLipSync: vi.fn(),
}));

describe('Live2D lip sync with VTube Studio', () => {
	beforeEach(() => {
		localStorage.clear();
		localStorage.setItem('sandy_avatar_software', 'live2d');
		audio.connected = true;
		vi.clearAllMocks();
	});
	it('skips local audio analysis while VTS is connected and restores it after disconnecting', async () => {
		const { rerender } = renderHook(useAvatar);
		const blob = new Blob(['audio']);
		const clock = () => 0;
		await act(async () => {
			await audio.handler?.prepare?.(blob);
			await audio.handler?.start(blob, clock);
		});
		expect(audio.local.prepare).not.toHaveBeenCalled();
		expect(audio.local.start).not.toHaveBeenCalled();
		expect(audio.external).toHaveBeenCalledWith(blob, clock);
		audio.connected = false;
		rerender();
		await act(async () => {
			await audio.handler?.prepare?.(blob);
			await audio.handler?.start(blob, clock);
		});
		expect(audio.local.prepare).toHaveBeenCalledWith(blob);
		expect(audio.local.start).toHaveBeenCalledWith(blob, clock);
		expect(audio.external).toHaveBeenCalledOnce();
	});
});
