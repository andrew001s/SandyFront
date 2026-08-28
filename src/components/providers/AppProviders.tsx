'use client';

import { GlobalAudioPlayer } from '@/components/audio/GlobalAudioPlayer';
import { DashboardTourCard } from '@/components/tour/DashboardTourCard';
import { DASHBOARD_TOUR_STORAGE_KEY, dashboardTourSteps } from '@/components/tour/dashboardTour';
import { MessagesProvider } from '@/context/MessagesContext';
import { StatusProvider } from '@/context/StatusContext';
import { StatusProviderBot } from '@/context/StatusContextBot';
import { useLocalAiRelay } from '@/hooks/useLocalAiRelay';
import { useUser } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import { NextStep, NextStepProvider, useNextStep } from 'nextstepjs';
import posthog from 'posthog-js';
import { type ReactNode, useEffect, useRef } from 'react';

/**
 * Atiende las peticiones de inferencia del backend cuando el proveedor es el
 * modelo local. Va aquí, y no en una pantalla concreta, para que siga
 * respondiendo al chat y a los eventos aunque el usuario no tenga abierto el
 * panel de conversación.
 */
function LocalAiRelay() {
	useLocalAiRelay();
	return null;
}

function PostHogUserIdentification() {
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
			posthog.identify(user.id, {
				...(user.primaryEmailAddress?.emailAddress
					? { email: user.primaryEmailAddress.emailAddress }
					: {}),
				...(user.fullName ? { name: user.fullName } : {}),
			});
			identifiedUserId.current = user.id;
		}
	}, [isLoaded, isSignedIn, user]);

	return null;
}

function DashboardTourLauncher() {
	const pathname = usePathname();
	const { isLoaded, isSignedIn, user } = useUser();
	const { startNextStep, closeNextStep } = useNextStep();
	const startedForUser = useRef<string | null>(null);

	useEffect(() => {
		if (!isLoaded || !isSignedIn || pathname !== '/home' || !user?.id) {
			return;
		}

		if (typeof window === 'undefined') {
			return;
		}

		const storageKey = `${DASHBOARD_TOUR_STORAGE_KEY}:${user.id}`;

		if (window.localStorage.getItem(storageKey) === '1' || startedForUser.current === user.id) {
			return;
		}

		startedForUser.current = user.id;
		const timer = window.setTimeout(() => {
			startNextStep('dashboard-tour');
		}, 700);

		return () => {
			window.clearTimeout(timer);
		};
	}, [isLoaded, isSignedIn, pathname, startNextStep, user?.id]);

	useEffect(() => {
		if (pathname === '/home') {
			return;
		}

		closeNextStep();
	}, [closeNextStep, pathname]);

	return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const isAppRoute = pathname !== '/';
	const { user } = useUser();
	const { resolvedTheme, theme } = useTheme();
	const activeTheme = resolvedTheme ?? theme ?? 'dark';
	const isLightTheme = activeTheme === 'light';

	return (
		<>
			<PostHogUserIdentification />
			<LocalAiRelay />
			{isAppRoute ? (
				<NextStepProvider>
					<NextStep
						steps={dashboardTourSteps}
						cardComponent={DashboardTourCard}
						shadowRgb={isLightTheme ? '109, 91, 208' : '3, 6, 23'}
						shadowOpacity={isLightTheme ? '0.18' : '0.62'}
						arrowStyle={{
							color: isLightTheme ? '#ffffff' : '#0b1020',
						}}
						onComplete={() => {
							if (typeof window === 'undefined' || !user?.id) return;
							window.localStorage.setItem(`${DASHBOARD_TOUR_STORAGE_KEY}:${user.id}`, '1');
						}}
						onSkip={() => {
							if (typeof window === 'undefined' || !user?.id) return;
							window.localStorage.setItem(`${DASHBOARD_TOUR_STORAGE_KEY}:${user.id}`, '1');
						}}
						disableConsoleLogs
						overlayZIndex={1400}
					>
						<StatusProvider>
							<StatusProviderBot>
								<MessagesProvider>
									<GlobalAudioPlayer />
									<DashboardTourLauncher />
									{children}
								</MessagesProvider>
							</StatusProviderBot>
						</StatusProvider>
					</NextStep>
				</NextStepProvider>
			) : (
				children
			)}
		</>
	);
}
