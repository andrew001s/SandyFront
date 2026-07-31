// components/Speech/Dictaphone.client.tsx
'use client';

import { getVoiceSandy } from '@/api/fetchFishAudio';
import { getResponseGemini } from '@/api/fetchGemini';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useMessages } from '@/context/MessagesContext';
import { useAudioQueue } from '@/hooks/useAudioQueue';
import { getStoredSttProvider } from '@/lib/stt-provider';
import { Mic } from 'lucide-react';
import { useEffect, useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { toast } from 'sonner';
import { createSpeechServicesPonyfill } from 'web-speech-cognitive-services';
import SwitchComponent from '../SwitchComponent/Switch';
import { TypingAnimation } from '../magicui/typing-animation';

const Dictaphone = () => {
	const { addToQueue } = useAudioQueue();
	const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null);
	const { addMessage } = useMessages();
	const { settings, isLoading } = useAppSettings();
	const effectiveSttProvider = getStoredSttProvider() ?? settings?.stt_provider ?? 'azure';

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

	const { transcript, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition({
		commands: [
			{
				command: '*',
				callback: () => {
					resetSilenceTimer();
				},
			},
		],
	});

	const resetSilenceTimer = () => {
		if (silenceTimer) clearTimeout(silenceTimer);
		const timer = setTimeout(async () => {
			if (transcript) {
				try {
					addMessage({
						type: 'transcription',
						content: `Transcripción: ${transcript}`,
						timestamp: new Date().toISOString(),
					});

					const response = await getResponseGemini(transcript);
					addMessage({
						type: 'transcription',
						content: `Sandy: ${response}`,
						timestamp: new Date().toISOString(),
					});
					resetTranscript();

					const audioBlob = await getVoiceSandy(response, {
						apiKey: settings?.fish_audio_key ?? '',
						voiceId: settings?.voice_id ?? '',
					});
					addToQueue(audioBlob);
				} catch (error) {
					console.error('Error al obtener respuesta de audio:', error);
					toast.error('Error al procesar el audio');
				}
			}
		}, 2000);
		setSilenceTimer(timer);
	};

	useEffect(() => {
		return () => {
			if (silenceTimer) clearTimeout(silenceTimer);
		};
	}, [silenceTimer]);

	const startListening = () =>
		SpeechRecognition.startListening({
			continuous: true,
			language: settings?.language || 'es-ES',
		});

	const handleSpeechToggle = (checked: boolean) => {
		const isBrowserProvider = effectiveSttProvider === 'browser';

		if (isBrowserProvider) {
			if (!browserSupportsSpeechRecognition) {
				toast.error(
					'El reconocimiento gratuito del navegador solo está disponible en Google Chrome y otros navegadores basados en Chromium',
				);
				return;
			}
		} else if (!settings?.azure_speech_key || !settings?.azure_region) {
			toast.error('Configura Azure Speech en Ajustes de IA antes de usar voz');
			return;
		}

		if (checked) {
			startListening();
			toast.success('Reconocimiento de voz activado');
		} else {
			SpeechRecognition.stopListening();
			resetTranscript();
			toast.error('Reconocimiento de voz desactivado');
		}
	};

	if (!browserSupportsSpeechRecognition) {
		return null;
	}

	if (isLoading) {
		return <p>Cargando reconocimiento de voz...</p>;
	}

	return (
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
	);
};

export default Dictaphone;
