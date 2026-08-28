'use client';

import { getBackendUrl } from '@/api/backendClient';
import { fetchStreamToken } from '@/api/streamToken';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useRef } from 'react';

// El token de stream dura ~300s; se renueva antes para que siempre haya uno
// válido en el momento del cierre, cuando ya no da tiempo a pedir otro.
const REFRESH_MS = 4 * 60 * 1000;

/**
 * Apaga los servicios del usuario cuando cierra o recarga la página.
 *
 * Sin nadie delante no tiene sentido dejar el bot respondiendo y gastando
 * tokens. Se usa `sendBeacon` porque es el único envío que el navegador
 * garantiza durante la descarga; como no admite cabeceras, la autenticación
 * viaja en el token firmado de `/stream/token`.
 *
 * No se dispara al moverse por la aplicación, ni al minimizar, ni al cambiar de
 * pestaña: `pagehide` solo salta cuando el documento se descarga, y además se
 * descartan las descargas que van a la caché del navegador (`persisted`), donde
 * el usuario puede volver con el botón Atrás.
 */
export function useShutdownOnExit(): void {
	const { getToken, isLoaded, isSignedIn } = useAuth();
	const streamTokenRef = useRef<string | null>(null);

	useEffect(() => {
		if (!isLoaded || !isSignedIn) {
			return;
		}

		let cancelled = false;

		const refresh = async () => {
			try {
				const clerkToken = await getToken();
				if (!clerkToken || cancelled) return;
				const { token } = await fetchStreamToken({ token: clerkToken });
				if (!cancelled) streamTokenRef.current = token;
			} catch (error) {
				console.error('No se pudo renovar el token de apagado:', error);
			}
		};

		void refresh();
		const timer = setInterval(() => void refresh(), REFRESH_MS);

		const handleExit = (event: PageTransitionEvent) => {
			// `persisted` en true significa que la página va a la caché del
			// navegador y puede volver con el botón Atrás: el usuario sigue
			// moviéndose, no se ha ido. Solo se apaga en una descarga real,
			// que es lo que ocurre al cerrar o recargar.
			if (event.persisted) return;

			const token = streamTokenRef.current;
			if (!token || typeof navigator.sendBeacon !== 'function') return;
			navigator.sendBeacon(
				`${getBackendUrl()}/services/shutdown?token=${encodeURIComponent(token)}`,
			);
		};

		window.addEventListener('pagehide', handleExit);

		return () => {
			cancelled = true;
			clearInterval(timer);
			window.removeEventListener('pagehide', handleExit);
		};
	}, [getToken, isLoaded, isSignedIn]);
}
