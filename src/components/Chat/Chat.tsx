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

	// Actualizar la referencia cuando cambie addMessage
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
		[addToQueue],
	); // Solo depende de addToQueue

	useWebSocket(websocketUrl, handleMessage);

	return (
		<div className='mx-auto space-y-4 p-4'>
			<audio ref={audioRef} preload='auto' className='hidden'>
				<track kind='captions' />
			</audio>
		</div>
	);
};

export default WebSocketChat;
