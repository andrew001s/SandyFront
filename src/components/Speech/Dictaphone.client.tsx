// components/Speech/Dictaphone.client.tsx
'use client';

import { streamAiResponse } from '@/api/aiResponse';
import { VoiceSetupDialog } from '@/components/Speech/VoiceSetupDialog';
import { Button } from '@/components/ui/button';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useMessages } from '@/context/MessagesContext';
import { useServiceStatus } from '@/hooks/useServiceStatus';
import { useVoiceErrorReporter } from '@/hooks/useVoiceErrorReporter';
import { getAiErrorCode, getAiErrorMessage } from '@/lib/ai-errors';
import { getStoredAiProvider } from '@/lib/ai-provider';
import { resolveLocalAiSettings } from '@/lib/local-ai-config';
import { speakTextStream } from '@/lib/speechPipeline';
import { getStoredSttProvider } from '@/lib/stt-provider';
import { cn } from '@/lib/utils';
import { type VoiceRequirement, getMissingVoiceRequirements } from '@/lib/voice-requirements';
import { Mic } from 'lucide-react';
import posthog from 'posthog-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { toast } from 'sonner';
import { ThinkingOrb } from 'thinking-orbs';
import { createSpeechServicesPonyfill } from 'web-speech-cognitive-services';
import SwitchComponent from '../SwitchComponent/Switch';
import { TypingAnimation } from '../magicui/typing-animation';

// El reconocimiento de react-speech-recognition es un singleton de módulo, así que
// la intención del usuario también: si fuera un ref del componente se perdería al
// navegar fuera de /home y volver.
let shouldListen = false;

const Dictaphone = ({ variant = 'bar' }: { variant?: 'bar' | 'tile' } = {}) => {
	const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
	const transcriptRef = useRef('');
	const isSendingRef = useRef(false);
	const { addMessage } = useMessages();
	const { settings, isLoading } = useAppSettings();
	// El estado sale del backend, no de StatusContext: ese booleano vive en
	// localStorage y lo escribe también la conexión de Twitch, así que estaba en
	// true con el servicio parado y dejaba encender el micrófono.
	const {
		isRunning: serviceRunning,
		hasLoaded: serviceLoaded,
		hasError: serviceError,
		refresh: refreshService,
	} = useServiceStatus();
	const { report: reportVoiceError, reset: resetVoiceErrors } = useVoiceErrorReporter();
	const effectiveSttProvider = getStoredSttProvider() ?? settings?.stt_provider ?? 'azure';
	const effectiveAiProvider = getStoredAiProvider() ?? settings?.ai_provider ?? 'gemini';
	// Espejo en estado de `shouldListen`: el módulo conserva la intención entre
	// montajes, pero React necesita un estado para repintar el icono.
	const [micEnabled, setMicEnabled] = useState(shouldListen);
	const [missingRequirements, setMissingRequirements] = useState<VoiceRequirement[]>([]);
	const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false);

	useEffect(() => {
		if (effectiveSttProvider === 'browser') {
			(
				SpeechRecognition as typeof SpeechRecognition & { removePolyfill: () => void }
			).removePolyfill();
			return;
		}

		if (!settings?.azure_speech_key || !settings?.azure_region) {
			return;
		}

		const initSpeechRecognition = () => {
			const { SpeechRecognition: AzureSpeechRecognition } = createSpeechServicesPonyfill({
				credentials: {
					region: settings.azure_region,
					subscriptionKey: settings.azure_speech_key,
				},
			});

			SpeechRecognition.applyPolyfill(AzureSpeechRecognition);
		};

		initSpeechRecognition();
	}, [effectiveSttProvider, settings?.azure_region, settings?.azure_speech_key]);

	const { transcript, resetTranscript, browserSupportsSpeechRecognition, listening } =
		useSpeechRecognition({
			commands: [
				{
					command: '*',
					callback: () => {
						resetSilenceTimer();
					},
				},
			],
		});

	// El temporizador lee el transcript desde un ref para no quedarse con el
	// valor capturado en el render que lo programó.
	useEffect(() => {
		transcriptRef.current = transcript;
	}, [transcript]);

	const sendTranscript = useCallback(async () => {
		const pending = transcriptRef.current.trim();
		if (!pending || isSendingRef.current) {
			return;
		}

		// Se limpia ANTES de enviar: si la petición falla, el texto no puede
		// quedarse pegado y reenviarse acumulado en el siguiente intento.
		// Con `continuous: true` el transcript se acumula hasta que se resetea.
		isSendingRef.current = true;
		resetTranscript();
		transcriptRef.current = '';

		resetVoiceErrors();
		const vtuberName = settings?.persona_profile?.name?.trim() || 'Sandy';

		try {
			addMessage({
				type: 'transcription',
				content: `Transcripción: ${pending}`,
				timestamp: new Date().toISOString(),
			});

			const localAi = resolveLocalAiSettings(settings ?? null);
			const stream = streamAiResponse({
				provider: getStoredAiProvider() ?? settings?.ai_provider ?? 'gemini',
				message: pending,
				local: { baseUrl: localAi.baseUrl, model: localAi.model },
			});

			if (settings?.feature_flags?.voice_replies === false) {
				// Sin voz no hay nada que trocear: se consume el flujo y se vuelca a texto.
				let text = '';
				for await (const delta of stream) {
					text += delta;
				}
				addMessage({
					type: 'transcription',
					content: `${vtuberName}: ${text}`,
					timestamp: new Date().toISOString(),
				});
				return;
			}

			// El audio de cada frase se pide en cuanto la frase está completa, sin
			// esperar al final de la respuesta. Con el modelo local esto arranca la
			// voz mientras el modelo sigue generando.
			const fullText = await speakTextStream(stream, {
				fish: {
					apiKey: settings?.fish_audio_key ?? '',
					voiceId: settings?.voice_id ?? '',
				},
				onSegmentError: reportVoiceError,
			});

			addMessage({
				type: 'transcription',
				content: `${vtuberName}: ${fullText}`,
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			console.error('Error al obtener respuesta de audio:', error);
			// El backend devuelve un código estable; el texto sale del catálogo
			// local para que el usuario sepa qué hacer, no solo que falló.
			toast.error(getAiErrorMessage(error));
			posthog.capture('ai_request_failed', { code: getAiErrorCode(error) });
		} finally {
			isSendingRef.current = false;
		}
	}, [addMessage, resetTranscript, settings, reportVoiceError, resetVoiceErrors]);

	// El handle vive en un ref, no en estado: resetSilenceTimer se dispara en
	// cada palabra reconocida, mucho más rápido de lo que React re-renderiza.
	// Leyendo el handle desde estado se limpiaba uno ya cancelado y quedaban
	// varios temporizadores vivos, cada uno con su propia petición.
	const resetSilenceTimer = useCallback(() => {
		if (silenceTimerRef.current) {
			clearTimeout(silenceTimerRef.current);
		}
		silenceTimerRef.current = setTimeout(() => {
			silenceTimerRef.current = null;
			void sendTranscript();
		}, 2000);
	}, [sendTranscript]);

	useEffect(() => {
		return () => {
			if (silenceTimerRef.current) {
				clearTimeout(silenceTimerRef.current);
			}
		};
	}, []);

	const startListening = useCallback(
		() =>
			SpeechRecognition.startListening({
				continuous: true,
				language: settings?.language || 'es-ES',
			}),
		[settings?.language],
	);

	// Cuando la pestaña pasa a segundo plano el navegador corta el reconocimiento.
	// react-speech-recognition intenta reiniciarlo solo, pero si ese `start()` falla
	// (Chrome lo rechaza en pestañas ocultas) se traga el error y deja su estado
	// interno en `listening = false` SIN avisar a los suscriptores: la UI se queda
	// en "Escuchando" y `stopListening()` tampoco hace nada, porque internamente ya
	// no está escuchando. De ahí que solo se recuperara recargando.
	//
	// La intención del usuario se guarda aparte y se vuelve a llamar a
	// startListening(), que es idempotente: si de verdad está escuchando no hace
	// nada, y si no, arranca y reemite el estado, resincronizando la UI.
	const setListenIntent = useCallback((next: boolean) => {
		shouldListen = next;
		setMicEnabled(next);
	}, []);

	const resumeListeningIfNeeded = useCallback(() => {
		if (!shouldListen || document.visibilityState !== 'visible') {
			return;
		}
		void startListening();
	}, [startListening]);

	useEffect(() => {
		document.addEventListener('visibilitychange', resumeListeningIfNeeded);
		const watchdog = window.setInterval(resumeListeningIfNeeded, 5000);

		return () => {
			document.removeEventListener('visibilitychange', resumeListeningIfNeeded);
			window.clearInterval(watchdog);
		};
	}, [resumeListeningIfNeeded]);

	// Si el servicio se detiene, el micrófono no puede quedarse escuchando:
	// seguiría transcribiendo y disparando peticiones sin nadie que responda.
	useEffect(() => {
		// Solo con una respuesta confirmada del backend. Mientras carga, o si la
		// consulta falla, `serviceRunning` es false sin que el servicio se haya
		// parado: apagar ahí cortaría el micrófono en mitad de un directo por un
		// corte de red.
		if (serviceLoaded && !serviceError && !serviceRunning && micEnabled) {
			SpeechRecognition.stopListening();
			resetTranscript();
			setMicEnabled(false);
		}
	}, [serviceRunning, serviceLoaded, serviceError, micEnabled, resetTranscript]);

	const handleSpeechToggle = async (checked: boolean) => {
		// Apagar siempre debe funcionar: la validación solo aplica al encender,
		// para no dejar el micrófono atrapado si la configuración cambia mientras escucha.
		if (checked) {
			// El micrófono solo activa el reconocimiento de voz; sin el servicio
			// de VTuber en marcha no hay nada que responda, así que no arranca.
			// Se pregunta al backend AHORA en vez de mirar el último sondeo: entre
			// uno y otro pasan 30 segundos, y arrancar el servicio y pulsar aquí
			// seguido entra de lleno en esa ventana. Con el valor viejo el aviso
			// salía justo al revés de la realidad.
			const estado = await refreshService();
			if (!estado?.running) {
				toast.error('Inicia el servicio de VTuber antes de activar el micrófono');
				return;
			}

			if (isLoading) {
				toast.info('Cargando tu configuración, espera un momento...');
				return;
			}

			const missing = getMissingVoiceRequirements({
				settings,
				aiProvider: effectiveAiProvider,
				localAi: resolveLocalAiSettings(settings ?? null),
				sttProvider: effectiveSttProvider,
				browserSupportsSpeechRecognition,
			});

			if (missing.length > 0) {
				setMissingRequirements(missing);
				setIsSetupDialogOpen(true);
				posthog.capture('voice_setup_incomplete', {
					missing: missing.map((requirement) => requirement.id),
					provider: effectiveSttProvider,
				});
				return;
			}

			setListenIntent(true);
			void startListening();
			posthog.capture('voice_recognition_toggled', {
				enabled: true,
				provider: effectiveSttProvider,
			});
			toast.success('Reconocimiento de voz activado');
		} else {
			setListenIntent(false);
			void SpeechRecognition.stopListening();
			posthog.capture('voice_recognition_toggled', {
				enabled: false,
				provider: effectiveSttProvider,
			});
			resetTranscript();
			toast.error('Reconocimiento de voz desactivado');
		}
	};

	if (variant === 'tile') {
		const isListening = micEnabled && listening;
		const pillTone = !micEnabled
			? 'border-border bg-background text-muted-foreground'
			: isListening
				? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
				: 'border-amber-500/30 bg-amber-500/10 text-amber-500';

		return (
			<>
				<div
					className={cn(
						'group relative flex h-full min-h-[200px] flex-col justify-between rounded-xl border p-5 transition-all duration-200',
						micEnabled
							? 'border-primary/40 bg-card shadow-xs'
							: 'border-border bg-card hover:border-primary/30',
					)}
				>
					<div>
						<div className='flex items-center justify-between'>
							<div
								className={cn(
									'flex size-10 items-center justify-center rounded-lg border transition-colors',
									micEnabled
										? 'border-primary/40 bg-primary/10 text-primary'
										: 'border-border bg-background text-muted-foreground',
								)}
							>
								{micEnabled ? (
									<ThinkingOrb state='listening' size={64} speed={0.55} />
								) : (
									<Mic className='size-5' />
								)}
							</div>
							<span
								className={cn(
									'flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider',
									pillTone,
								)}
							>
								<span
									className={cn(
										'size-1.5 rounded-full',
										!micEnabled
											? 'bg-muted-foreground/60'
											: isListening
												? 'animate-pulse bg-emerald-400'
												: 'bg-amber-500',
									)}
								/>
								{!micEnabled ? 'Inactivo' : isListening ? 'Escuchando' : 'Reconectando'}
							</span>
						</div>

						<div className='mt-4'>
							<h3 className='font-display font-semibold text-base text-foreground'>
								Micrófono de Entrada
							</h3>
							<p className='mt-1 font-sans text-muted-foreground text-xs leading-relaxed'>
								{micEnabled
									? isListening
										? 'Escuchando tu voz... di algo en directo para hablar con Sandy.'
										: 'Reanudando el reconocimiento de audio...'
									: browserSupportsSpeechRecognition
										? 'Activa el micrófono para hablar con Sandy por voz en tu stream.'
										: 'Tu navegador no tiene soporte para reconocimiento de voz.'}
							</p>
						</div>
					</div>

					<div className='mt-5'>
						<Button
							type='button'
							onClick={() => handleSpeechToggle(!micEnabled)}
							disabled={!browserSupportsSpeechRecognition}
							className={cn(
								'h-9 w-full rounded-lg font-sans font-semibold text-xs transition-all',
								micEnabled
									? 'border border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground'
									: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
							)}
						>
							<Mic size={14} />
							<span>{micEnabled ? 'Desactivar micrófono' : 'Activar micrófono'}</span>
						</Button>
					</div>
				</div>
				<VoiceSetupDialog
					open={isSetupDialogOpen}
					onOpenChange={setIsSetupDialogOpen}
					requirements={missingRequirements}
				/>
			</>
		);
	}

	if (!browserSupportsSpeechRecognition) {
		return null;
	}

	if (isLoading) {
		return <p>Cargando reconocimiento de voz...</p>;
	}

	return (
		<>
			<div className='flex w-full flex-col gap-2 pt-4'>
				<div className='flex items-center gap-3 rounded-2xl border border-border/60 bg-card/70 px-4 py-3 backdrop-blur-sm'>
					<Mic size={18} className='text-violet-600 dark:text-[#A78BFA]' />
					<span className='font-medium text-sm'>Reconocimiento de Voz</span>
					<div className='ml-auto'>
						<SwitchComponent checked={micEnabled} onCheckedChange={handleSpeechToggle} />
					</div>
				</div>
				{transcript && (
					<div className='flex flex-row gap-2 rounded-2xl border border-[#8B5CF6]/20 bg-card px-3 py-2 text-card-foreground'>
						<span className='shrink-0 text-muted-foreground'>Transcripción:</span>
						<TypingAnimation className='font-normal text-base text-foreground'>
							{transcript}
						</TypingAnimation>
					</div>
				)}
			</div>
			<VoiceSetupDialog
				open={isSetupDialogOpen}
				onOpenChange={setIsSetupDialogOpen}
				requirements={missingRequirements}
			/>
		</>
	);
};

export default Dictaphone;
