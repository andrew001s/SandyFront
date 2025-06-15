// components/Speech/Dictaphone.client.tsx
'use client';

import { getVoiceSandy } from '@/api/fetchFishAudio';
import { getResponseGemini } from '@/api/fetchGemini';
import { useMessages } from '@/context/MessagesContext';
import { useAudioQueue } from '@/hooks/useAudioQueue';
import { useEffect, useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { toast } from 'sonner';
import { createSpeechServicesPonyfill } from 'web-speech-cognitive-services';
import SwitchComponent from '../SwitchComponent/Switch';
import { TypingAnimation } from '../magicui/typing-animation';

const SUBSCRIPTION_KEY = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;
const REGION = process.env.NEXT_PUBLIC_AZURE_REGION;
const LANGUAGE = process.env.NEXT_PUBLIC_LANGUAGE || 'es-ES';

const Dictaphone = () => {
	const { audioRef, addToQueue } = useAudioQueue();
	const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null);
	const { addMessage } = useMessages();

	useEffect(() => {
		const initSpeechRecognition = () => {
			const { SpeechRecognition: AzureSpeechRecognition } = createSpeechServicesPonyfill({
				credentials: {
					region: REGION,
					subscriptionKey: SUBSCRIPTION_KEY,
				},
			});

			SpeechRecognition.applyPolyfill(AzureSpeechRecognition);
		};

		initSpeechRecognition();
	}, []); // Solo se ejecuta una vez al montar el componente

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

					const audioBlob = await getVoiceSandy(response);
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
			language: LANGUAGE,
		});

	const handleSpeechToggle = (checked: boolean) => {
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

	return (
		<div className='flex w-full flex-col gap-2 pt-4'>
			<div className='flex items-center space-x-3'>
				<span>Reconocimiento de Voz:</span>
				<SwitchComponent onCheckedChange={handleSpeechToggle} />
			</div>
			{transcript && (
				<div className='flex flex-row space-x-2 rounded-md bg-gray-800 p-2'>
					<span>Trascripción:</span>
					<TypingAnimation className='font-normal text-base'>{transcript}</TypingAnimation>
				</div>
			)}

			
			<audio ref={audioRef} preload='auto' className='hidden'>
				<track kind='captions' />
			</audio>
		</div>
	);
};

export default Dictaphone;
