'use client';
import { getVoiceSandy } from '@/api/fetchFishAudio';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useMessages } from '@/context/MessagesContext';
import { useAudioQueue } from '@/hooks/useAudioQueue';
import { useVTubeStudio } from '@/hooks/useVTubeStudio';
import { useWebSocket } from '@/hooks/useSocket';
import type { AvatarBackendPayload } from '@/lib/vtsAvatarPayload';
import { useCallback, useEffect, useRef } from 'react';

type WebSocketChatProps = AvatarBackendPayload & {
	client_id?: number;
};

const websocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:8000/ws';

const WebSocketChat = () => {
	const processedMessages = useRef<Set<string>>(new Set());
	const { addToQueue } = useAudioQueue();
	const { addMessage } = useMessages();
	const { settings } = useAppSettings();
	const { sendAvatarPayload, connect, connected, connecting } = useVTubeStudio();
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

			const speechText = parsedData.text ?? parsedData.response;
			const responseKey = parsedData.id ?? speechText ?? parsedData.message ?? data;

			const forwardToAvatar = async (payload: AvatarBackendPayload) => {
				if (!connected && !connecting) {
					try {
						await connect(8001);
					} catch (error) {
						console.error('No se pudo conectar VTube Studio automáticamente:', error);
					}
				}

				await sendAvatarPayload(payload);
			};

			if (parsedData.type === 'speech' && speechText && !processedMessages.current.has(responseKey)) {
				processedMessages.current.add(responseKey);
				addMessageRef.current({
					type: 'chat',
					content: speechText,
					timestamp: parsedData.timestamp || new Date().toISOString(),
				});
				void forwardToAvatar(parsedData);
				getVoiceSandy(speechText, {
					apiKey: settings?.fish_audio_key ?? '',
					voiceId: settings?.voice_id ?? '',
				})
					.then((audioBlob) => {
						addToQueue(audioBlob);
					})
					.catch((error) => {
						processedMessages.current.delete(responseKey);
						console.error('Error al procesar el audio:', error);
					});
			}

			if (
				parsedData.type === 'twitch_response' &&
				parsedData.response &&
				!processedMessages.current.has(parsedData.response)
			) {
				processedMessages.current.add(parsedData.response);
				void forwardToAvatar({
					...parsedData,
					type: 'speech',
					text: parsedData.response,
					emotion: parsedData.emotion ?? 'neutral',
				});
				getVoiceSandy(parsedData.response, {
					apiKey: settings?.fish_audio_key ?? '',
					voiceId: settings?.voice_id ?? '',
				})
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
		[addToQueue, connect, connected, connecting, sendAvatarPayload, settings],
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
			content:
				'❌ No se pudo establecer la conexión después de varios intentos. Por favor, verifica tu conexión a internet.',
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
		handleMaxRetriesExceeded,
	);

	return <div className='mx-auto space-y-4 p-4' />;
};

export default WebSocketChat;
