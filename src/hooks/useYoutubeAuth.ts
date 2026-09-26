import { getBackendUrl } from '@/api/backendClient';
import {
	deleteYoutubeAuth,
	getYoutubeProfile,
	getYoutubeServiceStatus,
	getYoutubeTokens,
	postYoutubeChat,
	startYoutube,
	startYoutubeAuth,
	stopYoutube,
	updateYoutubeBroadcast,
} from '@/api/youtube';
import type {
	YoutubeBroadcastPayload,
	YoutubeProfile,
	YoutubeServiceStatus,
} from '@/interfaces/youtubeInterface';
import { useAuth } from '@clerk/nextjs';
import posthog from 'posthog-js';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface UseYoutubeAuthReturn {
	profile: YoutubeProfile | null;
	status: boolean;
	tokensAuthenticated: boolean;
	serviceStatus: YoutubeServiceStatus | null;
	isLoading: boolean;
	isBusy: boolean;
	isRefreshing: boolean;
	fetchProfile: () => Promise<void>;
	refreshStatus: (options?: { showSkeleton?: boolean }) => Promise<boolean>;
	handleConnect: () => Promise<void>;
	handleDisconnect: () => Promise<void>;
	handleToggleService: () => Promise<void>;
	handleSendTestMessage: (message: string) => Promise<void>;
	handleUpdateBroadcast: (payload: YoutubeBroadcastPayload) => Promise<void>;
}

type UseYoutubeAuthOptions = {
	disableInitialStatusLoad?: boolean;
};

export const useYoutubeAuth = (options: UseYoutubeAuthOptions = {}): UseYoutubeAuthReturn => {
	const { disableInitialStatusLoad = false } = options;
	const [profile, setProfile] = useState<YoutubeProfile | null>(null);
	const [serviceStatus, setServiceStatus] = useState<YoutubeServiceStatus | null>(null);
	const [tokensAuthenticated, setTokensAuthenticated] = useState(false);
	const [status, setStatus] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isBusy, setIsBusy] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(!disableInitialStatusLoad);
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

			const profileInfo = await getYoutubeProfile({ token });
			setProfile(profileInfo);
			setStatus(Boolean(profileInfo));
		} catch (error) {
			console.error('Error al obtener el perfil de YouTube:', error);
			setProfile(null);
			setStatus(false);
		}
	}, [getToken, isLoaded, isSignedIn]);

	const refreshStatus = useCallback(
		async (options: { showSkeleton?: boolean } = {}) => {
			const { showSkeleton = false } = options;
			try {
				if (showSkeleton) {
					setIsRefreshing(true);
				}
				const token = isSignedIn ? await getToken() : null;
				const [tokensSnapshot, profileSnapshot, serviceSnapshot] = await Promise.allSettled([
					getYoutubeTokens(),
					getYoutubeProfile({ token }),
					getYoutubeServiceStatus(),
				]);

				const tokensAuthenticatedResult =
					tokensSnapshot.status === 'fulfilled'
						? Boolean(tokensSnapshot.value?.tokens?.authenticated)
						: false;
				const profileAuthenticatedResult =
					profileSnapshot.status === 'fulfilled' ? Boolean(profileSnapshot.value) : false;

				if (tokensSnapshot.status === 'fulfilled') {
					setTokensAuthenticated(tokensAuthenticatedResult);
				} else {
					setTokensAuthenticated(false);
				}

				if (profileSnapshot.status === 'fulfilled') {
					setProfile(profileSnapshot.value);
					setStatus(Boolean(profileSnapshot.value));
				} else {
					setProfile(null);
					setStatus(false);
				}

				if (serviceSnapshot.status === 'fulfilled') {
					setServiceStatus(serviceSnapshot.value);
				} else {
					setServiceStatus(null);
				}

				return tokensAuthenticatedResult || profileAuthenticatedResult;
			} catch (error) {
				console.error('Error al refrescar estado de YouTube:', error);
				return false;
			} finally {
				if (showSkeleton) {
					setIsRefreshing(false);
				}
			}
		},
		[getToken, isSignedIn],
	);

	useEffect(() => {
		if (disableInitialStatusLoad) {
			setIsRefreshing(false);
			return;
		}
		if (!isLoaded || !isSignedIn) {
			setProfile(null);
			setServiceStatus(null);
			setTokensAuthenticated(false);
			setStatus(false);
			return;
		}

		void refreshStatus({ showSkeleton: true });
		const intervalId = window.setInterval(() => {
			void refreshStatus({ showSkeleton: false });
		}, 30_000);

		return () => window.clearInterval(intervalId);
	}, [disableInitialStatusLoad, isLoaded, isSignedIn, refreshStatus]);

	const handleConnect = useCallback(async () => {
		try {
			setIsLoading(true);
			const { authorization_url } = await startYoutubeAuth();

			const authWindow = window.open(authorization_url, '_blank', 'popup,width=520,height=680');
			if (!authWindow) {
				toast.error('No se pudo abrir la ventana de autenticación de YouTube');
				setIsLoading(false);
				return;
			}

			let settled = false;
			let pollId: number | null = null;
			let pollInFlight = false;
			const startedAt = Date.now();
			const maxWaitMs = 180_000;

			const cleanup = () => {
				settled = true;
				if (pollId) {
					window.clearInterval(pollId);
					pollId = null;
				}
				window.removeEventListener('message', handleCallback);
			};

			const finishSuccess = async (method: 'callback' | 'status_poll' | 'window_closed') => {
				cleanup();
				try {
					const token = await getToken();
					const profileInfo = await getYoutubeProfile({ token });
					if (profileInfo) {
						setProfile(profileInfo);
						setStatus(true);
						setTokensAuthenticated(true);
					}
					await refreshStatus({ showSkeleton: false });
				} catch (err) {
					console.error('Error cargando perfil de YouTube tras conectar:', err);
					await refreshStatus({ showSkeleton: false });
				} finally {
					setIsLoading(false);
				}
				posthog.capture('youtube_account_connected', { completion_method: method });
				toast.success('Conectado a YouTube');
			};

			const handleCallback = (event: MessageEvent) => {
				const backendOrigin = getBackendUrl();
				if (event.origin !== backendOrigin && event.origin !== window.location.origin) return;
				if (event.data?.type !== 'youtube-auth-complete') return;

				if (settled) return;

				if (event.data?.ok) {
					void finishSuccess('callback');
				} else {
					cleanup();
					setIsLoading(false);
					toast.error('La autenticación de YouTube falló');
				}
			};

			pollId = window.setInterval(() => {
				if (settled) return;

				if (authWindow.closed) {
					cleanup();
					void (async () => {
						try {
							const token = await getToken();
							const profileInfo = await getYoutubeProfile({ token });
							if (profileInfo) {
								setProfile(profileInfo);
								setStatus(true);
								setTokensAuthenticated(true);
								await refreshStatus({ showSkeleton: false });
								setIsLoading(false);
								posthog.capture('youtube_account_connected', {
									completion_method: 'window_closed',
								});
								toast.success('Conectado a YouTube');
								return;
							}
						} catch {
							// Ignorado si el usuario canceló
						}
						setIsLoading(false);
					})();
					return;
				}

				if (Date.now() - startedAt > maxWaitMs) {
					cleanup();
					setIsLoading(false);
					toast.error('La autenticación de YouTube tardó demasiado');
					return;
				}

				if (pollInFlight) return;
				pollInFlight = true;

				void (async () => {
					try {
						const tokensRes = await getYoutubeTokens();
						const isAuthed = Boolean(tokensRes?.tokens?.authenticated);
						if (!settled && isAuthed) {
							await finishSuccess('status_poll');
						}
					} catch {
						// Ignorado durante el sondeo
					} finally {
						pollInFlight = false;
					}
				})();
			}, 500);

			window.addEventListener('message', handleCallback);
		} catch (error) {
			console.error('Error iniciando sesión de YouTube:', error);
			toast.error('Error al conectar con YouTube');
			setIsLoading(false);
		}
	}, [getToken, refreshStatus]);

	const handleDisconnect = useCallback(async () => {
		try {
			setIsBusy(true);
			await deleteYoutubeAuth();
			posthog.capture('youtube_account_disconnected');
			setProfile(null);
			setStatus(false);
			setTokensAuthenticated(false);
			setServiceStatus(null);
			toast.info('Sesión de YouTube cerrada');
		} catch (error) {
			console.error('Error cerrando sesión de YouTube:', error);
			toast.error('Error al cerrar sesión de YouTube');
		} finally {
			setIsBusy(false);
		}
	}, []);

	const handleToggleService = useCallback(async () => {
		try {
			setIsBusy(true);
			const action = serviceStatus?.running ? 'paused' : 'started';
			if (serviceStatus?.running) {
				await stopYoutube();
				toast.success('Servicios de YouTube pausados');
			} else {
				await startYoutube();
				toast.success('Servicios de YouTube iniciados');
			}
			posthog.capture('youtube_service_toggled', { action });
			await refreshStatus();
		} catch (error) {
			console.error('Error al cambiar estado de YouTube:', error);
			toast.error('No se pudo cambiar el estado de YouTube');
		} finally {
			setIsBusy(false);
		}
	}, [refreshStatus, serviceStatus?.running]);

	const handleSendTestMessage = useCallback(
		async (message: string) => {
			try {
				await postYoutubeChat({ message, live_chat_id: profile?.live_chat_id });
				toast.success('Mensaje enviado al live chat');
			} catch (error) {
				console.error('Error enviando mensaje a YouTube:', error);
				toast.error('No se pudo enviar el mensaje a YouTube');
			}
		},
		[profile?.live_chat_id],
	);

	const handleUpdateBroadcast = useCallback(async (payload: YoutubeBroadcastPayload) => {
		try {
			await updateYoutubeBroadcast(payload);
			posthog.capture('youtube_broadcast_updated');
			toast.success('Transmisión actualizada');
		} catch (error) {
			console.error('Error actualizando la transmisión de YouTube:', error);
			toast.error('No se pudo actualizar la transmisión de YouTube');
		}
	}, []);

	return {
		profile,
		status,
		tokensAuthenticated,
		serviceStatus,
		isLoading,
		isBusy,
		isRefreshing,
		fetchProfile,
		refreshStatus,
		handleConnect,
		handleDisconnect,
		handleToggleService,
		handleSendTestMessage,
		handleUpdateBroadcast,
	};
};
