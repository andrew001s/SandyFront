'use client';

import { getVoiceEdge } from '@/api/fetchEdgeTts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AudioQueueManager } from '@/lib/audioQueueSingleton';
import {
	generateSpeechSentenceWav,
	playLipSyncTest,
	stopLipSyncTest,
} from '@/lib/avatar/testAudioGenerator';
import { avatar2dManager } from '@/lib/avatar2d/avatar2dManager';
import {
	DEFAULT_EDGE_VOICE,
	EDGE_VOICE_PRESETS,
	getStoredEdgeTtsConfig,
	storeEdgeTtsConfig,
} from '@/lib/tts-provider';
import { motion } from 'framer-motion';
import { ChevronDown, Mic, Play, Square, Volume2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Props {
	onClose: () => void;
}

export function Avatar2dLipSyncPanel({ onClose }: Props) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [customText, setCustomText] = useState(
		'¡Hola! Sandy está hablando en vivo desde el navegador con su avatar 2D.',
	);
	const [selectedVoice, setSelectedVoice] = useState<string>(DEFAULT_EDGE_VOICE);
	const [isProcessing, setIsProcessing] = useState(false);

	useEffect(() => {
		const stored = getStoredEdgeTtsConfig();
		if (stored?.voice) {
			setSelectedVoice(stored.voice);
		}

		const queueManager = AudioQueueManager.getInstance();
		const unsubscribe = queueManager.subscribe((playing) => {
			setIsPlaying(playing);
		});
		return () => unsubscribe();
	}, []);

	const handleVoiceChange = (voiceId: string) => {
		setSelectedVoice(voiceId);
		storeEdgeTtsConfig({ voice: voiceId });
		toast.success(
			`Voz cambiada a: ${EDGE_VOICE_PRESETS.find((v) => v.id === voiceId)?.name || voiceId}`,
		);
	};

	const handleTestSentence = async () => {
		if (!customText.trim() || isProcessing) return;
		setIsProcessing(true);
		const toastId = toast.loading('Generando voz y activando avatar 2D...');

		try {
			let audioBlob: Blob;
			try {
				audioBlob = await getVoiceEdge(customText.trim(), {
					voice: selectedVoice,
				});
			} catch {
				audioBlob = generateSpeechSentenceWav(customText.trim());
			}

			await playLipSyncTest(audioBlob);
			toast.success('Reproduciendo voz reactiva en el avatar 2D', { id: toastId });
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Error al sintetizar voz Edge TTS';
			toast.error(msg, { id: toastId });
		} finally {
			setIsProcessing(false);
		}
	};

	const handleStop = () => {
		stopLipSyncTest();
		avatar2dManager.setSpeaking(false);
		setIsPlaying(false);
	};

	const currentVoiceObj = EDGE_VOICE_PRESETS.find((v) => v.id === selectedVoice);

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.96, x: 20 }}
			animate={{ opacity: 1, scale: 1, x: 0 }}
			exit={{ opacity: 0, scale: 0.96, x: 20 }}
			transition={{ duration: 0.2, ease: 'easeOut' }}
			className='pointer-events-auto absolute top-4 right-20 z-30 max-h-[calc(100%-2rem)] overflow-y-auto'
		>
			<div className='flex w-84 max-w-[calc(100vw-5rem)] flex-col gap-3 rounded-2xl border border-border/80 bg-background/90 p-3.5 shadow-2xl backdrop-blur-xl sm:w-92'>
				{/* Cabecera */}
				<div className='flex items-center justify-between border-border/60 border-b pb-2'>
					<div className='flex items-center gap-2'>
						<div className='flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary'>
							<Mic className='size-3.5' />
						</div>
						<span className='font-semibold text-foreground text-xs'>
							Prueba de Lip Sync 2D (Edge TTS)
						</span>
					</div>
					<Button
						variant='ghost'
						size='icon'
						onClick={onClose}
						className='size-6 text-muted-foreground hover:text-foreground'
					>
						<X className='size-3.5' />
					</Button>
				</div>

				{/* Estado de reproducción activo */}
				{isPlaying && (
					<div className='flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs'>
						<div className='flex items-center gap-2'>
							<span className='size-2 animate-ping rounded-full bg-emerald-400' />
							<span className='font-medium text-emerald-400'>Avatar 2D hablando en vivo</span>
						</div>
						<Button
							variant='ghost'
							size='sm'
							onClick={handleStop}
							className='h-6 gap-1 px-2 text-[11px] text-emerald-400 hover:bg-emerald-500/20'
						>
							<Square className='size-3 fill-emerald-400' /> Detener
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
					<div className='relative w-full'>
						<select
							value={selectedVoice}
							onChange={(e) => handleVoiceChange(e.target.value)}
							disabled={isProcessing || isPlaying}
							className='h-8 w-full cursor-pointer appearance-none rounded-lg border border-border/70 bg-card pr-8 pl-2.5 font-medium text-foreground text-xs outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50'
						>
							{EDGE_VOICE_PRESETS.map((voice) => (
								<option key={voice.id} value={voice.id} className='bg-background text-foreground'>
									{voice.name} ({voice.gender === 'female' ? 'Mujer' : 'Hombre'})
								</option>
							))}
						</select>
						<ChevronDown className='-translate-y-1/2 pointer-events-none absolute top-1/2 right-2.5 size-3.5 text-muted-foreground' />
					</div>
				</div>

				{/* Texto y botón de hablar */}
				<div className='space-y-1.5'>
					<div className='flex items-center gap-1.5'>
						<Input
							type='text'
							value={customText}
							onChange={(e) => setCustomText(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') void handleTestSentence();
							}}
							placeholder='Texto para hacer hablar al avatar 2D...'
							className='h-8.5 text-xs'
						/>
						<Button
							size='sm'
							onClick={handleTestSentence}
							disabled={isProcessing || !customText.trim()}
							className='h-8.5 shrink-0 gap-1 px-3 text-xs shadow-xs'
						>
							<Play className='size-3 fill-current' /> Hablar
						</Button>
					</div>
				</div>
			</div>
		</motion.div>
	);
}
