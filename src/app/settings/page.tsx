import { SettingsPanel } from '@/components/Settings/SettingsPanel';
import { DashboardShell } from '@/containers/dashboard/DashboardShell';

export default function SettingsPage() {
	return (
		<DashboardShell>
			<div className='bg-background p-4'>
				<div className='container mx-auto'>
					<h1 className='mb-6 text-start font-bold text-4xl'>Configuración de IA</h1>
					<SettingsPanel />
				</div>
			</div>
		</DashboardShell>
	);
}
