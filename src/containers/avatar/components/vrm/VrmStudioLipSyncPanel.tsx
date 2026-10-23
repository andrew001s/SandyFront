'use client';

import { getVoiceEdge } from '@/api/fetchEdgeTts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AudioQueueManager } from '@/lib/audioQueueSingleton';
import {
	generateSpeechSentenceWav,
	generateVowelTestWav,
	playLipSyncTest,
	stopLipSyncTest,
} from '@/lib/avatar/testAudioGenerator';
import { vrmManager } from '@/lib/avatar/vrmManager';
import {
	DEFAULT_EDGE_VOICE,
	EDGE_VOICE_PRESETS,
	getStoredEdgeTtsConfig,
	storeEdgeTtsConfig,
} from '@/lib/tts-provider';
import { Activity, Mic, Play, Square, Volume2, X, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface Props {
	onClose: () => void;
}

export function VrmStudioLipSyncPanel({ onClose }: Props) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [activeManualVowel, setActiveManualVowel] = useState<string | null>(null);
	const [customText, setCustomText] = useState(
		'¡Hola! Sandy está hablando con lip-sync en tiempo real.',
	);
	const [selectedVoice, setSelectedVoice] = useState<string>(DEFAULT_EDGE_VOICE);
	const [isProcessing, setIsProcessing] = useState(false);
	const manualTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		const stored = getStoredEdgeTtsConfig();
		if (stored?.voice) {
			setSelectedVoice(stored.voice);
		}
	}, []);

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
		};
	}, []);

	const handleVoiceChange = (voiceId: string) => {
		setSelectedVoice(voiceId);
		storeEdgeTtsConfig({ voice: voiceId });
		const matched = EDGE_VOICE_PRESETS.find((v) => v.id === voiceId);
		toast.info(`Voz seleccionada: ${matched?.name || voiceId}`);
	};

	const handleTestVowels = async () => {
		try {
			setIsProcessing(true);
			stopLipSyncTest();

			toast.loading('Sintetizando vocales...', { id: 'vrm-lipsync' });
			let audioBlob: Blob;
			try {
				audioBlob = await getVoiceEdge('A, E, I, O, U.', {
					voice: selectedVoice,
					rate: '-10%',
				});
			} catch {
				audioBlob = generateVowelTestWav();
			}

			await playLipSyncTest(audioBlob);
			toast.success('Reproduciendo vocales A - E - I - O - U', { id: 'vrm-lipsync' });
		} catch {
			toast.error('Error al reproducir vocales', { id: 'vrm-lipsync' });
		} finally {
			setIsProcessing(false);
		}
	};

	const handleTestSentence = async () => {
		const phrase = customText.trim() || '¡Hola! Sandy está hablando con lip sync en tiempo real.';
		try {
			setIsProcessing(true);
			stopLipSyncTest();

			toast.loading('Generando voz con Edge TTS...', { id: 'vrm-lipsync' });
			let audioBlob: Blob;
			try {
				audioBlob = await getVoiceEdge(phrase, { voice: selectedVoice });
			} catch {
				audioBlob = generateSpeechSentenceWav(phrase);
			}

			await playLipSyncTest(audioBlob);
			toast.success('Reproduciendo voz con Lip Sync', { id: 'vrm-lipsync' });
		} catch {
			toast.error('Error al generar voz', { id: 'vrm-lipsync' });
		} finally {
			setIsProcessing(false);
		}
	};

	const handleStop = () => {
		stopLipSyncTest();
		setActiveManualVowel(null);
		vrmManager.setVowels({ A: 0, I: 0, U: 0, E: 0, O: 0 });
		toast.info('Audio detenido');
	};

	const handleManualVowel = (vowel: 'A' | 'E' | 'I' | 'O' | 'U') => {
		if (manualTimerRef.current) {
			clearTimeout(manualTimerRef.current);
			manualTimerRef.current = null;
		}

		setActiveManualVowel(vowel);
		const vMap: Record<string, number> = { A: 0, I: 0, U: 0, E: 0, O: 0 };
		vMap[vowel] = 1.0;
		vrmManager.setVowels(vMap);

		manualTimerRef.current = setTimeout(() => {
			setActiveManualVowel(null);
			vrmManager.setVowels({ A: 0, I: 0, U: 0, E: 0, O: 0 });
		}, 650);
	};

	const currentVoiceObj = EDGE_VOICE_PRESETS.find((v) => v.id === selectedVoice);

	return (
		<div className='flex w-84 max-w-[calc(100vw-3rem)] flex-col gap-3 rounded-2xl border border-border/80 bg-background/90 p-3.5 shadow-2xl backdrop-blur-xl sm:w-92'>
			{/* Encabezado */}
			<div className='flex items-center justify-between border-border/60 border-b pb-2.5'>
				<div className='flex items-center gap-2'>
					<div className='rounded-lg bg-primary/20 p-1.5 text-primary'>
						<Mic className='size-4' />
					</div>
					<div>
						<h3 className='font-bold font-display text-foreground text-sm tracking-tight'>
							Prueba de Lip Sync & Voz
						</h3>
						<p className='text-[10px] text-muted-foreground'>
							Sincronización labial 60 FPS con Edge TTS
						</p>
					</div>
				</div>

				<Button
					variant='ghost'
					size='icon'
					onClick={onClose}
					className='size-7 text-muted-foreground hover:bg-muted hover:text-foreground'
				>
					<X className='size-3.5' />
				</Button>
			</div>

			{/* Estado de reproducción en tiempo real */}
			{isPlaying && (
				<div className='flex items-center justify-between rounded-xl border border-primary/40 bg-primary/10 p-2 text-xs'>
					<div className='flex items-center gap-2 font-medium text-primary'>
						<span className='flex gap-1'>
							<span className='size-1.5 animate-bounce rounded-full bg-primary' />
							<span className='size-1.5 animate-bounce rounded-full bg-primary [animation-delay:0.15s]' />
							<span className='size-1.5 animate-bounce rounded-full bg-primary [animation-delay:0.3s]' />
						</span>
						<span>Voz activa a 60 FPS...</span>
					</div>
					<Button
						variant='destructive'
						size='sm'
						onClick={handleStop}
						className='h-6 gap-1 px-2 text-[11px]'
					>
						<Square className='size-2.5' /> Detener
					</Button>
				</div>
			)}

			{/* Selector de Voz */}
			<div className='space-y-1 rounded-xl border border-border/60 bg-muted/30 p-2'>
				<div className='flex items-center justify-between text-[11px]'>
					<span className='flex items-center gap-1 font-medium text-foreground'>
						<Volume2 className='size-3 text-primary' /> Voz Edge TTS
					</span>
					<span className='font-mono text-[10px] text-muted-foreground'>
						{currentVoiceObj?.lang || 'es-ES'}
					</span>
				</div>
				<select
					value={selectedVoice}
					onChange={(e) => handleVoiceChange(e.target.value)}
					disabled={isProcessing || isPlaying}
					className='h-8 w-full rounded-lg border border-border/70 bg-card px-2 font-medium text-foreground text-xs outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50'
				>
					{EDGE_VOICE_PRESETS.map((voice) => (
						<option key={voice.id} value={voice.id} className='bg-background text-foreground'>
							{voice.name} ({voice.gender === 'female' ? 'Mujer' : 'Hombre'})
						</option>
					))}
				</select>
			</div>

			{/* Frase y botón de hablar */}
			<div className='space-y-1.5'>
				<div className='flex items-center gap-1.5'>
					<Input
						type='text'
						value={customText}
						onChange={(e) => setCustomText(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') void handleTestSentence();
						}}
						placeholder='Texto para hablar...'
						className='h-8.5 text-xs'
					/>
					<Button
						size='sm'
						onClick={handleTestSentence}
						disabled={isProcessing || !customText.trim()}
						className='h-8.5 shrink-0 gap-1 px-3 text-xs shadow-xs'
					>
						<Activity className='size-3.5' /> Hablar
					</Button>
				</div>

				<div className='grid grid-cols-2 gap-1.5'>
					<Button
						size='sm'
						variant='outline'
						onClick={handleTestVowels}
						disabled={isProcessing}
						className='h-8 gap-1.5 text-xs'
					>
						<Play className='size-3 text-emerald-400' /> Vocales (A-E-I-O-U)
					</Button>
					<Button
						size='sm'
						variant='outline'
						onClick={handleStop}
						disabled={!isPlaying}
						className='h-8 gap-1.5 text-xs'
					>
						<Square className='size-3 text-destructive' /> Detener
					</Button>
				</div>
			</div>

			{/* Vocales Directas (Sin audio, prueba pura de blendshape) */}
			<div className='space-y-1 border-border/60 border-t pt-2'>
				<div className='flex items-center justify-between text-[11px]'>
					<span className='flex items-center gap-1 font-medium text-foreground'>
						<Zap className='size-3 text-amber-400' /> Gesto de Vocal Rápido
					</span>
					<span className='font-mono text-[10px] text-muted-foreground'>60 FPS</span>
				</div>
				<div className='grid grid-cols-5 gap-1'>
					{(['A', 'E', 'I', 'O', 'U'] as const).map((vowel) => (
						<button
							key={vowel}
							type='button'
							onClick={() => handleManualVowel(vowel)}
							className={`h-8 rounded-lg font-bold font-mono text-xs transition-colors ${
								activeManualVowel === vowel
									? 'bg-secondary text-secondary-foreground shadow-xs'
									: 'border border-border/60 bg-muted/30 text-foreground hover:border-secondary hover:bg-muted'
							}`}
						>
							{vowel}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
