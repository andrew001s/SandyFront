import { SignUp } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { noIndexMetadata } from '@/lib/seo';

export const metadata: Metadata = noIndexMetadata;

export default function SignUpPage() {
	return (
		<div className='flex min-h-screen items-center justify-center'>
			<SignUp forceRedirectUrl='/home' fallbackRedirectUrl='/home' />
		</div>
	);
}
