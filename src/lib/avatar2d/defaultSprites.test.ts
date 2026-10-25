import { describe, expect, it } from 'vitest';
import { DEFAULT_SANDY_SPRITES } from './defaultSprites';

describe('defaultSprites', () => {
	it('provides authentic Sandy official character sprites for idle and speaking states', () => {
		expect(DEFAULT_SANDY_SPRITES.idle).toMatch(/\/avatars\/sandy\/.*idle/i);
		expect(DEFAULT_SANDY_SPRITES.speaking).toMatch(/\/avatars\/sandy\/.*speaking/i);
	});

	it('provides dedicated Sandy blinking sprites for idle and speaking states', () => {
		expect(DEFAULT_SANDY_SPRITES.blink).toMatch(/\/avatars\/sandy\/.*blink/i);
		expect(DEFAULT_SANDY_SPRITES.blink).not.toBe(DEFAULT_SANDY_SPRITES.idle);
		expect(DEFAULT_SANDY_SPRITES.speakingBlink).toMatch(/\/avatars\/sandy\/.*blink/i);
		expect(DEFAULT_SANDY_SPRITES.speakingBlink).not.toBe(DEFAULT_SANDY_SPRITES.speaking);
	});
});
