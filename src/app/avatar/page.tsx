import { RequireOnboarding } from '@/components/onboarding/RequireOnboarding';
import { AvatarContainer } from '@/containers/avatar/AvatarContainer';
import { DashboardShell } from '@/containers/dashboard/DashboardShell';
import { ExpressionHotkeysProvider } from '@/context/ExpressionHotkeysContext';
import { noIndexMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = noIndexMetadata;

export default function Page() {
	return (
		<DashboardShell>
			<RequireOnboarding />
			<ExpressionHotkeysProvider>
				<AvatarContainer />
			</ExpressionHotkeysProvider>
		</DashboardShell>
	);
}
