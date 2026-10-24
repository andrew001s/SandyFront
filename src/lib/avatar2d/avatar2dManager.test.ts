import { beforeEach, describe, expect, it } from 'vitest';
import { avatar2dManager } from './avatar2dManager';

describe('avatar2dManager eyeTracking management', () => {
	beforeEach(() => {
		// Reset to default
		avatar2dManager.setEyeTracking(true, false);
	});

	it('persists and synchronizes live2d eyeTracking setting in avatar2dManager', () => {
		// 1. Check method exists and updates state
		avatar2dManager.setEyeTracking(false, false);
		expect(avatar2dManager.getState().live2d.eyeTracking).toBe(false);

		// 2. Re-enable eye tracking
		avatar2dManager.setEyeTracking(true, false);
		expect(avatar2dManager.getState().live2d.eyeTracking).toBe(true);
	});
});
