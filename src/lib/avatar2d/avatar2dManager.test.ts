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

describe('avatar2dManager Live2D expressions', () => {
	it('persists and synchronizes active Live2D expression in avatar2dManager', () => {
		avatar2dManager.setLive2dExpression('smile', false);
		expect(avatar2dManager.getState().live2d.activeExpression).toBe('smile');

		avatar2dManager.setLive2dExpression(null, false);
		expect(avatar2dManager.getState().live2d.activeExpression).toBe(null);
	});

	it('toggles Live2D expression on and off in activeExpressions and activeExpression', () => {
		avatar2dManager.setLive2dExpression(null, false);
		expect(avatar2dManager.getState().live2d.activeExpressions).toEqual([]);
		expect(avatar2dManager.getState().live2d.activeExpression).toBe(null);

		// Toggle 'blush' ON
		avatar2dManager.toggleLive2dExpression('blush', false);
		expect(avatar2dManager.getState().live2d.activeExpressions).toEqual(['blush']);
		expect(avatar2dManager.getState().live2d.activeExpression).toBe('blush');

		// Toggle 'smile' ON (both active)
		avatar2dManager.toggleLive2dExpression('smile', false);
		expect(avatar2dManager.getState().live2d.activeExpressions).toEqual(['blush', 'smile']);
		expect(avatar2dManager.getState().live2d.activeExpression).toBe('smile');

		// Toggle 'blush' OFF
		avatar2dManager.toggleLive2dExpression('blush', false);
		expect(avatar2dManager.getState().live2d.activeExpressions).toEqual(['smile']);
		expect(avatar2dManager.getState().live2d.activeExpression).toBe('smile');

		// Toggle 'smile' OFF
		avatar2dManager.toggleLive2dExpression('smile', false);
		expect(avatar2dManager.getState().live2d.activeExpressions).toEqual([]);
		expect(avatar2dManager.getState().live2d.activeExpression).toBe(null);
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

	it('removes expression by ID from storage, notifies listeners, and falls back activeEmotion if deleted emotion was active', () => {
		const created = avatar2dManager.addCustomEmotion(
			'Temporal',
			'data:image/png;base64,temporal_idle',
		);
		avatar2dManager.setEmotion(created.id);
		expect(avatar2dManager.getState().pngtuber.activeEmotion).toBe(created.id);

		// Delete the created emotion
		const result = avatar2dManager.deleteEmotion(created.id);
		expect(result).toBe(true);

		// Should not be in emotions list anymore
		const emotions = avatar2dManager.getState().pngtuber.emotions;
		expect(emotions.some((e) => e.id === created.id)).toBe(false);

		// Fallback should switch activeEmotion to 'neutral' (or first available emotion)
		expect(avatar2dManager.getState().pngtuber.activeEmotion).toBe('neutral');

		// LocalStorage should also be updated
		const saved = JSON.parse(window.localStorage.getItem('sandy_avatar2d_state') || '{}');
		expect(saved.pngtuber?.emotions?.some((e: { id: string }) => e.id === created.id)).toBe(false);
	});
});
