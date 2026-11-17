import { act, renderHook } from '@testing-library/react';
import posthog from 'posthog-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useVoiceErrorReporter } from './useVoiceErrorReporter';

const rollbarError = vi.hoisted(() => vi.fn());
vi.mock('@rollbar/react', () => ({ useRollbar: () => ({ error: rollbarError }) }));
vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

describe('voice error analytics', () => {
	beforeEach(() => vi.clearAllMocks());

	it('reports a TTS failure independently with the active provider and no spoken text', () => {
		const { result } = renderHook(() => useVoiceErrorReporter());
		act(() => {
			result.current.report('private spoken sentence', new Error('network failed'), 'local_tts');
		});

		expect(posthog.capture).toHaveBeenCalledOnce();
		expect(posthog.capture).toHaveBeenCalledWith(
			'tts_request_failed',
			expect.objectContaining({ provider: 'local_tts' }),
		);
		expect(posthog.capture).not.toHaveBeenCalledWith('ai_response_succeeded', expect.anything());
		expect(JSON.stringify(vi.mocked(posthog.capture).mock.calls)).not.toContain(
			'private spoken sentence',
		);
	});

	it('deduplicates repeated segment failures with the same code until reset', () => {
		const { result } = renderHook(() => useVoiceErrorReporter());
		act(() => {
			result.current.report('segment one', new Error('network failed'), 'edge_tts');
			result.current.report('segment two', new Error('network failed'), 'edge_tts');
		});
		expect(posthog.capture).toHaveBeenCalledOnce();
	});
});
