'use client';

import { useKickAuthContext } from '@/context/KickAuthContext';
import { ConnectionCardSkeleton } from '@/components/loading/dashboard-skeletons';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { SocialConnectionCard } from './SocialConnectionCard';

export const CardConnectionKick = () => {
	const { profile, status, isLoading, isRefreshing, handleConnect, handleDisconnect, fetchProfile } =
		useKickAuthContext();

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
			statusLabel='Autenticado'
			statusPrefix='Estado de Kick'
			connected={status}
			isLoading={isLoading}
			avatarSrc={profile?.picProfile}
			avatarAlt='Avatar de Kick'
			connectLabel='Conectar con Kick'
			disconnectLabel='Cerrar sesión Kick'
			onConnect={() => void handleConnect()}
			onDisconnect={() => void handleDisconnect()}
		/>
	);
};
