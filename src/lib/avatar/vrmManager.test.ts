import { describe, expect, it, vi } from 'vitest';
import { VrmManager, type VrmSyncMessage } from './vrmManager';

describe('VRM expression intensity mixing and overlay sync', () => {
	it('uses each configured expression intensity when reactions activate several expressions', () => {
		const manager = Object.create(VrmManager.prototype) as VrmManager;
		const setExpressions = vi.fn();
		Object.assign(manager, {
			activeViewers: new Set([{ setExpressions }]),
			listeners: new Set(),
			broadcastChannel: null,
		});
		manager.setConfiguredExpressionIntensities({ catMouth: 0.25, earsUp: 0.5 });
		manager.setEmotions(['catMouth', 'earsUp'], 0.8);
		expect(manager.getActiveExpressionWeights()).toEqual({ catMouth: 0.2, earsUp: 0.4 });
	});
	it('keeps other expression weights while toggling and publishes their individual values', () => {
		const manager = Object.create(VrmManager.prototype) as VrmManager;
		const setExpressions = vi.fn();
		const postMessage = vi.fn();
		Object.assign(manager, {
			activeViewers: new Set([{ setExpressions }]),
			listeners: new Set(),
			currentEmotions: [],
			currentExpressionWeights: {},
			currentIntensity: 1,
			broadcastChannel: { postMessage },
		});
		manager.toggleExpression('catMouth', 0.2);
		manager.toggleExpression('earsUp', 0.8);
		expect(setExpressions).toHaveBeenLastCalledWith(['catMouth', 'earsUp'], 1, {
			catMouth: 0.2,
			earsUp: 0.8,
		});
		manager.setExpressionIntensity('catMouth', 0.35);
		expect(postMessage).toHaveBeenLastCalledWith({
			type: 'emotionMix',
			emotions: ['catMouth', 'earsUp'],
			intensity: 1,
			weights: { catMouth: 0.35, earsUp: 0.8 },
		});
		manager.toggleExpression('catMouth');
		expect(manager.getActiveExpressionWeights()).toEqual({ earsUp: 0.8 });
	});
	it('uses individual weights received by the overlay and still accepts messages from older clients', () => {
		const manager = Object.create(VrmManager.prototype) as VrmManager;
		const setExpressions = vi.fn();
		Object.assign(manager, { activeViewers: new Set([{ setExpressions }]), listeners: new Set() });
		const receive = (message: VrmSyncMessage) =>
			(
				manager as unknown as { handleSyncMessage: (message: VrmSyncMessage) => void }
			).handleSyncMessage(message);
		receive({
			type: 'emotionMix',
			emotions: ['happy', 'catMouth'],
			intensity: 1,
			weights: { happy: 0.9, catMouth: 0.15 },
		});
		expect(setExpressions).toHaveBeenLastCalledWith(['happy', 'catMouth'], 1, {
			happy: 0.9,
			catMouth: 0.15,
		});
		receive({ type: 'emotionMix', emotions: ['happy'], intensity: 0.5 });
		expect(manager.getActiveExpressionWeights()).toEqual({ happy: 0.5 });
	});
});
