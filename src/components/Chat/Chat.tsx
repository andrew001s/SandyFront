'use client';
import { getVoiceSandy } from '@/api/fetchFishAudio';
import { useMessages } from '@/context/MessagesContext';
import { useAudioQueue } from '@/hooks/useAudioQueue';
import { useWebSocket } from '@/hooks/useSocket';
import { useCallback, useEffect, useRef } from 'react';

interface WebSocketChatProps {
	type: string;
	client_id?: number;
	timestamp?: string;
	message?: string;
	response?: string;
}

const websocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:8000/ws';

const WebSocketChat = () => {
	const processedMessages = useRef<Set<string>>(new Set());
	const { audioRef, addToQueue } = useAudioQueue();
	const { addMessage } = useMessages();
	const addMessageRef = useRef(addMessage);

	useEffect(() => {
		addMessageRef.current = addMessage;
	}, [addMessage]);

	const handleMessage = useCallback(
		(data: string) => {
			const parsedData = JSON.parse(data) as WebSocketChatProps;
			if (parsedData.message) {
				addMessageRef.current({
					type: 'chat',
					content: parsedData.message,
					timestamp: parsedData.timestamp || new Date().toISOString(),
				});
			}

			if (
				parsedData.type === 'twitch_response' &&
				parsedData.response &&
				!processedMessages.current.has(parsedData.response)
			) {
				processedMessages.current.add(parsedData.response);
				getVoiceSandy(parsedData.response)
					.then((audioBlob) => {
						addToQueue(audioBlob);
					})
					.catch((error) => {
						if (parsedData.response) {
							processedMessages.current.delete(parsedData.response);
						}
						console.error('Error al procesar el audio:', error);
					});
			}
		},
		[addToQueue]
	);


	const handleReconnectAttempt = useCallback((attempt: number, maxAttempts: number) => {
		addMessageRef.current({
			type: 'system',
			content: `🔴 Intento de reconexión ${attempt} de ${maxAttempts}...`,
			timestamp: new Date().toISOString(),
		});
	}, []);

	const handleMaxRetriesExceeded = useCallback(() => {
		addMessageRef.current({
			type: 'system',
			content: '❌ No se pudo establecer la conexión después de varios intentos. Por favor, verifica tu conexión a internet.',
			timestamp: new Date().toISOString(),
		});
	}, []);

	const handleDisconnect = useCallback(() => {
		addMessageRef.current({
			type: 'system',
			content: '⚠️ Se ha perdido la conexión con el servidor. Intentando reconectar...',
			timestamp: new Date().toISOString(),
		});
	}, []);

	useWebSocket(
		websocketUrl,
		handleMessage,
		handleDisconnect,
		handleReconnectAttempt,
		handleMaxRetriesExceeded
	);

	return (
		<div className='mx-auto space-y-4 p-4'>
			<audio ref={audioRef} preload='auto' className='hidden'>
				<track kind='captions' />
			</audio>
		</div>
	);
};

export default WebSocketChat;
