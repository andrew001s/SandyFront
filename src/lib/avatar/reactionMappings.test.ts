import { beforeEach, describe, expect, it } from 'vitest';
import {
	getAutomaticReactionMappings,
	getScopedAutomaticReactionConfig,
	parseAutomaticReactionConfig,
	setAutomaticReactionConfig,
	setAutomaticReactionMapping,
} from './reactionMappings';

describe('automatic reaction availability', () => {
	beforeEach(() => {
		for (const key of Object.keys(getAutomaticReactionMappings()))
			setAutomaticReactionMapping(key, null);
	});

	it.each(['pngtuber', 'live2d', 'vrm'])(
		'retains the expressions and intensity when disabling and re-enabling %s',
		(scope) => {
			const original = { expressions: ['smile', 'eyes'], intensity: 0.65 };
			setAutomaticReactionConfig('happy', { ...original, enabled: false }, scope);
			expect(getScopedAutomaticReactionConfig('happy', scope)).toMatchObject({
				enabled: false,
				expressions: [],
			});
			const stored = parseAutomaticReactionConfig(getAutomaticReactionMappings()[`${scope}:happy`]);
			expect(stored).toEqual({ ...original, enabled: false });
			setAutomaticReactionConfig('happy', { ...stored, enabled: true }, scope);
			expect(getScopedAutomaticReactionConfig('happy', scope)).toEqual(original);
		},
	);

	it('isolates availability by format and treats legacy mappings as enabled', () => {
		setAutomaticReactionMapping('happy', 'legacy-smile');
		setAutomaticReactionConfig(
			'happy',
			{ expressions: ['sad-eyes'], intensity: 1, enabled: false },
			'live2d',
		);
		expect(getScopedAutomaticReactionConfig('happy', 'live2d').enabled).toBe(false);
		expect(getScopedAutomaticReactionConfig('happy', 'pngtuber').enabled).not.toBe(false);
	});

	it('can disable an emotion with no mapped expression', () => {
		setAutomaticReactionConfig('shy', { expressions: [], intensity: 1, enabled: false }, 'vrm');
		expect(getScopedAutomaticReactionConfig('shy', 'vrm').enabled).toBe(false);
	});
});
