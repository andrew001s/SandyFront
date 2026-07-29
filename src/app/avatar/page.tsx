import { AvatarContainer } from '@/containers/avatar/AvatarContainer';
import { DashboardShell } from '@/containers/dashboard/DashboardShell';

export default function Page() {
	return (
		<DashboardShell>
			<AvatarContainer />
		</DashboardShell>
	);
}
