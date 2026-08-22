import { SignIn } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { noIndexMetadata } from '@/lib/seo';

export const metadata: Metadata = noIndexMetadata;

export default function SignInPage() {
	return (
		<div className='flex min-h-screen items-center justify-center'>
			<SignIn forceRedirectUrl='/home' fallbackRedirectUrl='/home' />
		</div>
	);
}
