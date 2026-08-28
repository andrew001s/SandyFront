'use client';

import { parseRelayRequest, sendRelayError, sendRelayResult } from '@/api/aiRelay';
import { getBackendUrl } from '@/api/backendClient';
import { streamLocalCompletion } from '@/api/localAi';
import { fetchStreamToken } from '@/api/streamToken';
import { useAppSettings } from '@/context/AppSettingsContext';
import { getStoredAiProvider } from '@/lib/ai-provider';
import { resolveLocalAiSettings } from '@/lib/local-ai-config';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useRef } from 'react';

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
	const sourceRef = useRef<EventSource | null>(null);
	const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const attemptRef = useRef(0);
	const configRef = useRef({ baseUrl: '', model: '' });

	const provider = getStoredAiProvider() ?? settings?.ai_provider ?? 'gemini';
	const isLocal = provider === 'local';

	// La config se lee desde un ref: el listener vive fuera del ciclo de render
	// y se quedaría con el valor del render que lo creó.
	useEffect(() => {
		configRef.current = resolveLocalAiSettings(settings ?? null);
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
			const delay = Math.min(RECONNECT_BASE_MS * 2 ** attemptRef.current, RECONNECT_MAX_MS);
			attemptRef.current += 1;
			reconnectRef.current = setTimeout(() => void open(), delay);
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
				// El backend espera el texto completo: aquí no hay nada que
				// mostrar en pantalla, solo devolver el resultado.
				let text = '';
				for await (const delta of streamLocalCompletion(
					{ baseUrl, model },
					{ message: request.message, systemPrompt: request.systemInstruction },
				)) {
					text += delta;
				}
				await sendRelayResult(request.requestId, text);
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Error desconocido';
				await sendRelayError(request.requestId, 'error.provider-unavailable', message);
			}
		};

		const open = async () => {
			try {
				close();
				const clerkToken = await getToken();
				if (!clerkToken) throw new Error('Sin sesión de Clerk');

				// Token fresco en cada intento: solo se valida al abrir.
				const { token } = await fetchStreamToken({ token: clerkToken });
				if (cancelled) return;

				const source = new EventSource(
					`${getBackendUrl()}/stream?token=${encodeURIComponent(token)}`,
				);
				sourceRef.current = source;

				source.addEventListener('ai_request', (event) => {
					void handleRequest((event as MessageEvent<string>).data);
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
	}, [isLocal, isLoaded, isSignedIn, getToken]);
}
