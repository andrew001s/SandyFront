import { SettingsPanel } from '@/components/Settings/SettingsPanel';
import { DashboardShell } from '@/containers/dashboard/DashboardShell';

export default function SettingsPage() {
	return (
		<DashboardShell>
			<div className='px-4 py-6'>
				<div className='mx-auto max-w-7xl space-y-6'>
					<SettingsPanel />
				</div>
			</div>
		</DashboardShell>
	);
}
