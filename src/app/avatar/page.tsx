import type { Metadata } from 'next';
import { AvatarContainer } from '@/containers/avatar/AvatarContainer';
import { DashboardShell } from '@/containers/dashboard/DashboardShell';
import { noIndexMetadata } from '@/lib/seo';

export const metadata: Metadata = noIndexMetadata;

export default function Page() {
	return (
		<DashboardShell>
			<AvatarContainer />
		</DashboardShell>
	);
}
