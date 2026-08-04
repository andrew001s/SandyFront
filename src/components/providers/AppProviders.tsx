'use client';

import { GlobalAudioPlayer } from '@/components/audio/GlobalAudioPlayer';
import { MessagesProvider } from '@/context/MessagesContext';
import { StatusProvider } from '@/context/StatusContext';
import { StatusProviderBot } from '@/context/StatusContextBot';
import { useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import posthog from 'posthog-js';
import { type ReactNode, useEffect, useRef } from 'react';

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

export function AppProviders({ children }: { children: ReactNode }) {
	const pathname = usePathname();

	return (
		<>
			<PostHogUserIdentification />
			{pathname === '/' ? (
				children
			) : (
				<StatusProvider>
					<StatusProviderBot>
						<MessagesProvider>
							<GlobalAudioPlayer />
							{children}
						</MessagesProvider>
					</StatusProviderBot>
				</StatusProvider>
			)}
		</>
	);
}
