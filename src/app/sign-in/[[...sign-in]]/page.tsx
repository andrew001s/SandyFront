import { noIndexMetadata } from '@/lib/seo';
import { SignIn } from '@clerk/nextjs';
import type { Metadata } from 'next';

export const metadata: Metadata = noIndexMetadata;

export default function SignInPage() {
	return (
		<div className='flex min-h-screen items-center justify-center'>
			<SignIn forceRedirectUrl='/home' fallbackRedirectUrl='/home' />
		</div>
	);
}
