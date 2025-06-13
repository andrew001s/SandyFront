"use client";
import { getVoiceSandy } from '@/api/fetchFishAudio';
import { useAudioQueue } from '@/hooks/useAudioQueue';
import { useWebSocket } from '@/hooks/useSocket';
import { useCallback, useEffect, useRef, useState } from 'react';

interface WebSocketChatProps {
	type: string;
	client_id?: number;
	timestamp?: string;
	message?: string;
	response?: string;
}

const websocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:8000/ws';
const WebSocketChat = () => {
	const [currentMessage, setCurrentMessage] = useState<WebSocketChatProps | null>(null);
	const messagesHistoryRef = useRef<WebSocketChatProps[]>([]);
	const processedMessages = useRef<Set<string>>(new Set());
	const { audioRef, addToQueue } = useAudioQueue();

	const handleMessage = useCallback((data: string) => {
		const parsedData = JSON.parse(data) as WebSocketChatProps;
		setCurrentMessage(parsedData);
		messagesHistoryRef.current = [...messagesHistoryRef.current, parsedData];
	}, []);

	useWebSocket(websocketUrl, handleMessage);

	useEffect(() => {
		const processAudio = async () => {
			if (
				currentMessage?.type === 'twitch_response' &&
				currentMessage.response &&
				!processedMessages.current.has(currentMessage.response)
			) {
				try {
					processedMessages.current.add(currentMessage.response);

					const audioBlob = await getVoiceSandy(currentMessage.response);
					addToQueue(audioBlob);
				} catch (error) {
					processedMessages.current.delete(currentMessage.response);
					console.error('Error al procesar el audio:', error);
				}
			}
		};

		void processAudio();
	}, [currentMessage, addToQueue]);

	return (
		<div className='mx-auto max-w-md space-y-4 p-4'>
			<div className='h-64 overflow-y-auto rounded border p-3 shadow'>
				<ul>
					{messagesHistoryRef.current.map((msg, index) => (
						<li
							key={`msg-${index}-${msg.timestamp || Date.now()}`}
							className='mb-2 text-sm text-white'
						>
							{msg.message}
						</li>
					))}
				</ul>
			</div>
			<audio ref={audioRef} preload='auto' className='hidden'>
				<track kind='captions' />
			</audio>
		</div>
	);
};

export default WebSocketChat;
