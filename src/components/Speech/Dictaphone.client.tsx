// components/Speech/Dictaphone.client.tsx
'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getVoiceSandy } from '@/api/fetchFishAudio';
import { getResponseGemini } from '@/api/fetchGemini';
import { useAudioQueue } from '@/hooks/useAudioQueue';
import { Switch } from '../ui/switch';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { createSpeechServicesPonyfill } from 'web-speech-cognitive-services';

const SUBSCRIPTION_KEY = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;
const REGION = process.env.NEXT_PUBLIC_AZURE_REGION;
const LANGUAGE = process.env.NEXT_PUBLIC_LANGUAGE || 'es-ES';

const Dictaphone = () => {
	const [transcriptHistory, setTranscriptHistory] = useState<string[]>([]);
	const { audioRef, addToQueue } = useAudioQueue();
	const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null);
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
					const response = await getResponseGemini(transcript);
					setTranscriptHistory((prev) => [...prev, transcript]);
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
			setTranscriptHistory([]);
		}
	};

	if (!browserSupportsSpeechRecognition) {
		return null;
	}

	return (
		<div className='flex flex-col gap-2 pt-4'>
			<span>Reconocimiento de Voz:</span>
			<Switch onCheckedChange={handleSpeechToggle} />
			<p>{transcript}</p>
			<div>
				<h3>Transcripción:</h3>
				{transcriptHistory.map((text, i) => (
					<p key={`transcript-${i}`}>{text}</p>
				))}
			</div>
			<audio ref={audioRef} preload='auto' className='hidden'>
				<track kind='captions' />
			</audio>
		</div>
	);
};

export default Dictaphone;
