'use client';

import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { steps } from '@/components/onboarding/onboardingSteps';
import {
	fetchOnboardingCompleted,
	getOnboardingPersistenceKey,
	isOnboardingComplete,
	markOnboardingComplete,
	markOnboardingCompleteRemote,
} from '@/lib/onboarding/keys';
import { useAuth } from '@clerk/nextjs';
import { OnboardingProvider } from '@onboardjs/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';

export function OnboardingFlow() {
	const router = useRouter();
	const { isLoaded, isSignedIn, userId, getToken } = useAuth();

	useEffect(() => {
		if (!isLoaded || !isSignedIn) {
			return;
		}

		if (isOnboardingComplete(userId)) {
			router.replace('/home');
			return;
		}

		// Puede haberlo completado en otro dispositivo: se confirma con la cuenta
		// para no obligarle a repetirlo.
		let cancelled = false;
		void (async () => {
			const completado = await fetchOnboardingCompleted(await getToken());
			if (cancelled || !completado) {
				return;
			}
			markOnboardingComplete(userId);
			router.replace('/home');
		})();

		return () => {
			cancelled = true;
		};
	}, [isLoaded, isSignedIn, router, userId, getToken]);

	const handleFlowComplete = useCallback(async () => {
		try {
			await markOnboardingCompleteRemote(await getToken());
		} catch (error) {
			// Si no se pudo guardar en la cuenta, la marca local evita que se
			// repita ahora; en otro dispositivo volvería a salir.
			console.error('No se pudo marcar el onboarding en la cuenta:', error);
		}
		markOnboardingComplete(userId);
		router.replace('/home');
	}, [router, userId, getToken]);

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
