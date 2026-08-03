'use client';
import { getTokens } from '@/api/fetchAuth';
import { start } from '@/api/sandycore';
import { ConnectionCardSkeleton } from '@/components/loading/dashboard-skeletons';
import { useTwitchAuthContext } from '@/context/TwitchAuthContext';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { SocialConnectionCard } from './SocialConnectionCard';

export const CardConnectionProfile = () => {
	const {
		profile,
		status,
		isLoading,
		isProfileLoading,
		setIsLoading,
		handleStart,
		handleClose,
		fetchProfile,
		setStatus,
	} = useTwitchAuthContext();

	useEffect(() => {
		if (status && !profile) {
			fetchProfile();
		}
	}, [status, profile, fetchProfile]);

	const showSkeleton = isLoading || isProfileLoading;

	const handleStartConnection = async () => {
		const tokens = await getTokens(false);
		if (!tokens.tokens || !tokens.tokens.token || !tokens.tokens.refresh_token) {
			handleStart(false);
		} else {
			try {
				setIsLoading(true);
				await start(false);
				setStatus(true);
				await fetchProfile();
				toast.success('Conectado a Twitch');
			} catch (error) {
				console.error('Error al reconectar:', error);
				toast.error('Error al reconectar, iniciando nuevo proceso de autenticación');
				handleStart(false);
			} finally {
				setIsLoading(false);
			}
		}
	};

	if (showSkeleton) {
		return <ConnectionCardSkeleton />;
	}

	return (
		<SocialConnectionCard
			name={profile?.username ?? 'Twitch'}
			statusLabel='Autenticado'
			statusPrefix='Estado de Twitch'
			connected={status}
			isLoading={isLoading}
			avatarSrc={profile?.picProfile}
			avatarAlt='Avatar de Twitch'
			connectLabel='Conectar con Twitch'
			disconnectLabel='Cerrar sesión Twitch'
			onConnect={() => void handleStartConnection()}
			onDisconnect={() => void handleClose()}
		/>
	);
};
