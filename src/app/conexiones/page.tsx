import { CardConnectionKick } from '@/components/CardConnections/CardConnectionKick';
import { CardConnectionBot } from '@/components/CardConnections/CardConnectionBot';
import { CardConnectionProfile } from '@/components/CardConnections/CardConnectionProfile';
import { DashboardShell } from '@/containers/dashboard/DashboardShell';
import { KickAuthProvider } from '@/context/KickAuthContext';
import { StatusProviderBot } from '@/context/StatusContextBot';
import { TwitchAuthBotProvider, TwitchAuthProvider } from '@/context/TwitchAuthContext';
import { Star } from 'lucide-react';
import { SiKick, SiTwitch } from 'react-icons/si';

function SocialSection({
	icon,
	title,
	description,
	children,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
	children: React.ReactNode;
}) {
	return (
		<section className='space-y-4'>
			<div className='flex items-center gap-3'>
				<div className='flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-background/80 text-foreground shadow-sm'>
					{icon}
				</div>
				<div>
					<h2 className='font-semibold text-xl'>{title}</h2>
					<p className='text-muted-foreground text-sm'>{description}</p>
				</div>
			</div>
			<div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>{children}</div>
		</section>
	);
}

export default function ConexionesPage() {
	return (
		<DashboardShell>
			<div className='mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 md:px-6'>
				<header className='mb-8'>
					<h1 className='font-bold text-3xl [font-family:var(--font-unbounded)] sm:text-4xl'>
						<span className='bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent dark:from-[#A78BFA] dark:to-[#22D3EE]'>
							Conexiones
						</span>
						<span className='ml-3 inline-block animate-[twinkle_3s_ease-in-out_infinite] text-amber-400 dark:text-[#FDE68A]'>
							<Star size={22} className='fill-amber-400 dark:fill-[#FDE68A]' />
						</span>
					</h1>
					<p className='mt-2 max-w-xl text-muted-foreground'>
						Conecta tus cuentas de Twitch y Kick para que Sandy Studio reaccione a tu chat en
						tiempo real.
					</p>
				</header>

				<div className='space-y-8'>
					<SocialSection
						icon={<SiTwitch className='size-5 text-[#9146FF]' />}
						title='Twitch'
						description='Gestiona la cuenta principal y el bot de Twitch.'
					>
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
					</SocialSection>

					<SocialSection
						icon={<SiKick className='size-5 text-[#53FC18]' />}
						title='Kick'
						description='Gestiona tu conexión de Kick con la misma experiencia visual.'
					>
						<div className='w-full'>
							<KickAuthProvider>
								<CardConnectionKick />
							</KickAuthProvider>
						</div>
					</SocialSection>
				</div>
			</div>
		</DashboardShell>
	);
}
