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
	refreshStatus: () => Promise<void>;
	handleConnect: () => Promise<void>;
	handleDisconnect: () => Promise<void>;
	handleToggleService: () => Promise<void>;
	handleSendTestMessage: (message: string) => Promise<void>;
	handleUpdateBroadcast: (payload: YoutubeBroadcastPayload) => Promise<void>;
}

export const useYoutubeAuth = (): UseYoutubeAuthReturn => {
	const [profile, setProfile] = useState<YoutubeProfile | null>(null);
	const [serviceStatus, setServiceStatus] = useState<YoutubeServiceStatus | null>(null);
	const [tokensAuthenticated, setTokensAuthenticated] = useState(false);
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

			const profileInfo = await getYoutubeProfile({ token });
			setProfile(profileInfo);
			setStatus(Boolean(profileInfo));
		} catch (error) {
			console.error('Error al obtener el perfil de YouTube:', error);
			setProfile(null);
			setStatus(false);
		}
	}, [getToken, isLoaded, isSignedIn]);

	const refreshStatus = useCallback(async () => {
		try {
			setIsRefreshing(true);
			const [tokensSnapshot, profileSnapshot, serviceSnapshot] = await Promise.allSettled([
				getYoutubeTokens(),
				getYoutubeProfile(),
				getYoutubeServiceStatus(),
			]);

			if (tokensSnapshot.status === 'fulfilled') {
				setTokensAuthenticated(Boolean(tokensSnapshot.value?.tokens?.authenticated));
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
		} catch (error) {
			console.error('Error al refrescar estado de YouTube:', error);
		} finally {
			setIsRefreshing(false);
		}
	}, []);

	useEffect(() => {
		if (!isLoaded || !isSignedIn) {
			setProfile(null);
			setServiceStatus(null);
			setTokensAuthenticated(false);
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
			const { authorization_url } = await startYoutubeAuth();

			const authWindow = window.open(authorization_url, '_blank', 'popup,width=520,height=680');
			if (!authWindow) {
				toast.error('No se pudo abrir la ventana de autenticación de YouTube');
				setIsLoading(false);
				return;
			}

			let settled = false;
			let pollId: number | null = null;

			const handleCallback = (event: MessageEvent) => {
				if (event.origin !== getBackendUrl()) return;
				if (event.data?.type !== 'youtube-auth-complete') return;

				settled = true;
				if (pollId) window.clearInterval(pollId);
				window.removeEventListener('message', handleCallback);
				setIsLoading(false);

				if (event.data?.ok) {
					void refreshStatus();
					toast.success('Conectado a YouTube');
				} else {
					toast.error('La autenticación de YouTube falló');
				}
			};

			pollId = window.setInterval(() => {
				if (authWindow.closed && !settled) {
					settled = true;
					if (pollId) window.clearInterval(pollId);
					window.removeEventListener('message', handleCallback);
					setIsLoading(false);
				}
			}, 500);

			window.addEventListener('message', handleCallback);
		} catch (error) {
			console.error('Error iniciando sesión de YouTube:', error);
			toast.error('Error al conectar con YouTube');
			setIsLoading(false);
		}
	}, [refreshStatus]);

	const handleDisconnect = useCallback(async () => {
		try {
			setIsBusy(true);
			await deleteYoutubeAuth();
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
			if (serviceStatus?.running) {
				await stopYoutube();
				toast.success('Servicios de YouTube pausados');
			} else {
				await startYoutube();
				toast.success('Servicios de YouTube iniciados');
			}
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
