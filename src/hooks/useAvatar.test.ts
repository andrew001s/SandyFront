import { AVATAR_SOFTWARE_STORAGE_KEY } from '@/lib/avatar/constants';
import { avatar2dManager } from '@/lib/avatar2d/avatar2dManager';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAvatar } from './useAvatar';

describe('useAvatar persistence and mode synchronization', () => {
	beforeEach(() => {
		window.localStorage.clear();
		vi.restoreAllMocks();
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
});
