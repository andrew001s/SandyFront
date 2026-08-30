'use client';

import {
	parseAiTask,
	parseRelayRequest,
	sendRelayError,
	sendRelayResult,
	sendTaskResult,
} from '@/api/aiRelay';
import { getBackendUrl } from '@/api/backendClient';
import { streamLocalCompletion } from '@/api/localAi';
import { fetchStreamToken } from '@/api/streamToken';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useMessages } from '@/context/MessagesContext';
import { useVoiceErrorReporter } from '@/hooks/useVoiceErrorReporter';
import { getAiErrorCode, getAiErrorMessage } from '@/lib/ai-errors';
import { getStoredAiProvider } from '@/lib/ai-provider';
import { resolveLocalAiSettings } from '@/lib/local-ai-config';
import { speakTextStream } from '@/lib/speechPipeline';
import { useAuth } from '@clerk/nextjs';
import posthog from 'posthog-js';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

// Corte para enviar un trozo: fin de frase. Un POST por token serían cientos de
// peticiones por respuesta y saldría más lento que acumularlo todo.
const SENTENCE_BOUNDARY = /[.!?…]+["')\]]*\s/;
const MAX_CHUNK_CHARS = 160;
// Tope para un veredicto de moderación: es un sí/no, no una respuesta hablada.
const MAX_VERDICT_CHARS = 400;

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;

/**
 * Atiende las peticiones de inferencia que el backend publica por SSE.
 *
 * Cubre lo que arranca en el backend y el navegador no origina: mensajes del
 * chat de Twitch, Kick y YouTube, la evaluación de mensajes sospechosos, los
 * eventos y las recompensas. El backend compone el prompt —persona, reglas e
 * historial— y aquí solo se ejecuta el modelo local.
 *
 * El dictáfono NO pasa por aquí: llama directo a su modelo para conservar el
 * streaming nativo.
 *
 * Con Gemini u OpenRouter el backend resuelve por su cuenta y nunca publica
 * nada, así que el hook queda inactivo.
 */
export function useLocalAiRelay(): void {
	const { getToken, isLoaded, isSignedIn } = useAuth();
	const { settings } = useAppSettings();
	const { addMessage } = useMessages();
	const { report: reportVoiceError, reset: resetVoiceErrors } = useVoiceErrorReporter();
	const sourceRef = useRef<EventSource | null>(null);
	const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const attemptRef = useRef(0);
	const configRef = useRef({ baseUrl: '', model: '' });
	const settingsRef = useRef(settings);

	const provider = getStoredAiProvider() ?? settings?.ai_provider ?? 'gemini';
	const isLocal = provider === 'local';

	// La config se lee desde un ref: el listener vive fuera del ciclo de render
	// y se quedaría con el valor del render que lo creó.
	useEffect(() => {
		configRef.current = resolveLocalAiSettings(settings ?? null);
		settingsRef.current = settings;
	}, [settings]);

	useEffect(() => {
		if (!isLocal || !isLoaded || !isSignedIn) {
			return;
		}

		let cancelled = false;

		const close = () => {
			sourceRef.current?.close();
			sourceRef.current = null;
		};

		const scheduleReconnect = () => {
			if (cancelled) return;
			// Se cancela el anterior antes de programar otro. Sin esto, dos avisos
			// de error seguidos dejaban un temporizador huérfano que abría una
			// segunda conexión: las dos recibían la misma tarea y la VTuber
			// acababa diciendo cada frase dos veces.
			if (reconnectRef.current) {
				clearTimeout(reconnectRef.current);
				reconnectRef.current = null;
			}
			const delay = Math.min(RECONNECT_BASE_MS * 2 ** attemptRef.current, RECONNECT_MAX_MS);
			attemptRef.current += 1;
			reconnectRef.current = setTimeout(() => void open(), delay);
		};

		/**
		 * Tarea completa: el navegador llama a su modelo y encadena la voz sin
		 * devolver el texto al backend para hablar. Es el mismo recorrido que el
		 * micrófono, y por eso el audio arranca con la primera frase en vez de
		 * esperar a la respuesta entera.
		 */
		const handleTask = async (raw: string) => {
			const task = parseAiTask(JSON.parse(raw));
			if (!task) return;

			const { baseUrl, model } = configRef.current;
			const ajustes = settingsRef.current;
			if (!baseUrl) return;

			const vtuberName = ajustes?.persona_profile?.name?.trim() || 'Sandy';
			const conVoz = ajustes?.feature_flags?.voice_replies !== false;
			const apiKey = ajustes?.fish_audio_key?.trim() ?? '';
			const voiceId = ajustes?.voice_id?.trim() ?? '';

			const deltas = streamLocalCompletion(
				{ baseUrl, model },
				{ message: task.message, systemPrompt: task.systemInstruction },
			);

			try {
				let texto = '';
				if (conVoz && apiKey && voiceId) {
					resetVoiceErrors();
					texto = await speakTextStream(deltas, {
						fish: { apiKey, voiceId },
						onSegmentError: reportVoiceError,
						// Las calcula el backend a partir del personaje. Cortan al modelo
						// si empieza a escribir el turno del espectador.
						stopMarkers: task.stop,
					});
				} else {
					for await (const delta of deltas) {
						texto += delta;
					}
				}

				// Un solo mensaje en la transcripción, no uno por frase.
				addMessage({
					type: 'chat',
					content: `${vtuberName}: ${texto}`,
					timestamp: new Date().toISOString(),
				});

				// El backend solo necesita el texto para el historial.
				await sendTaskResult(task.message, texto);
			} catch (error) {
				// El chat y los eventos no los origina el usuario, así que sin aviso
				// el fallo es invisible: la VTuber se queda muda y nadie sabe por qué.
				console.error('No se pudo resolver la tarea local:', error);
				toast.error(getAiErrorMessage(error));
				posthog.capture('ai_task_failed', { code: getAiErrorCode(error), kind: task.kind });
			}
		};

		const handleRequest = async (raw: string) => {
			const request = parseRelayRequest(JSON.parse(raw));
			if (!request) return;

			const { baseUrl, model } = configRef.current;
			if (!baseUrl) {
				await sendRelayError(
					request.requestId,
					'error.missing-config',
					'Falta la URL del modelo local en Ajustes',
				);
				return;
			}

			try {
				const deltas = streamLocalCompletion(
					{ baseUrl, model },
					{ message: request.message, systemPrompt: request.systemInstruction },
				);

				// Respuestas de una sola pieza: la clasificación necesita el JSON entero
				// y el veredicto de moderación es una decisión, no algo que se lea en
				// voz alta. Trocearlas haría que el backend reensamblara fragmentos
				// como "Sí, debería elimin" + "arse porque...".
				if (request.kind === 'structured' || request.kind === 'moderation') {
					let text = '';
					for await (const delta of deltas) {
						text += delta;
						// Un veredicto es corto. Si el modelo local se enrolla, se corta:
						// el backend espera una decisión, no una redacción.
						if (request.kind === 'moderation' && text.length > MAX_VERDICT_CHARS) {
							break;
						}
					}
					// El formato lo define el prompt que compuso el backend, así que el
					// texto va tal cual: normalizarlo aquí lo rompería.
					await sendRelayResult(request.requestId, text);
					return;
				}

				// Los envíos van en serie a propósito: el backend reconstruye la
				// respuesta en orden de llegada.
				let pending = '';
				for await (const delta of deltas) {
					pending += delta;
					const match = SENTENCE_BOUNDARY.exec(pending);
					const corte = match ? match.index + match[0].length : -1;

					if (corte > 0) {
						await sendRelayResult(request.requestId, pending.slice(0, corte), true);
						pending = pending.slice(corte);
					} else if (pending.length >= MAX_CHUNK_CHARS) {
						const espacio = pending.lastIndexOf(' ', MAX_CHUNK_CHARS);
						const hasta = espacio > 0 ? espacio + 1 : MAX_CHUNK_CHARS;
						await sendRelayResult(request.requestId, pending.slice(0, hasta), true);
						pending = pending.slice(hasta);
					}
				}
				// El último envío cierra la petición, aunque no quede texto.
				await sendRelayResult(request.requestId, pending);
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Error desconocido';
				await sendRelayError(request.requestId, 'error.provider-unavailable', message);
			}
		};

		// Solo la apertura más reciente puede quedarse con la conexión. Entre pedir
		// el token y abrir el EventSource hay dos await, y en ese hueco puede
		// entrar otra apertura; sin este contador las dos creaban su conexión y
		// solo una quedaba registrada para cerrarse.
		let generacion = 0;

		const open = async () => {
			const mia = ++generacion;
			try {
				close();
				const clerkToken = await getToken();
				if (!clerkToken) throw new Error('Sin sesión de Clerk');

				// Token fresco en cada intento: solo se valida al abrir.
				const { token } = await fetchStreamToken({ token: clerkToken });
				if (cancelled || mia !== generacion) return;

				const source = new EventSource(
					`${getBackendUrl()}/stream?token=${encodeURIComponent(token)}`,
				);
				sourceRef.current = source;

				source.addEventListener('ai_request', (event) => {
					void handleRequest((event as MessageEvent<string>).data);
				});
				source.addEventListener('ai_task', (event) => {
					void handleTask((event as MessageEvent<string>).data);
				});
				source.onopen = () => {
					attemptRef.current = 0;
				};
				source.onerror = () => {
					if (sourceRef.current !== source) return;
					close();
					scheduleReconnect();
				};
			} catch {
				scheduleReconnect();
			}
		};

		void open();

		return () => {
			cancelled = true;
			if (reconnectRef.current) clearTimeout(reconnectRef.current);
			close();
		};
	}, [isLocal, isLoaded, isSignedIn, getToken, addMessage, reportVoiceError, resetVoiceErrors]);
}
