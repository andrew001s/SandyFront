'use client';

import { Provider as RollbarProvider } from '@rollbar/react';
import type { ReactNode } from 'react';
import { clientRollbarConfig } from '@/lib/rollbar-client';

export function AppRollbarProvider({ children }: { children: ReactNode }) {
	return <RollbarProvider config={clientRollbarConfig}>{children}</RollbarProvider>;
}
