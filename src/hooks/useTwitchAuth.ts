import { deleteAuth, postAuth, saveTokens } from '@/api/fetchAuth';
import { getProfileInfo } from '@/api/fetchProfile';
import { start } from '@/api/sandycore';
import { getAccessToken, getTwitchAuthUrl } from '@/api/twitchAuth';
import { useStatus } from '@/context/StatusContext';
import { useStatusBot } from '@/context/StatusContextBot';
import { useAuth } from '@clerk/nextjs';
import type { ProfileModel } from '@/interfaces/profileInterface';
import axios from 'axios';
import posthog from 'posthog-js';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface UseTwitchAuthReturn {
	profile: ProfileModel | null;
	status: boolean;
	isLoading: boolean;
	isProfileLoading: boolean;
	setIsLoading: (value: boolean) => void;
	setStatus: (value: boolean) => void;
	handleStart: (bot: boolean) => Promise<void>;
	handleClose: () => Promise<void>;
	fetchProfile: () => Promise<void>;
}

export const useTwitchAuth = (defaultIsBot?: boolean): UseTwitchAuthReturn => {
	const [profile, setProfile] = useState<ProfileModel | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isProfileLoading, setIsProfileLoading] = useState(true);
	const { status: userStatus, setStatus: setUserStatus } = useStatus();
	const { statusBot, setStatusBot } = useStatusBot();
	const { getToken, isLoaded, isSignedIn } = useAuth();
	const [isBot] = useState(defaultIsBot ?? false);

	const status = isBot ? statusBot : userStatus;
	const setStatus = useCallback(
		(value: boolean) => {
			if (isBot) {
				setStatusBot(value);
			} else {
				setUserStatus(value);
			}
		},
		[isBot, setStatusBot, setUserStatus],
	);
	const fetchProfile = useCallback(async () => {
		try {
			setIsProfileLoading(true);
			if (!isLoaded || !isSignedIn) {
				return;
			}

			const token = await getToken();
			if (!token) {
				throw new Error('No se pudo obtener el token de Clerk');
			}

			const profileInfo = await getProfileInfo(isBot, { token });
			setProfile(profileInfo);
		} catch (error) {
			console.error('Error al obtener el perfil:', error);
			const errorMessage = axios.isAxiosError(error)
				? typeof error.response?.data === 'object' && error.response?.data !== null
					? String(
							(error.response.data as { detail?: unknown; message?: unknown }).detail ??
								(error.response.data as { detail?: unknown; message?: unknown }).message ??
								'',
						)
					: error.message
				: error instanceof Error
					? error.message
					: '';

			if (!(isBot && errorMessage.includes('No existe una sesión de bot autenticada para este usuario'))) {
				toast.error('No se pudo cargar el perfil');
			}
			setStatus(false);
		} finally {
			setIsProfileLoading(false);
		}
	}, [getToken, isBot, isLoaded, isSignedIn, setProfile, setStatus]);

	useEffect(() => {
		void fetchProfile();
	}, [fetchProfile]);

	const handleStart = useCallback(
		async (bot: boolean) => {
			if (bot !== isBot) {
				console.error('Tipo de conexión incorrecto');
				return;
			}

			try {
				setIsLoading(true);
				const authUrl = getTwitchAuthUrl();

				const authWindow = window.open(authUrl, '_blank');

				if (!authWindow) {
					toast.error('No se pudo abrir la página de autenticación');
					setIsLoading(false);
					return;
				}

				const handleCallback = async (event: MessageEvent) => {
					if (event.origin !== window.location.origin) return;

					if (event.data.type === 'TWITCH_AUTH_CALLBACK') {
						try {
							const code = event.data.code;
							const tokenData = await getAccessToken(code);
							await postAuth({
								token: tokenData.access_token,
								refresh_token: tokenData.refresh_token,
								bot: bot,
							});
							await saveTokens(bot, {
								tokens: {
									token: tokenData.access_token,
									refresh_token: tokenData.refresh_token,
								},
							});
							await start(bot);
							setStatus(true);
							posthog.capture('twitch_account_connected', {
								account_type: bot ? 'bot' : 'primary',
							});
							toast.success('Conectado a Twitch');
						} catch (error) {
							console.error('Error en la autenticación:', error);
							toast.error('Error en la autenticación de Twitch');
							setStatus(false);
						} finally {
							setIsLoading(false);
							window.removeEventListener('message', handleCallback);
						}
					} else if (event.data.type === 'TWITCH_AUTH_ERROR') {
						console.error('Error de autenticación:', event.data.error);
						toast.error(`Error de autenticación: ${event.data.error}`);
						setIsLoading(false);
						setStatus(false);
					}
				};

				window.addEventListener('message', handleCallback);
			} catch (error) {
				console.error('Error iniciando sesión:', error);
				toast.error('Error al conectar con Twitch');
				setStatus(false);
			}
		},
		[setStatus, isBot],
	);
	const handleClose = useCallback(async () => {
		try {
			setIsLoading(true);
			await deleteAuth(isBot);
			posthog.capture('twitch_account_disconnected', {
				account_type: isBot ? 'bot' : 'primary',
			});
			setStatus(false);
			setProfile(null);
			toast.info('Sesión Twitch cerrada');
		} catch (error) {
			console.error('Error cerrando sesión:', error);
			toast.error('Error al cerrar sesión');
		} finally {
			setIsLoading(false);
		}
	}, [setStatus, isBot, setProfile]);
	return {
		profile,
		status,
		isLoading,
		isProfileLoading,
		setIsLoading,
		setStatus,
		handleStart,
		handleClose,
		fetchProfile,
	};
};
