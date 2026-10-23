import KickCallback from '@/components/KickCallBack/KickCallBack';
import { noIndexMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = noIndexMetadata;

export default function CallbackPage() {
	return <KickCallback />;
}
