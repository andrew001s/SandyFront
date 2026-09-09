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

	return (
		<SocialConnectionCard
			name={channelName}
			statusLabel='Autenticado'
			statusPrefix='Estado de YouTube'
			connected={connected}
			isLoading={isLoading}
			isBusy={isBusy}
			avatarSrc={profile?.picProfile}
			avatarAlt={`Avatar de ${channelName}`}
			connectLabel='Conectar con YouTube'
			disconnectLabel='Cerrar sesión YouTube'
			onConnect={() => void handleConnect()}
			onDisconnect={() => void handleDisconnect()}
			connectButtonClassName='bg-[#FF0000] hover:bg-[#cc0000]'
		/>
	);
};
