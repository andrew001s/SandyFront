import StreamChat from '@/components/Chat/Chat';
import { FeatureFlagsPanel } from '@/components/FeatureFlags/FeatureFlagsPanel';
import { MicrophoneTile } from '@/components/ServiceControl/MicrophoneTile';
import { ServiceStartCard } from '@/components/ServiceControl/ServiceStartCard';
import { TerminalSandy } from '@/components/TerminalSandy/TerminalSandy';
import { Separator } from '@/components/ui/separator';
import { Star } from 'lucide-react';

export const HomeContainer = () => {
	return (
		<div className='mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 md:px-6'>
			<header className='mb-8'>
				<h1 className='font-bold text-3xl [font-family:var(--font-unbounded)] sm:text-4xl'>
					<span className='bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent dark:from-[#A78BFA] dark:to-[#22D3EE]'>
						Dashboard
					</span>
					<span className='ml-3 inline-block animate-[twinkle_3s_ease-in-out_infinite] text-amber-400 dark:text-[#FDE68A]'>
						<Star size={22} className='fill-amber-400 dark:fill-[#FDE68A]' />
					</span>
				</h1>
				<p className='mt-2 max-w-xl text-muted-foreground'>
					Activa las funciones de tu VTuber y controla el micrófono desde aquí.
				</p>
			</header>
			<div className='my-4 flex items-center gap-4'>
				<Separator className='flex-1' />
				<span className='font-semibold text-muted-foreground text-xs uppercase tracking-[0.25em]'>
					Controles
				</span>
				<Separator className='flex-1' />
			</div>

			<div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
				<ServiceStartCard />
				<MicrophoneTile />
			</div>
			<div className='mt-4'>
				<TerminalSandy />
				<StreamChat />
			</div>
			<div className='my-4 flex items-center gap-4'>
				<Separator className='flex-1' />
				<span className='font-semibold text-muted-foreground text-xs uppercase tracking-[0.25em]'>
					Funciones
				</span>
				<Separator className='flex-1' />
			</div>
			<FeatureFlagsPanel />
		</div>
	);
};
