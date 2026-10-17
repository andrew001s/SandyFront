'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VRM_EMOTIONS } from '@/lib/avatar/constants';
import type { VRMEmotionPreset } from '@/types/avatar';
import { Gauge, Smile, Sparkles, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
	connected: boolean;
	transitionDurationMs?: number;
	onUpdateTransitionDuration?: (ms: number) => void;
	onSetEmotion: (emotion: string, intensity: number) => Promise<void> | void;
	onResetEmotions: () => Promise<void> | void;
}

const TRANSITION_PRESETS = [
	{ label: 'Instantáneo', ms: 0, badge: '0 ms' },
	{ label: 'Rápido', ms: 80, badge: '80 ms' },
	{ label: 'Fluido', ms: 130, badge: '130 ms' },
	{ label: 'Suave', ms: 250, badge: '250 ms' },
	{ label: 'Cinemático', ms: 400, badge: '400 ms' },
];

export function Avatar3DEmotionsCard({
	connected,
	transitionDurationMs = 120,
	onUpdateTransitionDuration,
	onSetEmotion,
	onResetEmotions,
}: Props) {
	const [activeEmotion, setActiveEmotion] = useState<string>('neutral');
	const [intensity, setIntensity] = useState<number>(1.0);
	const [duration, setDuration] = useState<number>(transitionDurationMs);
	const [isTriggering, setIsTriggering] = useState<string | null>(null);

	useEffect(() => {
		setDuration(transitionDurationMs);
	}, [transitionDurationMs]);

	const handleDurationChange = (ms: number) => {
		const val = Math.max(0, Math.min(600, Math.round(ms)));
		setDuration(val);
		onUpdateTransitionDuration?.(val);
	};

	const handleEmotionClick = async (preset: VRMEmotionPreset) => {
		if (!connected || isTriggering) return;
		setIsTriggering(preset.id);
		setActiveEmotion(preset.id);

		try {
			if (preset.id === 'neutral') {
				await onResetEmotions();
			} else {
				await onSetEmotion(preset.id, intensity);
			}
		} finally {
			setIsTriggering(null);
		}
	};

	const getDurationLabel = (ms: number) => {
		if (ms === 0) return 'Sin transición (cambio inmediato)';
		if (ms <= 90) return 'Transición muy rápida y reactiva';
		if (ms <= 180) return 'Transición fluida y natural (recomendado)';
		if (ms <= 300) return 'Transición suave y relajada';
		return 'Transición cinematográfica lenta';
	};

	return (
		<Card className='border-border/50 bg-card/50 backdrop-blur-sm'>
			<CardHeader className='pb-4'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-2'>
						<div className='rounded-lg bg-pink-500/10 p-2 text-pink-400'>
							<Smile className='size-5' />
						</div>
						<div>
							<CardTitle className='text-lg'>Emociones VRM 3D (VSeeFace)</CardTitle>
							<CardDescription className='text-xs'>
								Transmite expresiones estándar VRM (0.x y 1.0) con tiempo de transición configurable
							</CardDescription>
						</div>
					</div>

					<Badge
						variant='outline'
						className={
							connected
								? 'border-emerald-500/30 bg-emerald-500/10 font-mono text-emerald-400 text-xs'
								: 'text-muted-foreground text-xs'
						}
					>
						{connected ? `${duration} ms transición` : 'Desconectado'}
					</Badge>
				</div>
			</CardHeader>

			<CardContent className='space-y-4'>
				{/* Controles de Configuración: Intensidad y Tiempo de Transición */}
				<div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
					{/* Slider de Intensidad */}
					<div className='space-y-2 rounded-xl border border-border/40 bg-background/40 p-3'>
						<div className='flex items-center justify-between text-xs'>
							<span className='flex items-center gap-1.5 font-medium text-foreground'>
								<Sparkles className='size-3.5 text-pink-400' /> Intensidad
							</span>
							<span className='font-mono text-muted-foreground'>
								{Math.round(intensity * 100)}%
							</span>
						</div>
						<input
							type='range'
							min='0.1'
							max='1'
							step='0.05'
							value={intensity}
							onChange={(e) => setIntensity(Number(e.target.value))}
							disabled={!connected}
							className='h-2 w-full cursor-pointer rounded-lg bg-muted accent-pink-500 disabled:opacity-50'
						/>
						<div className='flex justify-between text-[11px] text-muted-foreground/70'>
							<span>Suave (10%)</span>
							<span>Máxima (100%)</span>
						</div>
					</div>

					{/* Slider de Tiempo de Transición */}
					<div className='space-y-2 rounded-xl border border-border/40 bg-background/40 p-3'>
						<div className='flex items-center justify-between text-xs'>
							<span className='flex items-center gap-1.5 font-medium text-foreground'>
								<Gauge className='size-3.5 text-cyan-400' /> Tiempo de Transición
							</span>
							<span className='font-mono font-semibold text-cyan-400'>{duration} ms</span>
						</div>
						<input
							type='range'
							min='0'
							max='500'
							step='10'
							value={duration}
							onChange={(e) => handleDurationChange(Number(e.target.value))}
							disabled={!connected}
							className='h-2 w-full cursor-pointer rounded-lg bg-muted accent-cyan-400 disabled:opacity-50'
						/>
						<div className='flex items-center justify-between text-[11px]'>
							<span className='truncate text-muted-foreground/70'>
								{getDurationLabel(duration)}
							</span>
						</div>
					</div>
				</div>

				{/* Presets Rápidos de Transición */}
				<div className='flex flex-wrap items-center gap-1.5 pt-0.5'>
					<span className='mr-1 flex items-center gap-1 font-medium text-muted-foreground text-xs'>
						<Zap className='size-3 text-amber-400' /> Velocidad:
					</span>
					{TRANSITION_PRESETS.map((p) => {
						const isActive = duration === p.ms;
						return (
							<Button
								key={p.ms}
								size='sm'
								variant={isActive ? 'secondary' : 'outline'}
								disabled={!connected}
								onClick={() => handleDurationChange(p.ms)}
								className={`h-6 rounded-lg px-2 text-[11px] ${
									isActive
										? 'border-cyan-500/40 bg-cyan-500/10 font-semibold text-cyan-400'
										: 'border-border/50 text-muted-foreground hover:border-cyan-500/30 hover:text-foreground'
								}`}
							>
								{p.label} ({p.badge})
							</Button>
						);
					})}
				</div>

				{/* Botones de Emociones */}
				<div className='grid grid-cols-2 gap-2.5 pt-1 sm:grid-cols-3 md:grid-cols-4'>
					{VRM_EMOTIONS.map((preset) => {
						const isCurrent = activeEmotion === preset.id;
						const isNeutral = preset.id === 'neutral';

						return (
							<Button
								key={preset.id}
								variant={isCurrent ? 'default' : 'outline'}
								size='sm'
								disabled={!connected}
								onClick={() => handleEmotionClick(preset)}
								className={`flex h-auto flex-col items-center gap-1 rounded-xl border px-3 py-2.5 text-center transition-all ${
									isCurrent
										? 'border-primary/50 bg-primary/15 text-primary shadow-sm ring-1 ring-primary/30'
										: isNeutral
											? 'border-border/50 bg-background/50 text-foreground hover:border-border'
											: 'border-border/40 bg-card/30 text-foreground hover:border-primary/30 hover:bg-card/60'
								}`}
							>
								<span className='text-lg leading-none'>{preset.emoji}</span>
								<div className='w-full truncate'>
									<div className='truncate font-medium text-xs'>{preset.name}</div>
								</div>
							</Button>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
