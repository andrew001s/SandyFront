'use client';

import { fetchStreamToken } from '@/api/streamToken';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useMessages } from '@/context/MessagesContext';
import { useVTubeStudio } from '@/hooks/useVTubeStudio';
import { useVoiceErrorReporter } from '@/hooks/useVoiceErrorReporter';
import { singleChunkStream, speakTextStream } from '@/lib/speechPipeline';
import type { AvatarBackendPayload } from '@/lib/vtsAvatarPayload';
import { useAuth } from '@clerk/nextjs';
import { type MutableRefObject, useCallback, useEffect, useRef } from 'react';

type StreamEventPayload = AvatarBackendPayload & {
	client_id?: number;
};

type StreamEventName = 'speech' | 'reaction' | 'system';

const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
const RECONNECT_BASE_DELAY_MS = 1500;
const RECONNECT_MAX_DELAY_MS = 15000;
const MAX_PROCESSED_MESSAGES = 500;

function trimProcessedMessages(ref: MutableRefObject<Set<string>>) {
	while (ref.current.size > MAX_PROCESSED_MESSAGES) {
		const oldest = ref.current.values().next().value as string | undefined;
		if (!oldest) {
			break;
		}
		ref.current.delete(oldest);
	}
}

const StreamChat = () => {
	const processedMessages = useRef<Set<string>>(new Set());
	const streamRef = useRef<EventSource | null>(null);
	const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const reconnectAttemptRef = useRef(0);
	const isMountedRef = useRef(false);
	const { addMessage } = useMessages();
	const addMessageRef = useRef(addMessage);
	const { settings } = useAppSettings();
	const { getToken, isLoaded, isSignedIn } = useAuth();
	const { sendAvatarPayload, connect, connected, connecting } = useVTubeStudio();

	useEffect(() => {
		addMessageRef.current = addMessage;
	}, [addMessage]);

	const pushSystemMessage = useCallback((content: string) => {
		addMessageRef.current({
			type: 'system',
			content,
			timestamp: new Date().toISOString(),
		});
	}, []);

	const forwardToAvatar = useCallback(
		async (payload: AvatarBackendPayload) => {
			if (!connected && !connecting) {
				try {
					await connect(8001);
				} catch (error) {
					console.error('No se pudo conectar VTube Studio automáticamente:', error);
				}
			}

			await sendAvatarPayload(payload);
		},
		[connect, connected, connecting, sendAvatarPayload],
	);

	const { report: reportVoiceError, reset: resetVoiceErrors } = useVoiceErrorReporter();

	const queueVoice = useCallback(
		async (text: string) => {
			if (settings?.feature_flags?.voice_replies === false) {
				return;
			}
			resetVoiceErrors();
			// El backend manda la respuesta ya completa, pero trocearla en frases
			// permite empezar a sonar tras sintetizar la primera en vez de esperar
			// al audio de todo el texto.
			await speakTextStream(singleChunkStream(text), {
				fish: {
					apiKey: settings?.fish_audio_key ?? '',
					voiceId: settings?.voice_id ?? '',
				},
				onSegmentError: reportVoiceError,
			});
		},
		[
			settings?.feature_flags?.voice_replies,
			settings?.fish_audio_key,
			settings?.voice_id,
			reportVoiceError,
			resetVoiceErrors,
		],
	);

	// El stream SSE no se puede reabrir cada vez que cambia un callback: mientras
	// se cierra y se pide un token nuevo, los mensajes que empuje el backend se
	// pierden (SSE no reenvía lo perdido). `connected`/`connecting` de VTube Studio
	// cambian varias veces al cargar la página, así que estos dos viajan por ref y
	// el efecto solo depende de la sesión de Clerk.
	const forwardToAvatarRef = useRef(forwardToAvatar);
	const queueVoiceRef = useRef(queueVoice);

	useEffect(() => {
		forwardToAvatarRef.current = forwardToAvatar;
		queueVoiceRef.current = queueVoice;
	}, [forwardToAvatar, queueVoice]);

	useEffect(() => {
		isMountedRef.current = true;

		const clearReconnectTimer = () => {
			if (reconnectTimerRef.current) {
				clearTimeout(reconnectTimerRef.current);
				reconnectTimerRef.current = null;
			}
		};

		const closeStream = () => {
			clearReconnectTimer();
			streamRef.current?.close();
			streamRef.current = null;
		};

		const scheduleReconnect = (reason: string) => {
			if (!isMountedRef.current || reconnectTimerRef.current) {
				return;
			}

			reconnectAttemptRef.current += 1;
			const attempt = reconnectAttemptRef.current;
			const delay = Math.min(
				RECONNECT_MAX_DELAY_MS,
				RECONNECT_BASE_DELAY_MS * 2 ** Math.min(attempt - 1, 4),
			);

			pushSystemMessage(
				`⚠️ Stream caído (${reason}). Reintentando en ${Math.round(delay / 1000)}s...`,
			);

			reconnectTimerRef.current = setTimeout(() => {
				reconnectTimerRef.current = null;
				void openStream();
			}, delay);
		};

		const handleStreamPayload = async (eventName: StreamEventName, rawData: string) => {
			try {
				const parsedData = JSON.parse(rawData) as StreamEventPayload;
				const normalizedType = String(parsedData.type ?? eventName).toLowerCase();
				const speechText = parsedData.text ?? parsedData.response ?? parsedData.message ?? '';
				const reactionText =
					parsedData.text ??
					parsedData.message ??
					parsedData.response ??
					parsedData.expression ??
					parsedData.emotion ??
					'';
				const messageKey =
					parsedData.id ?? parsedData.metadata?.messageId ?? speechText ?? reactionText ?? rawData;

				if (processedMessages.current.has(messageKey)) {
					return;
				}

				if (normalizedType === 'speech') {
					if (!speechText) {
						return;
					}

					processedMessages.current.add(messageKey);
					trimProcessedMessages(processedMessages);
					addMessageRef.current({
						type: 'chat',
						content: speechText,
						timestamp: parsedData.timestamp || new Date().toISOString(),
					});

					void forwardToAvatarRef.current({
						...parsedData,
						type: 'speech',
						text: speechText,
					});

					queueVoiceRef.current(speechText).catch((error) => {
						processedMessages.current.delete(messageKey);
						console.error('Error al procesar el audio:', error);
					});
					return;
				}

				if (normalizedType === 'reaction') {
					processedMessages.current.add(messageKey);
					trimProcessedMessages(processedMessages);
					addMessageRef.current({
						type: 'reaction',
						content: reactionText || 'Reacción recibida',
						timestamp: parsedData.timestamp || new Date().toISOString(),
					});

					void forwardToAvatarRef.current({
						...parsedData,
						type: 'reaction',
						text: reactionText || parsedData.text,
					});
					return;
				}

				if (normalizedType === 'system') {
					processedMessages.current.add(messageKey);
					trimProcessedMessages(processedMessages);
					addMessageRef.current({
						type: 'system',
						content: reactionText || 'Evento del sistema recibido',
						timestamp: parsedData.timestamp || new Date().toISOString(),
					});
				}
			} catch (error) {
				console.error(`No se pudo procesar el evento ${eventName}:`, error);
			}
		};

		const attachStreamListeners = (eventSource: EventSource) => {
			const listeners: Array<{
				event: StreamEventName;
				handler: (event: MessageEvent<string>) => void;
			}> = [
				{
					event: 'speech',
					handler: (event) => {
						void handleStreamPayload('speech', event.data);
					},
				},
				{
					event: 'reaction',
					handler: (event) => {
						void handleStreamPayload('reaction', event.data);
					},
				},
				{
					event: 'system',
					handler: (event) => {
						void handleStreamPayload('system', event.data);
					},
				},
			];

			for (const { event, handler } of listeners) {
				eventSource.addEventListener(event, handler);
			}

			eventSource.onopen = () => {
				reconnectAttemptRef.current = 0;
				pushSystemMessage('🟢 Conectado al stream SSE');
			};

			eventSource.onerror = () => {
				if (streamRef.current !== eventSource) {
					return;
				}

				eventSource.close();
				streamRef.current = null;
				scheduleReconnect('error');
			};
		};

		const openStream = async () => {
			if (!isLoaded || !isSignedIn) {
				pushSystemMessage('Esperando sesión de Clerk para abrir el stream...');
				return;
			}

			try {
				closeStream();

				const clerkToken = await getToken();
				if (!clerkToken) {
					throw new Error('No se pudo obtener el token de Clerk');
				}

				// Token fresco en cada intento: el backend solo lo valida al abrir la conexión.
				const { token } = await fetchStreamToken({ token: clerkToken });

				const eventSource = new EventSource(
					`${backendUrl}/stream?token=${encodeURIComponent(token)}`,
				);

				streamRef.current = eventSource;
				attachStreamListeners(eventSource);
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Error desconocido';
				pushSystemMessage(`No se pudo abrir el stream: ${message}`);
				scheduleReconnect('fetch');
			}
		};

		void openStream();

		return () => {
			isMountedRef.current = false;
			if (reconnectTimerRef.current) {
				clearTimeout(reconnectTimerRef.current);
				reconnectTimerRef.current = null;
			}
			streamRef.current?.close();
			streamRef.current = null;
		};
	}, [getToken, isLoaded, isSignedIn, pushSystemMessage]);

	return <div className='mx-auto space-y-4 p-4' />;
};

export default StreamChat;
