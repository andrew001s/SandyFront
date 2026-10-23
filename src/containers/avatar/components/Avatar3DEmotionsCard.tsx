'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VRM_EMOTIONS } from '@/lib/avatar/constants';
import type { VRMEmotionPreset } from '@/types/avatar';
import { RotateCcw, Smile, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface Props {
	connected: boolean;
	onSetEmotion: (emotion: string, intensity: number) => Promise<void> | void;
	onResetEmotions: () => Promise<void> | void;
}

export function Avatar3DEmotionsCard({ connected, onSetEmotion, onResetEmotions }: Props) {
	const [activeEmotion, setActiveEmotion] = useState<string>('neutral');
	const [intensity, setIntensity] = useState<number>(1.0);
	const [isTriggering, setIsTriggering] = useState<string | null>(null);

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

	const handleReset = async () => {
		setActiveEmotion('neutral');
		await onResetEmotions();
	};

	return (
		<Card className='rounded-xl border-border/60 bg-card shadow-sm'>
			<CardHeader className='pb-3'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-3'>
						<div className='rounded-lg bg-primary/10 p-2.5 text-primary'>
							<Smile className='size-5' />
						</div>
						<div>
							<CardTitle className='font-display font-semibold text-base text-foreground'>
								Expresiones y Emociones
							</CardTitle>
							<CardDescription className='text-xs'>
								Activa gestos y expresiones faciales en tiempo real sobre el modelo 3D
							</CardDescription>
						</div>
					</div>

					<Button
						variant='ghost'
						size='sm'
						onClick={handleReset}
						disabled={!connected || activeEmotion === 'neutral'}
						className='h-7 gap-1 text-muted-foreground text-xs hover:text-foreground'
						title='Restablecer a expresión neutral'
					>
						<RotateCcw className='size-3' />
						<span>Neutral</span>
					</Button>
				</div>
			</CardHeader>

			<CardContent className='space-y-4'>
				{/* Control de Intensidad limpio con accesos rápidos */}
				<div className='space-y-2 rounded-xl border border-border/60 bg-background/50 p-3'>
					<div className='flex items-center justify-between text-xs'>
						<span className='flex items-center gap-1.5 font-medium text-foreground'>
							<Sparkles className='size-3.5 text-primary' /> Intensidad de la expresión
						</span>
						<span className='font-mono font-semibold text-primary text-xs'>
							{Math.round(intensity * 100)}%
						</span>
					</div>

					<div className='flex items-center gap-3'>
						<input
							type='range'
							min='0.1'
							max='1'
							step='0.05'
							value={intensity}
							onChange={(e) => {
								const val = Number(e.target.value);
								setIntensity(val);
								if (activeEmotion !== 'neutral') {
									void onSetEmotion(activeEmotion, val);
								}
							}}
							disabled={!connected}
							className='h-2 flex-1 cursor-pointer rounded-lg bg-muted accent-primary disabled:opacity-50'
						/>

						{/* Presets rápidos */}
						<div className='flex shrink-0 items-center gap-1'>
							{[0.5, 0.8, 1.0].map((presetVal) => (
								<button
									key={presetVal}
									type='button'
									disabled={!connected}
									onClick={() => {
										setIntensity(presetVal);
										if (activeEmotion !== 'neutral') {
											void onSetEmotion(activeEmotion, presetVal);
										}
									}}
									className={`rounded px-1.5 py-0.5 font-mono text-[10px] transition-colors ${
										Math.abs(intensity - presetVal) < 0.04
											? 'bg-primary/20 font-bold text-primary'
											: 'text-muted-foreground hover:bg-muted hover:text-foreground'
									}`}
								>
									{Math.round(presetVal * 100)}%
								</button>
							))}
						</div>
					</div>
				</div>

				{/* Cuadrícula de Botones de Emociones */}
				<div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
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
										? 'border-primary/50 bg-primary/15 text-primary shadow-xs ring-1 ring-primary/30'
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

export default Avatar3DEmotionsCard;
