'use client';

import { clientRollbarConfig } from '@/lib/rollbar-client';
import { Provider as RollbarProvider } from '@rollbar/react';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export function AppRollbarProvider({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	if (pathname.startsWith('/overlay/')) return children;
	return <RollbarProvider config={clientRollbarConfig}>{children}</RollbarProvider>;
}
