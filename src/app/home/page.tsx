import type { Metadata } from 'next';
import { DashboardShell } from '@/containers/dashboard/DashboardShell';
import { HomeContainer } from '@/containers/home/HomeContainer';
import { noIndexMetadata } from '@/lib/seo';

export const metadata: Metadata = noIndexMetadata;

export default function Page() {
	return (
		<DashboardShell>
			<HomeContainer />
		</DashboardShell>
	);
}
