'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Plug, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { SiKick, SiTwitch, SiYoutube } from 'react-icons/si';
import { KickAuthProvider, useKickAuthContext } from '@/context/KickAuthContext';
import { TwitchAuthProvider, useTwitchAuthContext } from '@/context/TwitchAuthContext';
import { YoutubeAuthProvider, useYoutubeAuthContext } from '@/context/YoutubeAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ConnectionTileProps = {
	title: string;
	description: string;
	icon: ReactNode;
	accentClassName: string;
	connected: boolean;
	loading: boolean;
	connectLabel: string;
	disconnectLabel: string;
	onConnect: () => void;
	onDisconnect: () => void;
	ctaClassName?: string;
};

function ConnectionTile({
	title,
	description,
	icon,
	accentClassName,
	connected,
	loading,
	connectLabel,
	disconnectLabel,
	onConnect,
	onDisconnect,
	ctaClassName,
}: ConnectionTileProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			whileHover={{ y: -2 }}
			transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
			className='min-w-0'
		>
			<div className='relative h-full overflow-hidden rounded-3xl border border-border/60 bg-card/90 shadow-[0_12px_40px_rgba(0,0,0,0.12)]'>
				<div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${accentClassName}`} />
				<div className='relative z-10 flex h-full flex-col gap-4 p-5'>
					<div className='flex items-start gap-3'>
						<div className='flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-background/80 shadow-sm'>
							{icon}
						</div>
						<div className='min-w-0 flex-1'>
							<div className='flex items-center justify-between gap-3'>
								<h3 className='font-semibold text-lg'>{title}</h3>
								<span
									className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium text-[11px] ${
										connected
											? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
											: 'border-border/70 bg-background/70 text-muted-foreground'
									}`}
								>
									{connected ? <CheckCircle2 className='size-3.5' /> : null}
									{connected ? 'Conectado' : 'Pendiente'}
								</span>
							</div>
							<p className='mt-1 text-muted-foreground text-sm leading-relaxed'>{description}</p>
						</div>
					</div>

					<div className='mt-auto'>
						{connected ? (
							<Button
								type='button'
								variant='outline'
								onClick={onDisconnect}
								disabled={loading}
								className='h-11 w-full justify-center rounded-2xl'
							>
								{loading ? <Loader2 className='size-4 animate-spin' /> : null}
								{disconnectLabel}
							</Button>
						) : (
							<Button
								type='button'
								onClick={onConnect}
								disabled={loading}
								className={`h-11 w-full justify-center rounded-2xl ${ctaClassName ?? ''}`}
							>
								{loading ? <Loader2 className='size-4 animate-spin' /> : <ArrowRight className='size-4' />}
								{connectLabel}
							</Button>
						)}
					</div>
				</div>
			</div>
		</motion.div>
	);
}

function TwitchConnectionTile() {
	const { status, isLoading, handleStart, handleClose } = useTwitchAuthContext();

	return (
		<ConnectionTile
			title='Twitch'
			description='Sin salir del onboarding, conecta tu cuenta principal para dejar listo el flujo.'
			icon={<SiTwitch className='size-5 text-[#9146FF]' />}
			accentClassName='from-[#9146FF]/18 to-transparent'
			connected={status}
			loading={isLoading}
			connectLabel='Conectar Twitch'
			disconnectLabel='Desconectar Twitch'
			onConnect={() => void handleStart(false)}
			onDisconnect={() => void handleClose()}
		/>
	);
}

function KickConnectionTile() {
	const { status, isLoading, handleConnect, handleDisconnect } = useKickAuthContext();

	return (
		<ConnectionTile
			title='Kick'
			description='Sin cambiar de pantalla. Autentica Kick y continúa con el siguiente paso.'
			icon={<SiKick className='size-5 text-[#53FC18]' />}
			accentClassName='from-[#53FC18]/18 to-transparent'
			connected={status}
			loading={isLoading}
			connectLabel='Conectar Kick'
			disconnectLabel='Desconectar Kick'
			onConnect={() => void handleConnect()}
			onDisconnect={() => void handleDisconnect()}
		/>
	);
}

function YoutubeConnectionTile() {
	const { status, tokensAuthenticated, isLoading, handleConnect, handleDisconnect } =
		useYoutubeAuthContext();
	const connected = tokensAuthenticated || status;

	return (
		<ConnectionTile
			title='YouTube'
			description='Conecta YouTube dentro del mismo onboarding para seguir sin perder contexto.'
			icon={<SiYoutube className='size-5 text-[#FF0000]' />}
			accentClassName='from-[#FF0000]/18 to-transparent'
			connected={connected}
			loading={isLoading}
			connectLabel='Conectar YouTube'
			disconnectLabel='Desconectar YouTube'
			onConnect={() => void handleConnect()}
			onDisconnect={() => void handleDisconnect()}
			ctaClassName='bg-[#FF0000] hover:bg-[#cc0000]'
		/>
	);
}

export function OnboardingConnectionsRow() {
	return (
		<Card className='border-border/70 bg-background/80 shadow-sm'>
			<CardHeader className='space-y-2 border-b border-border/60'>
				<div className='flex items-center gap-2'>
					<div className='flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-background'>
						<Plug className='size-5 text-primary' />
					</div>
					<div>
						<CardTitle className='text-xl'>Conecta tus cuentas aquí mismo</CardTitle>
						<CardDescription>
							Todo sucede dentro del onboarding. Sin cambiar de pantalla, sin perder el hilo.
						</CardDescription>
					</div>
				</div>
			</CardHeader>

			<CardContent className='p-5 sm:p-6'>
				<div className='grid grid-cols-1 gap-4 xl:grid-cols-3 xl:items-stretch'>
					<TwitchAuthProvider disableInitialProfileLoad>
						<TwitchConnectionTile />
					</TwitchAuthProvider>
					<KickAuthProvider disableInitialStatusLoad>
						<KickConnectionTile />
					</KickAuthProvider>
					<YoutubeAuthProvider disableInitialStatusLoad>
						<YoutubeConnectionTile />
					</YoutubeAuthProvider>
				</div>
			</CardContent>
		</Card>
	);
}
