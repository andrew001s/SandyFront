import { describe, expect, it } from 'vitest';
import { aiSuccessProperties, shouldTrackAiSuccess, shouldTrackVtuberStart } from './posthog-activation';

describe('PostHog activation event rules', () => {
  it('counts a complete nonempty AI response', () => {
    expect(shouldTrackAiSuccess('Hola desde Sandy')).toBe(true);
    expect(aiSuccessProperties('gemini', 'voice')).toEqual({ provider: 'gemini', mode: 'voice' });
    expect(aiSuccessProperties('local', 'text')).toEqual({ provider: 'local', mode: 'text' });
  });
  it('does not count empty or whitespace-only AI responses', () => {
    expect(shouldTrackAiSuccess('')).toBe(false);
    expect(shouldTrackAiSuccess('  \n  ')).toBe(false);
  });
  it('tracks a service start only after a confirmed inactive-to-active transition', () => {
    expect(shouldTrackVtuberStart(false, true)).toBe(true);
    expect(shouldTrackVtuberStart(false, false)).toBe(false);
    expect(shouldTrackVtuberStart(true, true)).toBe(false);
    expect(shouldTrackVtuberStart(true, false)).toBe(false);
  });
});
