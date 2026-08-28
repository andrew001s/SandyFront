import { SettingsSectionCard } from '@/components/Settings/SettingsSectionCard';
import { Button } from '@/components/ui/button';
import { Power, Square } from 'lucide-react';

type ServiceLifecycleSectionProps = {
	isStopping: boolean;
	onStopService: () => void;
};

export function ServiceLifecycleSection({
	isStopping,
	onStopService,
}: ServiceLifecycleSectionProps) {
	return (
		<SettingsSectionCard
			icon={<Power className='size-5' />}
			title='Ciclo de vida del servicio'
			description='La VTuber solo arranca y se detiene cuando tú lo pides.'
			statusLabel='Manual'
			statusTone='border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400'
		>
			<div className='space-y-5'>
				<p className='text-muted-foreground text-sm'>
					Los servicios se inician y se paran desde el panel. También se apagan solos si cierras o
					recargas esta página, para que no sigan consumiendo tokens sin nadie delante.
				</p>

				<Button
					type='button'
					variant='outline'
					onClick={onStopService}
					disabled={isStopping}
					className='w-full'
				>
					<Square className='size-4' />
					{isStopping ? 'Pausando...' : 'Pausar servicios'}
				</Button>
			</div>
		</SettingsSectionCard>
	);
}
