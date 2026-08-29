'use client';

import {
	fetchOnboardingCompleted,
	isOnboardingComplete,
	isOnboardingDismissed,
	markOnboardingComplete,
} from '@/lib/onboarding/keys';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function RequireOnboarding() {
	const router = useRouter();
	const { isLoaded, isSignedIn, userId, getToken } = useAuth();

	useEffect(() => {
		if (!isLoaded || !isSignedIn) {
			return;
		}

		// El localStorage evita el parpadeo mientras responde el backend, pero no
		// decide: quien manda es el ajuste de la cuenta.
		if (isOnboardingComplete(userId) || isOnboardingDismissed(userId)) {
			return;
		}

		let cancelled = false;

		const decidir = async () => {
			const completado = await fetchOnboardingCompleted(await getToken());
			if (cancelled) {
				return;
			}

			// `null` significa que no se pudo consultar. Mandar al onboarding a
			// alguien que ya lo hizo, solo porque falló una petición, es peor que
			// dejarlo pasar: en la siguiente carga se vuelve a intentar.
			if (completado === null) {
				return;
			}

			if (completado) {
				markOnboardingComplete(userId);
				return;
			}

			router.replace('/onboarding');
		};

		void decidir();

		return () => {
			cancelled = true;
		};
	}, [isLoaded, isSignedIn, router, userId, getToken]);

	return null;
}
