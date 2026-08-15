'use client';

import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { steps } from '@/components/onboarding/onboardingSteps';
import {
	getOnboardingPersistenceKey,
	isOnboardingComplete,
	markOnboardingComplete,
} from '@/lib/onboarding/keys';
import { useAuth } from '@clerk/nextjs';
import { OnboardingProvider } from '@onboardjs/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';

export function OnboardingFlow() {
	const router = useRouter();
	const { isLoaded, isSignedIn, userId } = useAuth();

	useEffect(() => {
		if (!isLoaded || !isSignedIn) {
			return;
		}

		if (isOnboardingComplete(userId)) {
			router.replace('/home');
		}
	}, [isLoaded, isSignedIn, router, userId]);

	const handleFlowComplete = useCallback(async () => {
		markOnboardingComplete(userId);
		router.replace('/home');
	}, [router, userId]);

	if (!isLoaded || !isSignedIn) {
		return null;
	}

	return (
		<OnboardingProvider
			steps={steps}
			localStoragePersistence={{ key: getOnboardingPersistenceKey(userId) }}
			onFlowComplete={handleFlowComplete}
			flowId='sandy-vtuber-setup'
			flowName='Configuración inicial de Sandy Studio'
		>
			<OnboardingShell />
		</OnboardingProvider>
	);
}
