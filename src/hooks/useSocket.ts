// src/hooks/useWebSocket.ts
import { createWebSocket } from '@/services/socket';
import { useCallback, useEffect, useRef } from 'react';

export const useWebSocket = (url: string, onMessage: (data: string) => void) => {
	const socketRef = useRef<WebSocket | null>(null);

	useEffect(() => {
		const socket = createWebSocket(url);
		socketRef.current = socket;

		socket.onmessage = (event) => {
			onMessage(event.data);
		};

		return () => {
			socket.close();
		};
	}, [url, onMessage]);

	const sendMessage = useCallback((message: string) => {
		if (socketRef.current?.readyState === WebSocket.OPEN) {
			socketRef.current.send(message);
		} else {
			throw new Error('WebSocket connection is not open');
		}
	}, []);

	return { sendMessage };
};
