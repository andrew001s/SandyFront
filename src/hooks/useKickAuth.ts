import {
	deleteKickAuth,
	getKickProfileInfo,
	getKickServiceStatus,
	getKickTokens,
	postKickAuth,
	saveKickTokens,
	startKick,
	stopKick,
} from '@/api/kick';
import { getKickAccessToken, getKickAuthUrl } from '@/api/kickAuth';
import type { ProfileModel } from '@/interfaces/profileInterface';
import type { ServiceStatus } from '@/api/sandycore';
import { useAuth } from '@clerk/nextjs';
import posthog from 'posthog-js';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const KICK_OAUTH_STATE_KEY = 'kick_oauth_state';
const KICK_CODE_VERIFIER_KEY = 'kick_code_verifier';

interface UseKickAuthReturn {
	profile: ProfileModel | null;
	status: boolean;
	tokensSaved: boolean;
	serviceStatus: ServiceStatus | null;
	isLoading: boolean;
	isBusy: boolean;
	isRefreshing: boolean;
	setIsLoading: (value: boolean) => void;
	handleConnect: () => Promise<void>;
	handleDisconnect: () => Promise<void>;
	handleToggleService: () => Promise<void>;
	fetchProfile: () => Promise<void>;
	refreshStatus: () => Promise<void>;
}

export const useKickAuth = (): UseKickAuthReturn => {
	const [profile, setProfile] = useState<ProfileModel | null>(null);
	const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
	const [tokensSaved, setTokensSaved] = useState(false);
	const [status, setStatus] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isBusy, setIsBusy] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(true);
	const { getToken, isLoaded, isSignedIn } = useAuth();

	const fetchProfile = useCallback(async () => {
		try {
			if (!isLoaded || !isSignedIn) {
				setProfile(null);
				setStatus(false);
				return;
			}

			const token = await getToken();
			if (!token) {
				throw new Error('No se pudo obtener el token de Clerk');
			}

			const profileInfo = await getKickProfileInfo({ token });
			setProfile(profileInfo);
			setStatus(true);
		} catch (error) {
			console.error('Error al obtener el perfil de Kick:', error);
			setProfile(null);
			setStatus(false);
		}
	}, [getToken, isLoaded, isSignedIn]);

	const refreshStatus = useCallback(async () => {
		try {
			setIsRefreshing(true);
			const [tokensSnapshot, profileSnapshot, serviceSnapshot] = await Promise.allSettled([
				getKickTokens(),
				getKickProfileInfo(),
				getKickServiceStatus(),
			]);

			if (tokensSnapshot.status === 'fulfilled') {
				setTokensSaved(Boolean(tokensSnapshot.value?.tokens?.token && tokensSnapshot.value?.tokens?.refresh_token));
			}

			if (profileSnapshot.status === 'fulfilled') {
				setProfile(profileSnapshot.value);
				setStatus(true);
			} else {
				setProfile(null);
				setStatus(false);
			}

			if (serviceSnapshot.status === 'fulfilled') {
				setServiceStatus(serviceSnapshot.value);
			}
		} catch (error) {
			console.error('Error al refrescar estado de Kick:', error);
		} finally {
			setIsRefreshing(false);
		}
	}, []);

	useEffect(() => {
		if (!isLoaded || !isSignedIn) {
			setProfile(null);
			setServiceStatus(null);
			setTokensSaved(false);
			setStatus(false);
			return;
		}

		void refreshStatus();
		const intervalId = window.setInterval(() => {
			void refreshStatus();
		}, 30_000);

		return () => window.clearInterval(intervalId);
	}, [isLoaded, isSignedIn, refreshStatus]);

	const handleConnect = useCallback(async () => {
		try {
			setIsLoading(true);
			const { authUrl, codeVerifier, state } = await getKickAuthUrl();
			window.localStorage.setItem(KICK_OAUTH_STATE_KEY, state);
			window.localStorage.setItem(KICK_CODE_VERIFIER_KEY, codeVerifier);

			const authWindow = window.open(authUrl, '_blank');
			if (!authWindow) {
				toast.error('No se pudo abrir la página de autenticación de Kick');
				setIsLoading(false);
				return;
			}

			const handleCallback = async (event: MessageEvent) => {
				if (event.origin !== window.location.origin) return;

				if (event.data.type === 'KICK_AUTH_CALLBACK') {
					try {
						const storedState = window.localStorage.getItem(KICK_OAUTH_STATE_KEY);
						const storedVerifier = window.localStorage.getItem(KICK_CODE_VERIFIER_KEY);

						if (!storedState || !storedVerifier || event.data.state !== storedState) {
							throw new Error('State inválido en el callback de Kick');
						}

						const tokenData = await getKickAccessToken(event.data.code, storedVerifier);
						await postKickAuth({
							token: tokenData.access_token,
							refresh_token: tokenData.refresh_token,
							bot: false,
						});
						await saveKickTokens({
							tokens: {
								token: tokenData.access_token,
								refresh_token: tokenData.refresh_token,
							},
						});

						setTokensSaved(true);
						await refreshStatus();
						posthog.capture('kick_account_connected');
						toast.success('Conectado a Kick');
					} catch (error) {
						console.error('Error en la autenticación de Kick:', error);
						toast.error('Error en la autenticación de Kick');
					} finally {
						setIsLoading(false);
						window.removeEventListener('message', handleCallback);
						window.localStorage.removeItem(KICK_OAUTH_STATE_KEY);
						window.localStorage.removeItem(KICK_CODE_VERIFIER_KEY);
					}
				} else if (event.data.type === 'KICK_AUTH_ERROR') {
					console.error('Error de autenticación Kick:', event.data.error);
					toast.error(`Error de autenticación de Kick: ${event.data.error}`);
					setIsLoading(false);
					window.removeEventListener('message', handleCallback);
					window.localStorage.removeItem(KICK_OAUTH_STATE_KEY);
					window.localStorage.removeItem(KICK_CODE_VERIFIER_KEY);
				}
			};

			window.addEventListener('message', handleCallback);
		} catch (error) {
			console.error('Error iniciando sesión de Kick:', error);
			toast.error('Error al conectar con Kick');
			setIsLoading(false);
		}
	}, [refreshStatus]);

	const handleDisconnect = useCallback(async () => {
		try {
			setIsBusy(true);
			await deleteKickAuth();
			posthog.capture('kick_account_disconnected');
			setProfile(null);
			setStatus(false);
			toast.info('Sesión Kick cerrada');
		} catch (error) {
			console.error('Error cerrando sesión de Kick:', error);
			toast.error('Error al cerrar sesión de Kick');
		} finally {
			setIsBusy(false);
		}
	}, []);

	const handleToggleService = useCallback(async () => {
		try {
			setIsBusy(true);
			const action = serviceStatus?.running ? 'paused' : 'started';
			if (serviceStatus?.running) {
				await stopKick();
				toast.success('Servicios de Kick pausados');
			} else {
				await startKick();
				toast.success('Servicios de Kick iniciados');
			}
			posthog.capture('kick_service_toggled', { action });
			await refreshStatus();
		} catch (error) {
			console.error('Error al cambiar estado de Kick:', error);
			toast.error('No se pudo cambiar el estado de Kick');
		} finally {
			setIsBusy(false);
		}
	}, [refreshStatus, serviceStatus?.running]);

	return {
		profile,
		status,
		tokensSaved,
		serviceStatus,
		isLoading,
		isBusy,
		isRefreshing,
		setIsLoading,
		handleConnect,
		handleDisconnect,
		handleToggleService,
		fetchProfile,
		refreshStatus,
	};
};

