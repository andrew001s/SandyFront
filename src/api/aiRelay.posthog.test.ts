import { describe, expect, it } from 'vitest';
import { isDuplicateAiTask, parseAiTask } from './aiRelay';

describe('local AI relay task tracking', () => {
	it('preserves the backend task ID for event deduplication', () => {
		expect(parseAiTask({ id: 'task-1', message: 'private text', kind: 'chat' })).toMatchObject({
			id: 'task-1',
			kind: 'chat',
		});
	});

	it('ignores replayed task IDs while allowing requests without IDs', () => {
		const seen = new Set<string>();
		expect(isDuplicateAiTask('task-1', seen)).toBe(false);
		expect(isDuplicateAiTask('task-1', seen)).toBe(true);
		expect(isDuplicateAiTask(null, seen)).toBe(false);
	});
});
