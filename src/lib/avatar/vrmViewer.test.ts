import { describe, expect, it } from 'vitest';
import { VrmViewer } from './vrmViewer';

describe('VrmViewer', () => {
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
