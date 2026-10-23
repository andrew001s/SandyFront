'use client';

import { ConnectionCardSkeleton } from '@/components/loading/dashboard-skeletons';
import { useYoutubeAuthContext } from '@/context/YoutubeAuthContext';
import { useEffect } from 'react';
import { SocialConnectionCard } from './SocialConnectionCard';

export const CardConnectionYoutube = () => {
	const {
		profile,
		status,
		tokensAuthenticated,
		serviceStatus,
		isLoading,
		isBusy,
		isRefreshing,
		handleConnect,
		handleDisconnect,
		fetchProfile,
	} = useYoutubeAuthContext();

	const connected = tokensAuthenticated || status;
	const channelName =
		profile?.channel_title ??
		profile?.username ??
		serviceStatus?.youtube_channel_title ??
		'YouTube';

	useEffect(() => {
		if (connected && !profile) {
			void fetchProfile();
		}
	}, [connected, profile, fetchProfile]);

	if (isRefreshing) {
		return <ConnectionCardSkeleton />;
	}

	const rawProfile = profile as Record<string, unknown> | null;
	const avatarSrc =
		profile?.picProfile ||
		(rawProfile?.pic_profile as string | undefined) ||
		(rawProfile?.picture as string | undefined) ||
		(rawProfile?.avatar as string | undefined) ||
		(rawProfile?.avatar_url as string | undefined) ||
		(rawProfile?.thumbnail as string | undefined) ||
		(rawProfile?.thumbnails as Record<string, Record<string, string>> | undefined)?.high?.url ||
		(rawProfile?.thumbnails as Record<string, Record<string, string>> | undefined)?.default?.url ||
		null;

	return (
		<SocialConnectionCard
			name={channelName}
			fallbackTitle='YouTube Live'
			statusLabel='Autenticado'
			statusPrefix='Estado de YouTube'
			connected={connected}
			isLoading={isLoading}
			isBusy={isBusy}
			avatarSrc={avatarSrc}
			avatarAlt={`Avatar de ${channelName}`}
			platformIcon={
				<div className='flex size-full items-center justify-center bg-[#FF0000]/10 text-[#FF0000]'>
					<span className='font-bold font-mono text-xs'>YT</span>
				</div>
			}
			connectLabel='Conectar con YouTube'
			disconnectLabel='Cerrar sesión YouTube'
			onConnect={() => void handleConnect()}
			onDisconnect={() => void handleDisconnect()}
			connectButtonClassName='bg-[#FF0000] hover:bg-[#cc0000]'
		/>
	);
};
