'use client';

import { ConnectionCardSkeleton } from '@/components/loading/dashboard-skeletons';
import { useKickAuthContext } from '@/context/KickAuthContext';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { SocialConnectionCard } from './SocialConnectionCard';

export const CardConnectionKick = () => {
	const {
		profile,
		status,
		isLoading,
		isRefreshing,
		handleConnect,
		handleDisconnect,
		fetchProfile,
	} = useKickAuthContext();

	useEffect(() => {
		if (status && !profile) {
			fetchProfile().catch(() => {
				toast.error('No se pudo cargar el perfil de Kick');
			});
		}
	}, [status, profile, fetchProfile]);

	const showSkeleton = isLoading || isRefreshing;

	if (showSkeleton) {
		return <ConnectionCardSkeleton />;
	}

	return (
		<SocialConnectionCard
			name={profile?.username ?? 'Kick'}
			fallbackTitle='Kick'
			statusLabel='Autenticado'
			statusPrefix='Estado de Kick'
			connected={status}
			isLoading={isLoading}
			avatarSrc={profile?.picProfile}
			avatarAlt='Avatar de Kick'
			platformIcon={
				<div className='flex size-full items-center justify-center bg-[#53FC18]/10 text-[#53FC18]'>
					<span className='font-bold font-mono text-base'>K</span>
				</div>
			}
			connectLabel='Conectar con Kick'
			disconnectLabel='Cerrar sesión Kick'
			onConnect={() => void handleConnect()}
			onDisconnect={() => void handleDisconnect()}
		/>
	);
};
