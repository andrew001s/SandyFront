import posthog from 'posthog-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	shouldTrackAiSuccess,
	shouldTrackVtuberStart,
	trackAiResponseSucceeded,
	trackVtuberStart,
} from './posthog-activation';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));

describe('PostHog activation event rules', () => {
	beforeEach(() => vi.clearAllMocks());

	it('counts a complete nonempty microphone response once without its text', () => {
		expect(shouldTrackAiSuccess('Hola desde Sandy')).toBe(true);
		expect(trackAiResponseSucceeded('Hola desde Sandy', 'gemini', 'voice', 'microphone')).toBe(
			true,
		);
		expect(posthog.capture).toHaveBeenCalledOnce();
		expect(posthog.capture).toHaveBeenCalledWith('ai_response_succeeded', {
			provider: 'gemini',
			mode: 'voice',
			interaction_type: 'microphone',
		});
		expect(JSON.stringify(vi.mocked(posthog.capture).mock.calls)).not.toContain('Hola desde Sandy');
	});

	it('does not count empty or whitespace-only AI responses', () => {
		expect(shouldTrackAiSuccess('')).toBe(false);
		expect(shouldTrackAiSuccess('  \n  ')).toBe(false);
		expect(trackAiResponseSucceeded('  \n  ', 'gemini', 'text', 'microphone')).toBe(false);
		expect(posthog.capture).not.toHaveBeenCalled();
	});

	it('tracks a completed local chat response using only non-content properties', () => {
		trackAiResponseSucceeded('Chat response', 'local', 'text', 'chat');
		expect(posthog.capture).toHaveBeenCalledWith('ai_response_succeeded', {
			provider: 'local',
			mode: 'text',
			interaction_type: 'chat',
		});
	});

	it('attaches bounded latency fields without adding prompts or generated text', () => {
		trackAiResponseSucceeded('Completed', 'local', 'voice', 'chat', {
			llmLatencyMs: 12.6,
			ttsGenerationMs: 38.2,
			totalLatencyMs: 47.9,
		});
		expect(posthog.capture).toHaveBeenCalledWith('ai_response_succeeded', {
			provider: 'local',
			mode: 'voice',
			interaction_type: 'chat',
			llm_latency_ms: 13,
			tts_generation_ms: 38,
			total_latency_ms: 48,
		});
	});

	it('tracks a service start only after a confirmed inactive-to-active transition', () => {
		expect(shouldTrackVtuberStart(false, true)).toBe(true);
		expect(shouldTrackVtuberStart(false, false)).toBe(false);
		expect(shouldTrackVtuberStart(true, true)).toBe(false);
		expect(shouldTrackVtuberStart(true, false)).toBe(false);
		expect(trackVtuberStart(false, false)).toBe(false);
		expect(posthog.capture).not.toHaveBeenCalled();
		expect(trackVtuberStart(false, true)).toBe(true);
		expect(posthog.capture).toHaveBeenCalledOnce();
		expect(trackVtuberStart(true, true)).toBe(false);
		expect(posthog.capture).toHaveBeenCalledOnce();
	});
});
