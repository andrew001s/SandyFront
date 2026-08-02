import KickCallback from '@/components/KickCallBack/KickCallBack';
import type { Metadata } from 'next';
import { noIndexMetadata } from '@/lib/seo';

export const metadata: Metadata = noIndexMetadata;

export default function CallbackPage() {
	return <KickCallback />;
}
