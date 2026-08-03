'use client';

import { ConnectionCardSkeleton } from '@/components/loading/dashboard-skeletons';
import { useYoutubeAuthContext } from '@/context/YoutubeAuthContext';
import { useState } from 'react';
import { SocialConnectionCard } from './SocialConnectionCard';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

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
		handleUpdateBroadcast,
	} = useYoutubeAuthContext();

	const [broadcastTitle, setBroadcastTitle] = useState('');
	const [isUpdatingBroadcast, setIsUpdatingBroadcast] = useState(false);

	const connected = tokensAuthenticated || status;
	const broadcastId = profile?.broadcast_id ?? serviceStatus?.youtube_broadcast_id;
	const channelName =
		profile?.channel_title ?? profile?.username ?? serviceStatus?.youtube_channel_title ?? 'YouTube';

	if (isRefreshing) {
		return <ConnectionCardSkeleton />;
	}

	const handleUpdateTitle = async () => {
		const title = broadcastTitle.trim();
		if (!title || !broadcastId) return;
		setIsUpdatingBroadcast(true);
		try {
			await handleUpdateBroadcast({ broadcast_id: broadcastId, title });
			setBroadcastTitle('');
		} finally {
			setIsUpdatingBroadcast(false);
		}
	};

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
		>
			{broadcastId ? (
				<div className='space-y-2 rounded-2xl border border-border/70 bg-background/80 p-4'>
					<label className='font-medium text-foreground text-sm' htmlFor='youtube-broadcast-title'>
						Actualizar título del stream
					</label>
					<div className='flex items-center gap-2'>
						<Input
							id='youtube-broadcast-title'
							value={broadcastTitle}
							onChange={(e) => setBroadcastTitle(e.target.value)}
							placeholder='Nuevo título'
							disabled={isUpdatingBroadcast}
							onKeyDown={(e) => {
								if (e.key === 'Enter') void handleUpdateTitle();
							}}
						/>
						<Button onClick={() => void handleUpdateTitle()} disabled={isUpdatingBroadcast || !broadcastTitle.trim()}>
							Actualizar
						</Button>
					</div>
				</div>
			) : null}
		</SocialConnectionCard>
	);
};
