'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { KickAuthProvider, useKickAuthContext } from '@/context/KickAuthContext';
import { TwitchAuthProvider, useTwitchAuthContext } from '@/context/TwitchAuthContext';
import { YoutubeAuthProvider, useYoutubeAuthContext } from '@/context/YoutubeAuthContext';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { SiKick, SiTwitch, SiYoutube } from 'react-icons/si';

type ConnectionTileProps = {
	title: string;
	subtitle: string;
	icon: ReactNode;
	avatarSrc?: string | null;
	avatarAlt: string;
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
	subtitle,
	icon,
	avatarSrc,
	avatarAlt,
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
			className='h-full min-w-0'
		>
			<div className='relative z-10 flex h-full flex-col'>
				<div className='flex h-full flex-1 flex-col gap-4'>
					<div className='relative flex h-full flex-col overflow-hidden rounded-[28px] border border-border/50 bg-background/35 p-5'>
						<div
							className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-30 ${accentClassName}`}
						/>
						<div className='flex items-start justify-between gap-3'>
							<div className='flex min-h-[3.5rem] items-start gap-3'>
								<div className='flex size-12 items-center justify-center rounded-2xl border border-border/70 bg-background/85 shadow-sm'>
									{icon}
								</div>
								<div className='min-w-0'>
									<p className='font-medium text-lg'>{title}</p>
									<p className='text-muted-foreground text-sm'>{subtitle}</p>
								</div>
							</div>
							<span
								className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium text-[11px] ${
									connected
										? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
										: 'border-border/70 bg-background/70 text-muted-foreground'
								}`}
							>
								{connected ? <CheckCircle2 className='size-3.5' /> : null}
								{connected ? 'Conectado' : 'Listo'}
							</span>
						</div>
						<div className='mt-5 flex h-44 items-center justify-center rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_42%),linear-gradient(160deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))]'>
							<div className='flex size-24 items-center justify-center rounded-full border border-white/10 bg-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.18)]'>
								{connected && avatarSrc ? (
									<Avatar className='size-20 border border-white/10'>
										<AvatarImage src={avatarSrc} alt={avatarAlt} className='object-cover' />
										<AvatarFallback className='font-bold text-xl'>
											{title.charAt(0).toUpperCase()}
										</AvatarFallback>
									</Avatar>
								) : (
									<div className='flex size-20 items-center justify-center rounded-full bg-white/10'>
										{icon}
									</div>
								)}
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
									className={`mt-4 h-11 w-full justify-center rounded-2xl ${ctaClassName ?? ''}`}
								>
									{loading ? (
										<Loader2 className='size-4 animate-spin' />
									) : (
										<ArrowRight className='size-4' />
									)}
									{connectLabel}
								</Button>
							)}
						</div>
					</div>
				</div>
			</div>
		</motion.div>
	);
}

function TwitchConnectionTile() {
	const { status, isLoading, handleStart, handleClose, profile, fetchProfile } =
		useTwitchAuthContext();

	useEffect(() => {
		if (status && !profile) {
			void fetchProfile();
		}
	}, [fetchProfile, profile, status]);

	return (
		<ConnectionTile
			title='Twitch'
			subtitle='Conecta tu cuenta'
			icon={<SiTwitch className='size-5 text-[#9146FF]' />}
			avatarSrc={profile?.picProfile}
			avatarAlt={profile?.username ?? 'Avatar de Twitch'}
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
	const { status, isLoading, handleConnect, handleDisconnect, profile, fetchProfile } =
		useKickAuthContext();

	useEffect(() => {
		if (status && !profile) {
			void fetchProfile();
		}
	}, [fetchProfile, profile, status]);

	return (
		<ConnectionTile
			title='Kick'
			subtitle='Autentica tu cuenta'
			icon={<SiKick className='size-5 text-[#53FC18]' />}
			avatarSrc={profile?.picProfile}
			avatarAlt={profile?.username ?? 'Avatar de Kick'}
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
	const {
		status,
		tokensAuthenticated,
		isLoading,
		handleConnect,
		handleDisconnect,
		profile,
		fetchProfile,
	} = useYoutubeAuthContext();
	const connected = tokensAuthenticated || status;

	useEffect(() => {
		if (connected && !profile) {
			void fetchProfile();
		}
	}, [connected, fetchProfile, profile]);

	return (
		<ConnectionTile
			title='YouTube'
			subtitle='Vincula tu canal de YouTube'
			icon={<SiYoutube className='size-5 text-[#FF0000]' />}
			avatarSrc={profile?.picProfile}
			avatarAlt={profile?.channel_title ?? profile?.username ?? 'Avatar de YouTube'}
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
		<div className='grid grid-cols-1 gap-5 lg:grid-cols-2'>
			<TwitchAuthProvider disableInitialProfileLoad>
				<TwitchConnectionTile />
			</TwitchAuthProvider>
			<KickAuthProvider disableInitialStatusLoad>
				<KickConnectionTile />
			</KickAuthProvider>
			<YoutubeAuthProvider disableInitialStatusLoad>
				<div className='lg:col-span-2'>
					<YoutubeConnectionTile />
				</div>
			</YoutubeAuthProvider>
		</div>
	);
}
