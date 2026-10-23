'use client';

import { getVoiceEdge } from '@/api/fetchEdgeTts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AudioQueueManager } from '@/lib/audioQueueSingleton';
import {
	generateSpeechSentenceWav,
	generateVowelTestWav,
	playLipSyncTest,
	stopLipSyncTest,
} from '@/lib/avatar/testAudioGenerator';
import { vnyanClient } from '@/lib/avatar/vnyanClient';
import { vrmManager } from '@/lib/avatar/vrmManager';
import {
	DEFAULT_EDGE_VOICE,
	EDGE_VOICE_PRESETS,
	getStoredEdgeTtsConfig,
	storeEdgeTtsConfig,
} from '@/lib/tts-provider';
import type { AvatarSoftware } from '@/types/avatar';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import {
	FiActivity,
	FiChevronDown,
	FiMessageSquare,
	FiMic,
	FiMusic,
	FiPlay,
	FiSquare,
	FiVolume2,
	FiZap,
} from 'react-icons/fi';
import { toast } from 'sonner';

interface Props {
	connected: boolean;
	software?: AvatarSoftware;
}

export function LipSyncTest({ connected, software = 'vnyan' }: Props) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [activeManualVowel, setActiveManualVowel] = useState<string | null>(null);
	const [customText, setCustomText] = useState(
		'¡Hola! Sandy está sincronizando sus labios en tiempo real con Edge TTS',
	);
	const [selectedVoice, setSelectedVoice] = useState<string>(DEFAULT_EDGE_VOICE);
	const [isProcessing, setIsProcessing] = useState(false);
	const manualTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const cancelGestureRef = useRef<(() => void) | null>(null);

	// Cargar configuración guardada de voz al montar
	useEffect(() => {
		const stored = getStoredEdgeTtsConfig();
		if (stored?.voice) {
			setSelectedVoice(stored.voice);
		}
	}, []);

	// Suscribirse al estado real de reproducción del reproductor global de audio
	useEffect(() => {
		const manager = AudioQueueManager.getInstance();
		const unsubscribe = manager.subscribe((playing) => {
			setIsPlaying(playing);
		});
		return () => {
			unsubscribe();
			if (manualTimerRef.current) {
				clearTimeout(manualTimerRef.current);
			}
			if (cancelGestureRef.current) {
				cancelGestureRef.current();
			}
		};
	}, []);

	const handleVoiceChange = (voiceId: string) => {
		setSelectedVoice(voiceId);
		storeEdgeTtsConfig({ voice: voiceId });
		const matched = EDGE_VOICE_PRESETS.find((v) => v.id === voiceId);
		toast.info(`Voz Edge TTS cambiada a: ${matched?.name || voiceId}`);
	};

	// Probar secuencia de vocales con Edge TTS (con fallback acústico local si falla)
	const handleTestVowels = async () => {
		try {
			setIsProcessing(true);
			stopLipSyncTest();

			toast.loading('Sintetizando vocales con Edge TTS...', { id: 'lipsync-test' });

			let audioBlob: Blob;
			try {
				// Pronunciación de vocales con separación para observar apertura y forma fonética
				audioBlob = await getVoiceEdge('A, E, I, O, U.', {
					voice: selectedVoice,
					rate: '-10%',
				});
			} catch {
				audioBlob = generateVowelTestWav();
			}

			await playLipSyncTest(audioBlob);
			toast.success('Reproduciendo vocales (A - E - I - O - U) con Edge TTS', {
				id: 'lipsync-test',
			});
		} catch {
			toast.error('No se pudo reproducir la prueba de vocales', { id: 'lipsync-test' });
		} finally {
			setIsProcessing(false);
		}
	};

	// Probar frase hablada fluida con Edge TTS
	const handleTestSentence = async () => {
		try {
			setIsProcessing(true);
			stopLipSyncTest();

			const phrase =
				customText.trim() ||
				'¡Hola! Sandy está sincronizando sus labios en tiempo real con Edge TTS';

			toast.loading('Generando voz con Edge TTS...', { id: 'lipsync-test' });

			let audioBlob: Blob;
			try {
				audioBlob = await getVoiceEdge(phrase, {
					voice: selectedVoice,
				});
			} catch {
				audioBlob = generateSpeechSentenceWav(phrase);
			}

			await playLipSyncTest(audioBlob);
			toast.success('Reproduciendo voz con Edge TTS', { id: 'lipsync-test' });
		} catch {
			toast.error('No se pudo reproducir la frase de prueba', { id: 'lipsync-test' });
		} finally {
			setIsProcessing(false);
		}
	};

	// Detener reproducción y cerrar boca
	const handleStop = () => {
		stopLipSyncTest();
		setActiveManualVowel(null);
		toast.info('Prueba de Lip Sync detenida');
	};

	// Disparar forma de vocal directa sobre el modelo para inspección visual fluida a 60 FPS
	const handleManualVowel = (vowel: 'A' | 'E' | 'I' | 'O' | 'U' | 'MouthOpen' | 'Neutral') => {
		if (cancelGestureRef.current) {
			cancelGestureRef.current();
			cancelGestureRef.current = null;
		}
		if (manualTimerRef.current) {
			clearTimeout(manualTimerRef.current);
			manualTimerRef.current = null;
		}

		if (software === 'vrm') {
			if (vowel === 'Neutral') {
				setActiveManualVowel(null);
				vrmManager.setVowels({ A: 0, I: 0, U: 0, E: 0, O: 0 });
				return;
			}
			setActiveManualVowel(vowel);
			const target = vowel === 'MouthOpen' ? 'A' : vowel;
			const vMap: Record<string, number> = { A: 0, I: 0, U: 0, E: 0, O: 0 };
			vMap[target] = 1.0;
			vrmManager.setVowels(vMap);

			manualTimerRef.current = setTimeout(() => {
				setActiveManualVowel(null);
				vrmManager.setVowels({ A: 0, I: 0, U: 0, E: 0, O: 0 });
			}, 620);
			return;
		}

		if (vowel === 'Neutral') {
			setActiveManualVowel(null);
			void vnyanClient.injectVrmVowels({ A: 0, I: 0, U: 0, E: 0, O: 0 });
			return;
		}

		setActiveManualVowel(vowel);

		const targetVowel = vowel === 'MouthOpen' ? 'A' : vowel;
		cancelGestureRef.current = vnyanClient.playVowelGesture(targetVowel, 600);

		manualTimerRef.current = setTimeout(() => {
			setActiveManualVowel(null);
			cancelGestureRef.current = null;
		}, 620);
	};

	const is3D = software === 'vrm' || software === 'vnyan' || software === 'vseeface';
	const currentVoiceObj = EDGE_VOICE_PRESETS.find((v) => v.id === selectedVoice);

	return (
		<Card className='rounded-xl border-border/60 bg-card'>
			<CardHeader>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-3'>
						<div className='rounded-lg bg-primary/10 p-2.5 text-primary'>
							<FiMusic className='size-5' />
						</div>
						<div>
							<div className='flex items-center gap-2'>
								<CardTitle className='font-display font-semibold text-base text-foreground'>
									Prueba de Lip Sync
								</CardTitle>
								<Badge
									variant='outline'
									className={
										connected
											? 'rounded-md border-emerald-500/30 bg-emerald-500/10 font-mono text-[10px] text-emerald-400'
											: 'rounded-md border-border/70 font-mono text-[10px] text-muted-foreground'
									}
								>
									{connected ? 'Conectado' : 'Desconectado'}
								</Badge>
							</div>
							<CardDescription className='font-sans text-muted-foreground text-xs'>
								Voz en tiempo real con Microsoft Edge TTS y FFT a 60 FPS
							</CardDescription>
						</div>
					</div>
				</div>
			</CardHeader>

			<CardContent className='space-y-4'>
				{/* Selector de Voz Edge TTS */}
				<div className='space-y-1.5 rounded-xl border border-border/60 bg-background/50 p-2.5'>
					<div className='flex items-center justify-between text-xs'>
						<label
							htmlFor='edge-voice-selector'
							className='flex items-center gap-1.5 font-medium text-foreground text-xs'
						>
							<FiMic className='size-3.5 text-primary' /> Voz Edge TTS
						</label>
						<span className='font-mono text-[10px] text-muted-foreground'>
							{currentVoiceObj?.lang || 'es-ES'}
						</span>
					</div>

					<div className='relative w-full'>
						<select
							id='edge-voice-selector'
							value={selectedVoice}
							onChange={(e) => handleVoiceChange(e.target.value)}
							disabled={isProcessing || isPlaying}
							className='h-9 w-full cursor-pointer appearance-none rounded-lg border border-border/70 bg-card pr-8 pl-2.5 font-medium text-foreground text-xs outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50'
						>
							{EDGE_VOICE_PRESETS.map((voice) => (
								<option key={voice.id} value={voice.id} className='bg-background text-foreground'>
									{voice.name} ({voice.gender === 'female' ? 'Mujer' : 'Hombre'})
								</option>
							))}
						</select>
						<FiChevronDown className='-translate-y-1/2 pointer-events-none absolute top-1/2 right-2.5 size-4 text-muted-foreground' />
					</div>
				</div>

				{/* Estado de reproducción en tiempo real */}
				{isPlaying && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						className='flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 p-3'
					>
						<div className='flex items-center gap-2 font-medium text-primary text-xs'>
							<span className='flex gap-1'>
								<span className='size-1.5 animate-bounce rounded-full bg-primary' />
								<span className='size-1.5 animate-bounce rounded-full bg-primary [animation-delay:0.15s]' />
								<span className='size-1.5 animate-bounce rounded-full bg-primary [animation-delay:0.3s]' />
							</span>
							Transmitiendo Lip Sync a{' '}
							{software === 'vrm' ? 'Avatar 3D (WebGL)' : is3D ? 'VNyan (WS)' : 'VTube Studio'}...
						</div>
						<Button
							variant='destructive'
							size='sm'
							onClick={handleStop}
							className='h-7 gap-1 rounded-md px-2.5 text-xs'
						>
							<FiSquare className='size-3' /> Detener
						</Button>
					</motion.div>
				)}

				{/* Botones principales de prueba */}
				<div className='flex flex-col gap-2 sm:flex-row'>
					<Button
						onClick={handleTestVowels}
						disabled={isProcessing}
						className='h-9 flex-1 gap-2 rounded-lg font-sans font-semibold text-xs shadow-xs'
					>
						<FiPlay className='size-3.5 text-emerald-300' />
						<span className='truncate'>Vocales continuas</span>
					</Button>

					<Button
						onClick={handleTestSentence}
						disabled={isProcessing}
						variant='outline'
						className='h-9 flex-1 gap-2 rounded-lg border-border font-sans font-semibold text-xs'
					>
						<FiVolume2 className='size-3.5 text-primary' />
						<span className='truncate'>Frase de prueba</span>
					</Button>
				</div>

				{/* Entrada para frase personalizada */}
				<div className='space-y-1.5 border-border/40 border-t pt-3'>
					<label
						htmlFor='test-phrase-input'
						className='flex items-center gap-1.5 font-medium text-muted-foreground text-xs'
					>
						<FiMessageSquare className='size-3.5' /> Texto personalizado para hablar
					</label>

					<div className='flex items-center gap-2'>
						<Input
							id='test-phrase-input'
							type='text'
							value={customText}
							onChange={(e) => setCustomText(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									void handleTestSentence();
								}
							}}
							placeholder='Escribe cualquier texto...'
							className='h-9 min-w-0 flex-1 rounded-lg border-border/80 font-sans text-xs'
						/>
						<Button
							size='sm'
							variant='outline'
							onClick={handleTestSentence}
							disabled={isProcessing || !customText.trim()}
							className='h-9 shrink-0 gap-1.5 rounded-lg border-border font-sans text-xs'
						>
							<FiActivity className='size-3.5 text-primary' />
							<span>Hablar</span>
						</Button>
					</div>
				</div>

				{/* Prueba de formas de vocales manuales directas (solo 3D VRM / VNyan) */}
				{is3D && (
					<div className='space-y-1.5 border-border/40 border-t pt-3'>
						<div className='flex items-center justify-between text-muted-foreground text-xs'>
							<span className='flex items-center gap-1 font-medium text-foreground'>
								<FiZap className='size-3.5 text-amber-400' /> Disparar Vocal Directa
							</span>
							<span className='font-mono text-[10px] text-muted-foreground'>
								Gesto en modelo (sin audio)
							</span>
						</div>

						<div className='grid grid-cols-5 gap-1.5'>
							{(['A', 'E', 'I', 'O', 'U'] as const).map((vowel) => (
								<Button
									key={vowel}
									size='sm'
									variant={activeManualVowel === vowel ? 'default' : 'outline'}
									onClick={() => handleManualVowel(vowel)}
									className={`h-9 rounded-lg font-bold font-mono text-xs transition-colors ${
										activeManualVowel === vowel
											? 'border-primary bg-primary text-primary-foreground shadow-xs'
											: 'border-border/60 hover:border-primary/50'
									}`}
								>
									{vowel}
								</Button>
							))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

export default LipSyncTest;
