'use client';

import { getVoiceSandy } from '@/api/fetchFishAudio';
import { Button } from '@/components/ui/button';
import { useCallback, useRef, useState } from 'react';
import { FiAlertCircle, FiSquare, FiVolume2 } from 'react-icons/fi';

interface Props {
	connected: boolean;
	injectParameters: (params: { id: string; value: number }[]) => Promise<void>;
}

export function LipSyncTest({ connected, injectParameters }: Props) {
	const [playing, setPlaying] = useState(false);
	const [testing, setTesting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const animRef = useRef<number | null>(null);
	const ctxRef = useRef<AudioContext | null>(null);
	const srcRef = useRef<AudioBufferSourceNode | null>(null);

	const stop = useCallback(() => {
		if (animRef.current !== null) cancelAnimationFrame(animRef.current);
		animRef.current = null;
		try {
			srcRef.current?.stop();
		} catch {}
		try {
			srcRef.current?.disconnect();
		} catch {}
		srcRef.current = null;
		ctxRef.current?.close();
		ctxRef.current = null;
		setPlaying(false);
		setTesting(false);
		injectParameters([{ id: 'SandyLipOpen', value: 0 }]);
	}, [injectParameters]);

	const runLipSync = useCallback(
		(audioBuffer: AudioBuffer, startTime: number) => {
			const sampleRate = audioBuffer.sampleRate;
			const channel = audioBuffer.getChannelData(0);
			const frameSize = Math.floor(sampleRate / 60);

			let mouthValue = 0;

			const tick = () => {
				const elapsed = performance.now() - startTime;
				const samplePos = Math.floor((elapsed / 1000) * sampleRate);

				if (samplePos >= channel.length) {
					stop();
					return;
				}

				let sumSq = 0;
				let zeroCrossings = 0;
				const start = samplePos;
				const end = Math.min(samplePos + frameSize, channel.length);
				const len = end - start;
				if (len > 0) {
					let prev = channel[start];
					for (let i = start; i < end; i++) {
						const sample = channel[i];
						sumSq += sample * sample;
						if (i > start && (sample >= 0) !== (prev >= 0)) {
							zeroCrossings += 1;
						}
						prev = sample;
					}
					const rms = Math.sqrt(sumSq / len);
					const rawVolume = Math.min(rms * 10, 1);
					const target = rawVolume > 0.01 ? Math.max(rawVolume, 0.15) : 0;
					const rawFrequency = Math.min((zeroCrossings / len) * 24, 1);
					mouthValue += (target - mouthValue) * 0.5;

					injectParameters([
						{ id: 'SandyLipOpen', value: mouthValue },
						{ id: 'SandyLipSmile', value: rawFrequency },
					]).catch((e) => console.warn('VTS inject fail:', e));
				} else {
					mouthValue *= 0.9;
					injectParameters([
						{ id: 'SandyLipOpen', value: mouthValue },
						{ id: 'SandyLipSmile', value: 0 },
					]).catch((e) => console.warn('VTS inject fail:', e));
				}

				animRef.current = requestAnimationFrame(tick);
			};

			animRef.current = requestAnimationFrame(tick);
		},
		[injectParameters, stop],
	);

	const play = useCallback(async () => {
		if (playing) return;
		setError(null);
		setPlaying(true);

		try {
			const blob = await getVoiceSandy('Hola, soy Sandy. Encantada de conocerte.');

			if (!blob || blob.size === 0) {
				throw new Error('Audio vacío desde Fish Audio');
			}

			const ctx = new AudioContext();
			if (ctx.state === 'suspended') await ctx.resume();
			ctxRef.current = ctx;

			const arrayBuffer = await blob.arrayBuffer();
			const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

			const source = ctx.createBufferSource();
			source.buffer = audioBuffer;
			source.connect(ctx.destination);
			source.start();
			srcRef.current = source;

			source.onended = () => stop();

			const startTime = performance.now();
			runLipSync(audioBuffer, startTime);
		} catch (err) {
			console.error('LipSync error:', err);
			setError(err instanceof Error ? err.message : 'Error al reproducir');
			stop();
		}
	}, [playing, runLipSync, stop]);

	const testMouth = useCallback(async () => {
		if (testing) return;
		setTesting(true);
		setError(null);
		try {
			// Abrir boca al máximo por 0.5s
			await injectParameters([{ id: 'SandyLipOpen', value: 1 }]);
			await new Promise((r) => setTimeout(r, 500));
			await injectParameters([{ id: 'SandyLipOpen', value: 0 }]);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error');
		}
		setTesting(false);
	}, [testing, injectParameters]);

	return (
		<div className='space-y-3 rounded-lg border border-border/50 bg-card/50 p-4 backdrop-blur-sm'>
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-2'>
					<FiVolume2 size={16} className='text-primary' />
					<span className='font-medium text-sm'>Prueba de Lip Sync</span>
				</div>
				{playing && (
					<span className='flex items-center gap-1.5 text-green-500 text-xs'>
						<span className='h-2 w-2 animate-pulse rounded-full bg-green-500' />
						Hablando
					</span>
				)}
			</div>
			<p className='text-muted-foreground text-xs'>
				Envía un audio de prueba a Fish Audio y anima la boca del modelo en VTube Studio.
			</p>
			{error && (
				<div className='flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-2'>
					<FiAlertCircle size={14} className='mt-0.5 shrink-0 text-destructive' />
					<p className='text-destructive text-xs'>{error}</p>
				</div>
			)}
			<div className='flex flex-wrap gap-2'>
				<Button size='sm' onClick={play} disabled={!connected || playing || testing}>
					{playing ? 'Reproduciendo…' : '▶ Probar con audio'}
				</Button>
				<Button
					size='sm'
					variant='outline'
					onClick={testMouth}
					disabled={!connected || testing || playing}
				>
					{testing ? 'Abriendo…' : '👄 Abrir boca (test)'}
				</Button>
				{playing && (
					<Button size='sm' variant='outline' onClick={stop}>
						<FiSquare size={14} className='mr-1' />
						Detener
					</Button>
				)}
			</div>
		</div>
	);
}
