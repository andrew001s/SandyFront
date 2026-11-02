import { AVATAR_SOFTWARE_STORAGE_KEY } from '@/lib/avatar/constants';
import { setAutomaticReactionMapping } from '@/lib/avatar/reactionMappings';
import { avatar2dManager } from '@/lib/avatar2d/avatar2dManager';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAvatar } from './useAvatar';

const vtsMocks = vi.hoisted(() => ({
	activateExpression: vi.fn(async () => true),
	setExpressionActive: vi.fn(async () => true),
	sendAvatarPayload: vi.fn(async () => true),
}));

vi.mock('@/hooks/useVTubeStudio', () => ({
	useVTubeStudio: () => ({
		connected: false,
		connecting: false,
		error: null,
		stats: null,
		models: [],
		currentModel: null,
		folderInfo: null,
		hotkeys: [],
		expressions: [],
		connect: vi.fn(async () => undefined),
		disconnect: vi.fn(async () => undefined),
		loadModel: vi.fn(async () => undefined),
		refreshModels: vi.fn(async () => undefined),
		injectParameters: vi.fn(async () => undefined),
		triggerHotkey: vi.fn(async () => true),
		activateExpression: vtsMocks.activateExpression,
		setExpressionActive: vtsMocks.setExpressionActive,
		moveModel: vi.fn(async () => undefined),
		sendAvatarPayload: vtsMocks.sendAvatarPayload,
	}),
}));

describe('useAvatar persistence and mode synchronization', () => {
	beforeEach(() => {
		window.localStorage.clear();
		vi.restoreAllMocks();
		setAutomaticReactionMapping('surprised', null);
		vtsMocks.sendAvatarPayload.mockClear();
	});

	it('Avatar studio persists and restores selected view to and from localStorage', () => {
		window.localStorage.setItem(AVATAR_SOFTWARE_STORAGE_KEY, 'live2d');

		const { result } = renderHook(() => useAvatar());

		expect(result.current.activeSoftware).toBe('live2d');

		act(() => {
			result.current.setSoftware('pngtuber');
		});

		expect(result.current.activeSoftware).toBe('pngtuber');
		expect(window.localStorage.getItem(AVATAR_SOFTWARE_STORAGE_KEY)).toBe('pngtuber');
		expect(avatar2dManager.getState().mode).toBe('pngtuber');
	});

	it('useAvatar resets PNGTuber and Live2D emotions to neutral', async () => {
		for (const software of ['pngtuber', 'live2d'] as const) {
			window.localStorage.setItem(AVATAR_SOFTWARE_STORAGE_KEY, software);
			const { result, unmount } = renderHook(() => useAvatar());

			act(() => {
				if (software === 'pngtuber') {
					avatar2dManager.setEmotion('surprised');
				} else {
					avatar2dManager.setLive2dExpression('surprised');
				}
			});

			await act(async () => {
				await result.current.resetEmotions();
			});

			if (software === 'pngtuber') {
				expect(avatar2dManager.getState().pngtuber.activeEmotion).toBe('neutral');
			} else {
				expect(avatar2dManager.getState().live2d.activeExpression).toBeNull();
			}

			unmount();
		}
	});

	it('useAvatar activates PNGTuber and Live2D expressions locally', async () => {
		for (const software of ['pngtuber', 'live2d'] as const) {
			window.localStorage.setItem(AVATAR_SOFTWARE_STORAGE_KEY, software);
			const { result, unmount } = renderHook(() => useAvatar());

			await act(async () => {
				await result.current.setEmotion('surprised');
			});

			if (software === 'pngtuber') {
				expect(avatar2dManager.getState().pngtuber.activeEmotion).toBe('surprised');
			} else {
				expect(avatar2dManager.getState().live2d.activeExpression).toBe('surprised');
			}
			expect(vtsMocks.activateExpression).not.toHaveBeenCalled();

			unmount();
		}
	});

	it('useAvatar maps a Twitch speech reaction to the selected expression', async () => {
		window.localStorage.setItem(AVATAR_SOFTWARE_STORAGE_KEY, 'vtubestudio');
		setAutomaticReactionMapping('surprised', 'custom_vts_expression');
		const { result } = renderHook(() => useAvatar());

		await act(async () => {
			await result.current.sendAvatarPayload({
				type: 'speech',
				text: 'Qué sorpresa.',
				emotion: 'surprised',
				reaction: true,
			});
		});

		expect(vtsMocks.sendAvatarPayload).toHaveBeenCalledWith(
			expect.objectContaining({ emotion: 'custom_vts_expression' }),
		);
	});

	it('useAvatar does not activate an unmapped Twitch reaction', async () => {
		window.localStorage.setItem(AVATAR_SOFTWARE_STORAGE_KEY, 'vtubestudio');
		const { result } = renderHook(() => useAvatar());

		await act(async () => {
			await result.current.sendAvatarPayload({
				type: 'speech',
				text: 'Qué sorpresa.',
				emotion: 'surprised',
				reaction: true,
			});
		});

		expect(vtsMocks.sendAvatarPayload).toHaveBeenCalledWith(
			expect.objectContaining({ emotion: undefined, expression: null }),
		);
	});

	it('useAvatar deactivates the VTube Studio reaction expression', async () => {
		window.localStorage.setItem(AVATAR_SOFTWARE_STORAGE_KEY, 'vtubestudio');
		const { result } = renderHook(() => useAvatar());

		await act(async () => {
			await result.current.setEmotion('surprised');
			await result.current.resetEmotions();
		});

		expect(vtsMocks.activateExpression).toHaveBeenCalledWith('surprised');
		expect(vtsMocks.setExpressionActive).toHaveBeenCalledWith('surprised', false);
	});
});
