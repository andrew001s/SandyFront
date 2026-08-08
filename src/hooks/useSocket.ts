// src/hooks/useSocket.ts
import {
	defaultStreamTokenProvider,
	getDefaultWebSocketUrl,
	getWebSocketService,
	type StreamTokenProvider,
} from '@/services/socket';
import { useEffect, useRef } from 'react';

interface UseWebSocketOptions {
	/** Por defecto `${NEXT_PUBLIC_API_URL}/ws` con el esquema cambiado a ws/wss. */
	url?: string;
	/** Devuelve un token efímero fresco. Se invoca en cada intento de conexión. */
	getStreamToken?: StreamTokenProvider;
	onMessage?: (data: string) => void;
	onConnect?: () => void;
	onDisconnect?: (event: CloseEvent) => void;
	onReconnectAttempt?: (attempt: number, maxAttempts: number) => void;
	onMaxRetriesExceeded?: () => void;
	/** El servidor cerró con 1008: el token faltaba, era inválido o ya había vencido. */
	onAuthError?: () => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
	const url = options.url ?? getDefaultWebSocketUrl();

	// Los callbacks suelen ser inline: guardarlos en una ref evita reconectar en cada render.
	const optionsRef = useRef(options);
	optionsRef.current = options;

	useEffect(() => {
		const wsService = getWebSocketService(url);

		wsService.connect(
			{
				onMessage: (data) => optionsRef.current.onMessage?.(data),
				onConnect: () => optionsRef.current.onConnect?.(),
				onDisconnect: (event) => optionsRef.current.onDisconnect?.(event),
				onReconnectAttempt: (attempt, maxAttempts) =>
					optionsRef.current.onReconnectAttempt?.(attempt, maxAttempts),
				onMaxRetriesExceeded: () => optionsRef.current.onMaxRetriesExceeded?.(),
				onAuthError: () => optionsRef.current.onAuthError?.(),
			},
			() => (optionsRef.current.getStreamToken ?? defaultStreamTokenProvider)(),
		);

		return () => {
			// Keep the connection alive across route changes.
		};
	}, [url]);

	return {
		send: (message: string) => {
			getWebSocketService(url).send(message);
		},
	};
};
