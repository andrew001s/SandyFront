import { CardConnectionBot } from '@/components/CardConnections/CardConnectionBot';
import { CardConnectionKick } from '@/components/CardConnections/CardConnectionKick';
import { CardConnectionProfile } from '@/components/CardConnections/CardConnectionProfile';
import { CardConnectionYoutube } from '@/components/CardConnections/CardConnectionYoutube';
import { PageHeader } from '@/components/ui/page-header';
import { DashboardShell } from '@/containers/dashboard/DashboardShell';
import { KickAuthProvider } from '@/context/KickAuthContext';
import { StatusProviderBot } from '@/context/StatusContextBot';
import { TwitchAuthBotProvider, TwitchAuthProvider } from '@/context/TwitchAuthContext';
import { YoutubeAuthProvider } from '@/context/YoutubeAuthContext';
import { noIndexMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { SiKick, SiTwitch, SiYoutube } from 'react-icons/si';

export const metadata: Metadata = noIndexMetadata;

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
		<section className='overflow-hidden rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5'>
			<div className='mb-4 flex items-center gap-3'>
				<div className='flex size-9 items-center justify-center rounded-lg border border-border bg-background shadow-xs'>
					{icon}
				</div>
				<div>
					<h2 className='font-display font-semibold text-base text-foreground'>{title}</h2>
					<p className='font-sans text-muted-foreground text-xs'>{description}</p>
				</div>
			</div>
			<div className='grid grid-cols-1 gap-3 xl:grid-cols-2'>{children}</div>
		</section>
	);
}

export default function ConexionesPage() {
	return (
		<DashboardShell>
			<div className='mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 md:px-6'>
				<PageHeader
					tag='Plataformas de Emisión · Canales en Vivo'
					title='Conexiones de Streaming'
					description='Vincula tus cuentas de Twitch, Kick y YouTube con OAuth para que Sandy Studio escuche los mensajes y reaccione en tu transmisión.'
				/>

				<div className='space-y-4'>
					<SocialSection
						icon={<SiTwitch className='size-4 text-[#9146FF]' />}
						title='Twitch'
						description='Gestiona tu canal principal de streamer y la cuenta secundaria del bot.'
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
						icon={<SiKick className='size-4 text-[#53FC18]' />}
						title='Kick'
						description='Conecta tu canal de Kick mediante Pusher para leer eventos y chat en directo.'
					>
						<div className='w-full'>
							<KickAuthProvider>
								<CardConnectionKick />
							</KickAuthProvider>
						</div>
					</SocialSection>

					<SocialSection
						icon={<SiYoutube className='size-4 text-[#FF0000]' />}
						title='YouTube Live'
						description='Vincula tu cuenta de Google para monitorizar el chat de transmisiones en vivo.'
					>
						<div className='w-full'>
							<YoutubeAuthProvider>
								<CardConnectionYoutube />
							</YoutubeAuthProvider>
						</div>
					</SocialSection>
				</div>
			</div>
		</DashboardShell>
	);
}
