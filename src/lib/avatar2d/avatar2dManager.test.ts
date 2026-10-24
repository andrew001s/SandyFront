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

describe('avatar2dManager custom emotions', () => {
	it('adds and persists custom expression in avatar2dManager', () => {
		const created = avatar2dManager.addCustomEmotion(
			'Pensativo',
			'data:image/png;base64,custom_idle',
		);
		expect(created).toBeDefined();
		expect(created.label).toBe('Pensativo');
		expect(created.idle).toBe('data:image/png;base64,custom_idle');

		const emotions = avatar2dManager.getState().pngtuber.emotions;
		expect(emotions).toContainEqual(
			expect.objectContaining({
				id: created.id,
				label: 'Pensativo',
				idle: 'data:image/png;base64,custom_idle',
			}),
		);

		const saved = JSON.parse(window.localStorage.getItem('sandy_avatar2d_state') || '{}');
		expect(saved.pngtuber?.emotions?.some((e: { label?: string }) => e.label === 'Pensativo')).toBe(
			true,
		);
	});
});
