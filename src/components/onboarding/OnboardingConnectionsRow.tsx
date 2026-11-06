'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { KickAuthProvider, useKickAuthContext } from '@/context/KickAuthContext';
import { TwitchAuthProvider, useTwitchAuthContext } from '@/context/TwitchAuthContext';
import { YoutubeAuthProvider, useYoutubeAuthContext } from '@/context/YoutubeAuthContext';
import { type ReactNode, useEffect } from 'react';
import { SiKick, SiTwitch, SiYoutube } from 'react-icons/si';
import type { OnboardingFlowData } from './onboarding.types';
import { useOnboardingDraft } from './useOnboardingDraft';

function ConnectionTile({
	title,
	icon,
	connected,
	loading,
	avatarSrc,
	onConnect,
	onDisconnect,
}: {
	title: string;
	icon: ReactNode;
	connected: boolean;
	loading: boolean;
	avatarSrc?: string | null;
	onConnect: () => void;
	onDisconnect: () => void;
}) {
	return (
		<div className='flex flex-wrap items-center justify-between gap-3 border-border border-b py-4 last:border-0'>
			<div className='flex min-w-0 items-center gap-3'>
				{connected && avatarSrc ? (
					<Avatar className='size-10'>
						<AvatarImage src={avatarSrc} alt={`Cuenta conectada de ${title}`} />
						<AvatarFallback>{title.charAt(0)}</AvatarFallback>
					</Avatar>
				) : (
					<span
						aria-hidden='true'
						className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground'
					>
						{icon}
					</span>
				)}
				<div>
					<h2 className='font-semibold text-sm'>{title}</h2>
					<p aria-live='polite' className='mt-1 text-muted-foreground text-sm'>
						{loading ? 'Actualizando conexión...' : connected ? 'Cuenta conectada' : 'Sin conectar'}
					</p>
				</div>
			</div>
			<Button
				type='button'
				variant='outline'
				className='min-h-11'
				disabled={loading}
				onClick={connected ? onDisconnect : onConnect}
			>
				{connected ? `Desconectar ${title}` : `Conectar ${title}`}
			</Button>
		</div>
	);
}

function useConnectionStatus(
	key: 'twitchConnected' | 'kickConnected' | 'youtubeConnected',
	status: boolean,
	loading: boolean,
) {
	const { data, update } = useOnboardingDraft();
	useEffect(() => {
		if (!loading && data[key] !== status)
			void update({ [key]: status } as Partial<OnboardingFlowData>);
	}, [data, key, status, loading, update]);
}
function TwitchTile() {
	const { status, isLoading, handleStart, handleClose, profile } = useTwitchAuthContext();
	useConnectionStatus('twitchConnected', status, isLoading);
	return (
		<ConnectionTile
			title='Twitch'
			icon={<SiTwitch className='size-5' />}
			connected={status}
			loading={isLoading}
			avatarSrc={profile?.picProfile}
			onConnect={() => void handleStart(false)}
			onDisconnect={() => void handleClose()}
		/>
	);
}
function KickTile() {
	const { status, isLoading, handleConnect, handleDisconnect, profile } = useKickAuthContext();
	useConnectionStatus('kickConnected', status, isLoading);
	return (
		<ConnectionTile
			title='Kick'
			icon={<SiKick className='size-5' />}
			connected={status}
			loading={isLoading}
			avatarSrc={profile?.picProfile}
			onConnect={() => void handleConnect()}
			onDisconnect={() => void handleDisconnect()}
		/>
	);
}
function YoutubeTile() {
	const { status, tokensAuthenticated, isLoading, handleConnect, handleDisconnect, profile } =
		useYoutubeAuthContext();
	const connected = tokensAuthenticated || status;
	useConnectionStatus('youtubeConnected', connected, isLoading);
	return (
		<ConnectionTile
			title='YouTube'
			icon={<SiYoutube className='size-5' />}
			connected={connected}
			loading={isLoading}
			avatarSrc={profile?.picProfile}
			onConnect={() => void handleConnect()}
			onDisconnect={() => void handleDisconnect()}
		/>
	);
}
export function OnboardingConnectionsRow() {
	return (
		<div>
			<TwitchAuthProvider>
				<TwitchTile />
			</TwitchAuthProvider>
			<KickAuthProvider>
				<KickTile />
			</KickAuthProvider>
			<YoutubeAuthProvider>
				<YoutubeTile />
			</YoutubeAuthProvider>
			<p className='pt-4 text-muted-foreground text-sm leading-relaxed'>
				Vincular una cuenta abre la autorización de esa plataforma. Conecta solo las que quieras
				usar; podrás añadir o quitar canales desde Conexiones.
			</p>
		</div>
	);
}
