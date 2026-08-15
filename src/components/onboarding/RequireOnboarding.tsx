'use client';

import { isOnboardingComplete, isOnboardingDismissed } from '@/lib/onboarding/keys';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function RequireOnboarding() {
	const router = useRouter();
	const { isLoaded, isSignedIn, userId } = useAuth();

	useEffect(() => {
		if (!isLoaded || !isSignedIn) {
			return;
		}

		if (!isOnboardingComplete(userId) && !isOnboardingDismissed(userId)) {
			router.replace('/onboarding');
		}
	}, [isLoaded, isSignedIn, router, userId]);

	return null;
}
