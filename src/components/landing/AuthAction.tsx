'use client';

import { Button } from '@/components/ui/button';
import { useAuth, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';

type AuthActionProps = ComponentProps<typeof Button> & {
	action: 'signin' | 'signup' | 'app';
};

export function AuthAction({ action, children, ...props }: AuthActionProps) {
	const { isSignedIn } = useAuth();
	const { openSignIn, openSignUp } = useClerk();
	const router = useRouter();

	const handleClick = () => {
		if (action === 'app') {
			if (isSignedIn) {
				router.push('/home');
			} else {
				void openSignIn({ fallbackRedirectUrl: '/home' });
			}
			return;
		}
		if (action === 'signup') {
			void openSignUp({ fallbackRedirectUrl: '/home' });
			return;
		}
		void openSignIn({ fallbackRedirectUrl: '/home' });
	};

	return (
		<Button {...props} onClick={handleClick}>
			{children}
		</Button>
	);
}
