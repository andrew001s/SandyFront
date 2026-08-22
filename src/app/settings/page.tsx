import type { Metadata } from 'next';
import { SettingsPanel } from '@/components/Settings/SettingsPanel';
import { DashboardShell } from '@/containers/dashboard/DashboardShell';
import { noIndexMetadata } from '@/lib/seo';

export const metadata: Metadata = noIndexMetadata;

export default async function SettingsPage({
	searchParams,
}: {
	searchParams: Promise<{ tab?: string }>;
}) {
	const { tab } = await searchParams;

	return (
		<DashboardShell>
			<div className='px-4 py-6'>
				<div className='mx-auto max-w-7xl space-y-6'>
					<SettingsPanel defaultTab={tab} />
				</div>
			</div>
		</DashboardShell>
	);
}
