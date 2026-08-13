'use client';

import { isOnboardingComplete, isOnboardingDismissed } from '@/lib/onboarding/keys';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function RequireOnboarding() {
	const router = useRouter();

	useEffect(() => {
		if (!isOnboardingComplete() && !isOnboardingDismissed()) {
			router.replace('/onboarding');
		}
	}, [router]);

	return null;
}
