import { CardConnectionBot } from '@/components/CardConnections/CardConnectionBot';
import { CardConnectionProfile } from '@/components/CardConnections/CardConnectionProfile';
import { DashboardShell } from '@/containers/dashboard/DashboardShell';
import { StatusProviderBot } from '@/context/StatusContextBot';
import { TwitchAuthBotProvider, TwitchAuthProvider } from '@/context/TwitchAuthContext';
import { Star } from 'lucide-react';

export default function ConexionesPage() {
	return (
		<DashboardShell>
			<div className='mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 md:px-6'>
				<header className='mb-8'>
					<span className='mb-3 inline-flex items-center gap-2 font-semibold text-violet-600 text-xs uppercase tracking-[0.25em] dark:text-[#A78BFA]'>
						<Star
							size={12}
							className='fill-amber-400 text-amber-500 dark:fill-[#FDE68A] dark:text-[#FDE68A]'
						/>
						Conexiones
					</span>
					<h1 className='font-bold text-3xl [font-family:var(--font-unbounded)] sm:text-4xl'>
						<span className='bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent dark:from-[#A78BFA] dark:to-[#22D3EE]'>
							Conexión
						</span>
						<span className='ml-3 inline-block animate-[twinkle_3s_ease-in-out_infinite] text-amber-400 dark:text-[#FDE68A]'>
							<Star size={22} className='fill-amber-400 dark:fill-[#FDE68A]' />
						</span>
					</h1>
					<p className='mt-2 max-w-xl text-muted-foreground'>
						Conecta tu canal y el bot de Twitch para que Sandy Studio reaccione a tu chat en tiempo
						real.
					</p>
				</header>

				<div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
					<div className='w-full'>
						<TwitchAuthProvider>
							<CardConnectionProfile />
						</TwitchAuthProvider>
					</div>
					<div className='w-full'>
						<StatusProviderBot>
							<TwitchAuthBotProvider>
								<CardConnectionBot />
							</TwitchAuthBotProvider>
						</StatusProviderBot>
					</div>
				</div>
			</div>
		</DashboardShell>
	);
}
