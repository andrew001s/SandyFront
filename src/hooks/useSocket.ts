// src/hooks/useWebSocket.ts
import { getWebSocketService } from '@/services/socket';
import { useEffect } from 'react';

export const useWebSocket = (
	url: string,
	onMessage?: (data: string) => void,
	onDisconnect?: () => void,
	onReconnectAttempt?: (attempt: number, maxAttempts: number) => void,
	onMaxRetriesExceeded?: () => void,
) => {
	useEffect(() => {
		const wsService = getWebSocketService(url);

		wsService.connect({
			onMessage,
			onDisconnect,
			onReconnectAttempt,
			onMaxRetriesExceeded,
		});

		return () => {
			wsService.disconnect();
		};
	}, [url, onMessage, onDisconnect, onReconnectAttempt, onMaxRetriesExceeded]);

	return {
		send: (message: string) => {
			const wsService = getWebSocketService(url);
			wsService.send(message);
		},
	};
};
