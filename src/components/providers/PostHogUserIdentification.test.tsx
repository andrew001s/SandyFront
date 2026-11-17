import { cleanup, render } from '@testing-library/react';
import posthog from 'posthog-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PostHogUserIdentification } from './PostHogUserIdentification';

const clerk = vi.hoisted(() => ({
	isLoaded: true,
	isSignedIn: true,
	user: {
		id: 'user-1',
		primaryEmailAddress: { emailAddress: 'private@example.com' },
		fullName: 'Private Name',
	},
}));
vi.mock('@clerk/nextjs', () => ({ useUser: () => clerk }));
vi.mock('posthog-js', () => ({ default: { identify: vi.fn(), reset: vi.fn() } }));

describe('PostHog user identification', () => {
	beforeEach(() => vi.clearAllMocks());
	afterEach(cleanup);

	it('identifies the Clerk account without sending profile fields', () => {
		render(<PostHogUserIdentification />);
		expect(posthog.identify).toHaveBeenCalledOnce();
		expect(posthog.identify).toHaveBeenCalledWith('user-1');
	});

	it('identifies a user only once across rerenders', () => {
		const view = render(<PostHogUserIdentification />);
		view.rerender(<PostHogUserIdentification />);
		expect(posthog.identify).toHaveBeenCalledOnce();
	});
});
