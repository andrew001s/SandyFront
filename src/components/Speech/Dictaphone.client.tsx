// components/Speech/Dictaphone.client.tsx
'use client';

import { getVoiceSandy } from '@/api/fetchFishAudio';
import { getResponseGemini } from '@/api/fetchGemini';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useMessages } from '@/context/MessagesContext';
import { useAudioQueue } from '@/hooks/useAudioQueue';
import { getAiErrorCode, getAiErrorMessage } from '@/lib/ai-errors';
import { getStoredSttProvider } from '@/lib/stt-provider';
import { cn } from '@/lib/utils';
import { getMissingVoiceRequirements, type VoiceRequirement } from '@/lib/voice-requirements';
import { VoiceSetupDialog } from '@/components/Speech/VoiceSetupDialog';
import { Mic } from 'lucide-react';
import posthog from 'posthog-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { toast } from 'sonner';
import { ThinkingOrb } from 'thinking-orbs';
import { createSpeechServicesPonyfill } from 'web-speech-cognitive-services';
import SwitchComponent from '../SwitchComponent/Switch';
import { TypingAnimation } from '../magicui/typing-animation';

const Dictaphone = ({ variant = 'bar' }: { variant?: 'bar' | 'tile' } = {}) => {
	const { addToQueue } = useAudioQueue();
	const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
	const transcriptRef = useRef('');
	const isSendingRef = useRef(false);
	const { addMessage } = useMessages();
	const { settings, isLoading } = useAppSettings();
	const effectiveSttProvider = getStoredSttProvider() ?? settings?.stt_provider ?? 'azure';
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

		const vtuberName = settings?.persona_profile?.name?.trim() || 'Sandy';

		try {
			addMessage({
				type: 'transcription',
				content: `Transcripción: ${pending}`,
				timestamp: new Date().toISOString(),
			});

			const response = await getResponseGemini(pending);
			addMessage({
				type: 'transcription',
				content: `${vtuberName}: ${response}`,
				timestamp: new Date().toISOString(),
			});

			if (settings?.feature_flags?.voice_replies !== false) {
				const audioBlob = await getVoiceSandy(response, {
					apiKey: settings?.fish_audio_key ?? '',
					voiceId: settings?.voice_id ?? '',
				});
				addToQueue(audioBlob);
			}
		} catch (error) {
			console.error('Error al obtener respuesta de audio:', error);
			// El backend devuelve un código estable; el texto sale del catálogo
			// local para que el usuario sepa qué hacer, no solo que falló.
			toast.error(getAiErrorMessage(error));
			posthog.capture('ai_request_failed', { code: getAiErrorCode(error) });
		} finally {
			isSendingRef.current = false;
		}
	}, [addMessage, addToQueue, resetTranscript, settings]);

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

	const startListening = () =>
		SpeechRecognition.startListening({
			continuous: true,
			language: settings?.language || 'es-ES',
		});

	const handleSpeechToggle = (checked: boolean) => {
		// Apagar siempre debe funcionar: la validación solo aplica al encender,
		// para no dejar el micrófono atrapado si la configuración cambia mientras escucha.
		if (checked) {
			if (isLoading) {
				toast.info('Cargando tu configuración, espera un momento...');
				return;
			}

			const missing = getMissingVoiceRequirements({
				settings,
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

			startListening();
			posthog.capture('voice_recognition_toggled', {
				enabled: true,
				provider: effectiveSttProvider,
			});
			toast.success('Reconocimiento de voz activado');
		} else {
			SpeechRecognition.stopListening();
			posthog.capture('voice_recognition_toggled', {
				enabled: false,
				provider: effectiveSttProvider,
			});
			resetTranscript();
			toast.error('Reconocimiento de voz desactivado');
		}
	};

	if (variant === 'tile') {
		return (
			<>
				<button
					type='button'
					onClick={() => handleSpeechToggle(!listening)}
					className={cn(
						'group relative flex h-full flex-col items-center gap-3 overflow-hidden rounded-2xl border p-5 text-center outline-none transition-all focus-visible:ring-2 focus-visible:ring-violet-500/50',
						listening
							? 'border-violet-500/30 bg-violet-500/5 hover:border-violet-500/50 hover:bg-violet-500/10'
							: 'border-border/60 bg-background/60 hover:border-border hover:bg-accent/50',
					)}
				>
					<div
						className='pointer-events-none absolute inset-0 opacity-60'
						style={{
							backgroundImage:
								'linear-gradient(to right, rgba(139,92,246,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(139,92,246,0.08) 1px, transparent 1px)',
							backgroundSize: '18px 18px',
						}}
					/>
					<span
						className={cn(
							'absolute top-3 right-3 flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-medium text-[10px] uppercase tracking-wide',
							listening
								? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
								: 'border-border/70 bg-background/80 text-muted-foreground',
						)}
					>
						<span
							className={cn(
								'size-1.5 rounded-full',
								listening
									? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)]'
									: 'bg-muted-foreground',
							)}
						/>
						{listening ? 'Escuchando' : 'Inactivo'}
					</span>
					<div
						className={cn(
							'mt-5 flex size-12 items-center justify-center rounded-2xl border shadow-sm transition-colors',
							listening
								? 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-[#A78BFA]'
								: 'border-border/70 bg-background/80 text-muted-foreground',
						)}
					>
						{listening ? (
							<ThinkingOrb state='listening' size={64} speed={0.55} />
						) : (
							<Mic className='size-6' />
						)}
					</div>
					<div className='relative z-10'>
						<p className='font-medium text-sm'>Micrófono</p>
						<p className='text-muted-foreground text-xs'>
							{listening
								? 'Escuchando... di algo para hablar con Sandy.'
								: browserSupportsSpeechRecognition
									? 'Activa el micrófono para hablar con Sandy.'
									: 'Tu navegador no soporta reconocimiento de voz.'}
						</p>
					</div>
				</button>
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
						<SwitchComponent onCheckedChange={handleSpeechToggle} />
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
