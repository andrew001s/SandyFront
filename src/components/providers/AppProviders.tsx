'use client';

import { GlobalAudioPlayer } from '@/components/audio/GlobalAudioPlayer';
import { MessagesProvider } from '@/context/MessagesContext';
import { StatusProvider } from '@/context/StatusContext';
import { StatusProviderBot } from '@/context/StatusContextBot';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export function AppProviders({ children }: { children: ReactNode }) {
	const pathname = usePathname();

	if (pathname === '/') {
		return <>{children}</>;
	}

	return (
		<StatusProvider>
			<StatusProviderBot>
				<MessagesProvider>
					<GlobalAudioPlayer />
					{children}
				</MessagesProvider>
			</StatusProviderBot>
		</StatusProvider>
	);
}
