'use client';

import StreamChat from '@/components/Chat/Chat';
import { FeatureFlagsPanel } from '@/components/FeatureFlags/FeatureFlagsPanel';
import { MicrophoneTile } from '@/components/ServiceControl/MicrophoneTile';
import { ServiceStartCard } from '@/components/ServiceControl/ServiceStartCard';
import { TerminalSandy } from '@/components/TerminalSandy/TerminalSandy';
import { SupportCard } from '@/components/home/SupportCard';
import { RequireOnboarding } from '@/components/onboarding/RequireOnboarding';
import { PageHeader } from '@/components/ui/page-header';

export const HomeContainer = () => {
	return (
		<div className='mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 md:px-6'>
			<RequireOnboarding />

			<div id='home-tour-overview'>
				<PageHeader
					tag='Bitácora de Emisión · Consola en Vivo'
					title='Consola de Streaming'
					description='Controla la emisión de tu VTuber, activa el micrófono y vigila la actividad del chat en tiempo real.'
				/>
			</div>

			{/* Controles Principales: Servicio de Emisión + Micrófono */}
			<section className='mb-6'>
				<div className='mb-2.5 flex items-center justify-between px-1'>
					<span className='font-medium font-mono text-[11px] text-muted-foreground uppercase tracking-wider'>
						Controles en Vivo
					</span>
				</div>
				<div id='home-tour-controls' className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
					<ServiceStartCard />
					<MicrophoneTile />
				</div>
			</section>

			{/* Sugerencia / Comunidad */}
			<SupportCard />

			{/* Bitácora de Eventos y Terminal */}
			<section className='mt-6'>
				<div className='mb-2.5 flex items-center justify-between px-1'>
					<span className='font-medium font-mono text-[11px] text-muted-foreground uppercase tracking-wider'>
						Registro de Actividad
					</span>
				</div>
				<TerminalSandy />
				<StreamChat />
			</section>

			{/* Módulos de Emisión (Feature Flags) */}
			<section className='mt-6 mb-8'>
				<FeatureFlagsPanel />
			</section>
		</div>
	);
};
