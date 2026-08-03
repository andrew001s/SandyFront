'use client';
import { getTokens } from '@/api/fetchAuth';
import { start } from '@/api/sandycore';
import { ConnectionCardSkeleton } from '@/components/loading/dashboard-skeletons';
import { useStatus } from '@/context/StatusContext';
import { useTwitchAuthBotContext } from '@/context/TwitchAuthContext';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { SocialConnectionCard } from './SocialConnectionCard';

export const CardConnectionBot = () => {
	const { status: globalStatus } = useStatus();
	const {
		isLoading,
		isProfileLoading,
		setIsLoading,
		profile,
		status,
		handleStart,
		handleClose,
		fetchProfile,
		setStatus,
	} = useTwitchAuthBotContext();

	useEffect(() => {
		if (status && !profile) {
			fetchProfile();
		}
	}, [status, profile, fetchProfile]);

	const showSkeleton = isLoading || isProfileLoading;

	const handleStartConnection = async () => {
		const tokens = await getTokens(true);
		if (!tokens.tokens || !tokens.tokens.token || !tokens.tokens.refresh_token) {
			handleStart(true);
		} else {
			try {
				setIsLoading(true);
				await start(true);
				setStatus(true);
				await fetchProfile();
				toast.success('Conectado a Twitch');
			} catch (error) {
				console.error('Error al reconectar:', error);
				toast.error('Error al reconectar, iniciando nuevo proceso de autenticación');
				handleStart(true);
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
			connectDisabled={!globalStatus}
			avatarSrc={profile?.picProfile}
			avatarAlt='Avatar de Twitch'
			connectLabel='Conectar con Twitch'
			disconnectLabel='Cerrar sesión Twitch'
			onConnect={() => void handleStartConnection()}
			onDisconnect={() => void handleClose()}
			isPrincipal={false}
		/>
	);
};
