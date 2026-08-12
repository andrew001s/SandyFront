'use client';

import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { steps } from '@/components/onboarding/onboardingSteps';
import {
	ONBOARDING_COMPLETE_KEY,
	ONBOARDING_DISMISSED_KEY,
	ONBOARDING_PERSISTENCE_KEY,
	isOnboardingComplete,
} from '@/lib/onboarding/keys';
import { OnboardingProvider } from '@onboardjs/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';

export function OnboardingFlow() {
	const router = useRouter();

	useEffect(() => {
		if (isOnboardingComplete()) {
			router.replace('/home');
		}
	}, [router]);

	const handleFlowComplete = useCallback(async () => {
		try {
			window.localStorage.setItem(ONBOARDING_COMPLETE_KEY, '1');
			window.localStorage.removeItem(ONBOARDING_DISMISSED_KEY);
		} catch {
			// ignore storage errors
		}
		router.replace('/home');
	}, [router]);

	return (
		<OnboardingProvider
			steps={steps}
			localStoragePersistence={{ key: ONBOARDING_PERSISTENCE_KEY }}
			onFlowComplete={handleFlowComplete}
			flowId='sandy-vtuber-setup'
			flowName='Configuración inicial de Sandy Studio'
		>
			<OnboardingShell />
		</OnboardingProvider>
	);
}
