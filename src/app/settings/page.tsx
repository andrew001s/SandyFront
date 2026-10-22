import { SettingsPanel } from '@/components/Settings/SettingsPanel';
import { PageHeader } from '@/components/ui/page-header';
import { DashboardShell } from '@/containers/dashboard/DashboardShell';
import { noIndexMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = noIndexMetadata;

export default async function SettingsPage({
	searchParams,
}: {
	searchParams: Promise<{ tab?: string }>;
}) {
	const { tab } = await searchParams;

	return (
		<DashboardShell>
			<div className='mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 md:px-6'>
				<PageHeader
					tag='Parámetros del Sistema · Proveedores de IA'
					title='Configuración General'
					description='Ajusta tus claves de API (BYOK), modelos de IA (Gemini / OpenRouter), motor de voz Fish Audio y transcripción de micrófono.'
				/>
				<SettingsPanel defaultTab={tab} />
			</div>
		</DashboardShell>
	);
}
