'use client';

import { type ServiceStatus, getServiceStatus } from '@/api/sandycore';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';

const DEFAULT_POLL_MS = 30_000;

/**
 * Estado real del servicio, consultado al backend.
 *
 * No confundir con `useStatus()` (StatusContext): ese es un booleano en
 * localStorage que escriben tres sitios distintos con significados distintos
 * —arrancar el servicio, conectar Twitch, reconectar el perfil— así que no sirve
 * para saber si la VTuber está en marcha.
 */
export function useServiceStatus(pollMs: number = DEFAULT_POLL_MS) {
	const { isLoaded, isSignedIn } = useAuth();
	const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
	const [hasLoaded, setHasLoaded] = useState(false);
	const [hasError, setHasError] = useState(false);

	const refresh = useCallback(async () => {
		try {
			setServiceStatus(await getServiceStatus());
			setHasError(false);
		} catch (error) {
			console.error('Error al obtener el estado del servicio:', error);
			setHasError(true);
		} finally {
			setHasLoaded(true);
		}
	}, []);

	// Las peticiones llevan el token de Clerk que inyecta backendClient leyendo
	// window.Clerk, que al montar puede no estar hidratado todavía.
	useEffect(() => {
		if (!isLoaded || !isSignedIn) {
			return;
		}

		void refresh();
		const intervalId = window.setInterval(() => {
			void refresh();
		}, pollMs);

		return () => window.clearInterval(intervalId);
	}, [isLoaded, isSignedIn, pollMs, refresh]);

	return {
		serviceStatus,
		/** Solo true cuando el backend lo confirma; un fallo no cuenta como "en marcha". */
		isRunning: serviceStatus?.running === true,
		hasLoaded,
		hasError,
		refresh,
	};
}
