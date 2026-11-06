import { describe, expect, it, vi } from 'vitest';
import { VrmViewer } from './vrmViewer';

describe('VrmViewer', () => {
	it('mixes native custom expressions and clears them before applying the next expression', () => {
		const viewer = Object.create(VrmViewer.prototype) as VrmViewer;
		const values = new Map<string, number>();
		const setValue = vi.fn((name: string, value: number) => values.set(name, value));
		(viewer as unknown as { currentVrm: unknown }).currentVrm = {
			expressionManager: {
				expressions: ['catMouth', 'earsUp', 'happy'].map((expressionName) => ({ expressionName })),
				setValue,
			},
		};
		viewer.setExpressions(['catMouth', 'earsUp'], 0.6);
		expect(values.get('catMouth')).toBe(0.6);
		expect(values.get('earsUp')).toBe(0.6);
		viewer.setExpression('happy', 0.8);
		expect(values.get('catMouth')).toBe(0);
		expect(values.get('earsUp')).toBe(0);
		expect(values.get('happy')).toBe(0.8);
		viewer.resetExpressions();
		expect(values.get('happy')).toBe(0);
	});
	it('exposes detected expression names from current VRM instance', () => {
		const viewer = Object.create(VrmViewer.prototype) as VrmViewer;
		(viewer as unknown as { currentVrm: unknown }).currentVrm = {
			expressionManager: {
				expressions: [
					{ expressionName: 'happy' },
					{ expressionName: 'angry' },
					{ expressionName: 'catMouth' },
				],
			},
		};

		expect(viewer.getAvailableExpressions()).toEqual(['happy', 'angry', 'catMouth']);
	});

	it('returns empty array when no VRM or expressionManager is available', () => {
		const viewer = Object.create(VrmViewer.prototype) as VrmViewer;
		(viewer as unknown as { currentVrm: unknown }).currentVrm = null;

		expect(viewer.getAvailableExpressions()).toEqual([]);
	});
});
