import { ModerationPanel } from '@/components/Moderation/ModerationPanel';
import { PageHeader } from '@/components/ui/page-header';
import { DashboardShell } from '@/containers/dashboard/DashboardShell';
import { noIndexMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = noIndexMetadata;

export default function ModeracionPage() {
	return (
		<DashboardShell>
			<div className='mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 md:px-6'>
				<PageHeader
					tag='Seguridad · Filtros de Chat'
					title='Moderación Automática'
					description='Define qué palabras, patrones, símbolos y enlaces debe bloquear Sandy en los mensajes entrantes de tu transmisión.'
				/>

				<ModerationPanel />
			</div>
		</DashboardShell>
	);
}
