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

	it('updates existing custom expression label and image in avatar2dManager and persists state', () => {
		const created = avatar2dManager.addCustomEmotion(
			'Sonriente',
			'data:image/png;base64,original_idle',
		);

		const updated = avatar2dManager.updateCustomEmotion(created.id, {
			label: 'Sonriente Editado',
			idle: 'data:image/png;base64,new_idle',
			speaking: 'data:image/png;base64,new_speaking',
		});

		expect(updated).toBeDefined();
		expect(updated?.label).toBe('Sonriente Editado');
		expect(updated?.idle).toBe('data:image/png;base64,new_idle');
		expect(updated?.speaking).toBe('data:image/png;base64,new_speaking');

		const stored = avatar2dManager.getState().pngtuber.emotions.find((e) => e.id === created.id);
		expect(stored?.label).toBe('Sonriente Editado');
		expect(stored?.idle).toBe('data:image/png;base64,new_idle');

		const saved = JSON.parse(window.localStorage.getItem('sandy_avatar2d_state') || '{}');
		const savedEmotion = saved.pngtuber?.emotions?.find((e: { id: string }) => e.id === created.id);
		expect(savedEmotion?.label).toBe('Sonriente Editado');
		expect(savedEmotion?.idle).toBe('data:image/png;base64,new_idle');
	});
});
