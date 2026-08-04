'use client';

import Clarity from '@microsoft/clarity';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
const enableClarityInDev = process.env.NEXT_PUBLIC_CLARITY_ENABLE_IN_DEV === 'true';
const canInitializeClarity = Boolean(clarityProjectId) && (process.env.NODE_ENV === 'production' || enableClarityInDev);

let clarityInitialized = false;

export function AppClarityProvider({ children }: { children: ReactNode }) {
	const pathname = usePathname();

	useEffect(() => {
		if (!canInitializeClarity || clarityInitialized || !clarityProjectId) {
			return;
		}

		Clarity.init(clarityProjectId);
		clarityInitialized = true;
	}, []);

	useEffect(() => {
		if (!clarityInitialized) {
			return;
		}

		Clarity.setTag('pathname', pathname);
	}, [pathname]);

	return children;
}
