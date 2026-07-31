import { SettingsPanel } from '@/components/Settings/SettingsPanel';
import { DashboardShell } from '@/containers/dashboard/DashboardShell';

export default function SettingsPage() {
	return (
		<DashboardShell>
			<div className='min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-violet-50/40 px-4 py-6 dark:to-background'>
				<div className='mx-auto max-w-7xl'>
					<SettingsPanel />
				</div>
			</div>
		</DashboardShell>
	);
}
