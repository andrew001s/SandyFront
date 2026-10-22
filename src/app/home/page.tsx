import { DashboardShell } from '@/containers/dashboard/DashboardShell';
import { HomeContainer } from '@/containers/home/HomeContainer';
import { noIndexMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = noIndexMetadata;

export default function Page() {
	return (
		<DashboardShell>
			<HomeContainer />
		</DashboardShell>
	);
}
