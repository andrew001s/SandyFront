'use client';

import { useUser } from '@clerk/nextjs';
import posthog from 'posthog-js';
import { useEffect, useRef } from 'react';

/** Associate events with the Clerk account ID without sending profile fields to analytics. */
export function PostHogUserIdentification() {
	const { isLoaded, isSignedIn, user } = useUser();
	const identifiedUserId = useRef<string | null>(null);

	useEffect(() => {
		if (!isLoaded) return;
		if (!isSignedIn || !user) {
			if (identifiedUserId.current) {
				posthog.reset();
				identifiedUserId.current = null;
			}
			return;
		}
		if (identifiedUserId.current && identifiedUserId.current !== user.id) {
			posthog.reset();
		}
		if (identifiedUserId.current !== user.id) {
			posthog.identify(user.id);
			identifiedUserId.current = user.id;
		}
	}, [isLoaded, isSignedIn, user]);

	return null;
}
