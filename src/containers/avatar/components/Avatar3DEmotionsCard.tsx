'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VRM_EMOTIONS } from '@/lib/avatar/constants';
import { vseefaceClient } from '@/lib/avatar/vseefaceClient';
import type { VRMEmotionPreset } from '@/types/avatar';
import {
	ChevronDown,
	ChevronUp,
	Gauge,
	RefreshCw,
	SlidersHorizontal,
	Smile,
	Sparkles,
	Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
	connected: boolean;
	transitionDurationMs?: number;
	onUpdateTransitionDuration?: (ms: number) => void;
	onSetEmotion: (emotion: string, intensity: number, durationMs?: number) => Promise<void> | void;
	onResetEmotions: (durationMs?: number) => Promise<void> | void;
	onSetCustomBlendshape?: (name: string, value: number) => Promise<void> | void;
}

const TRANSITION_PRESETS = [
	{ label: 'Instantáneo', ms: 0, badge: '0 ms' },
	{ label: 'Ultra-rápido', ms: 20, badge: '20 ms' },
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
	onSetCustomBlendshape,
}: Props) {
	const [activeEmotion, setActiveEmotion] = useState<string>('neutral');
	const [intensity, setIntensity] = useState<number>(1.0);
	const [duration, setDuration] = useState<number>(transitionDurationMs);
	const [isTriggering, setIsTriggering] = useState<string | null>(null);

	// Blendshapes descubiertos pasivamente desde VSeeFace
	const [discoveredBlendshapes, setDiscoveredBlendshapes] = useState<string[]>([]);
	const [isScanning, setIsScanning] = useState(false);
	const [showCustomTools, setShowCustomTools] = useState(false);
	const [customShapeName, setCustomShapeName] = useState('');
	const [customShapeValue, setCustomShapeValue] = useState(1.0);

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
				await onResetEmotions(duration);
			} else {
				await onSetEmotion(preset.id, intensity, duration);
			}
		} finally {
			setIsTriggering(null);
		}
	};

	const handleScanBlendshapes = async () => {
		setIsScanning(true);
		try {
			const list = await vseefaceClient.fetchDiscoveredBlendshapes();
			setDiscoveredBlendshapes(list);
		} finally {
			setIsScanning(false);
		}
	};

	const handleApplyCustomShape = async (val: number) => {
		if (!customShapeName.trim() || !onSetCustomBlendshape) return;
		setCustomShapeValue(val);
		await onSetCustomBlendshape(customShapeName.trim(), val);
	};

	const getDurationLabel = (ms: number) => {
		if (ms === 0) return 'Inmediato (0 ms, sin interpolación)';
		if (ms <= 30) return 'Ultra-rápido reactivo (<= 30 ms)';
		if (ms <= 90) return 'Transición rápida y ágil';
		if (ms <= 180) return 'Transición fluida recomendada';
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
								Transmite las 15 expresiones estándar VRM (0.x y 1.0) con transición de alta
								velocidad
							</CardDescription>
						</div>
					</div>

					<div className='flex items-center gap-2'>
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
							<span className='font-mono font-semibold text-pink-400'>
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

				{/* Lista de las 15 Emociones VRM */}
				<div className='space-y-1.5'>
					<div className='flex items-center justify-between text-muted-foreground text-xs'>
						<span className='font-medium text-foreground/80'>
							Expresiones Estándar ({VRM_EMOTIONS.length})
						</span>
						<span className='text-[11px]'>VRM 0.x / 1.0 (Sin solapamiento)</span>
					</div>

					<div className='grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5'>
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
									title={preset.description}
									className={`flex h-auto min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-center transition-all ${
										isCurrent
											? 'border-primary/60 bg-primary/20 text-primary shadow-sm ring-1 ring-primary/40'
											: isNeutral
												? 'border-border/50 bg-background/50 text-foreground hover:border-border'
												: 'border-border/40 bg-card/30 text-foreground hover:border-primary/40 hover:bg-card/70'
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
				</div>

				{/* Herramientas Avanzadas: Descubrimiento de Blendshapes de VSeeFace & Shape Keys */}
				<div className='pt-1'>
					<button
						type='button'
						onClick={() => setShowCustomTools((prev) => !prev)}
						className='flex w-full items-center justify-between rounded-lg border border-border/30 bg-background/30 px-3 py-2 text-muted-foreground text-xs transition hover:text-foreground'
					>
						<span className='flex items-center gap-1.5 font-medium'>
							<SlidersHorizontal className='size-3.5 text-indigo-400' />
							Herramientas Avanzadas y Shape Keys Personalizados
						</span>
						{showCustomTools ? (
							<ChevronUp className='size-3.5' />
						) : (
							<ChevronDown className='size-3.5' />
						)}
					</button>

					{showCustomTools && (
						<div className='mt-2 space-y-3 rounded-xl border border-border/40 bg-background/40 p-3'>
							{/* Botón de Escanear VSeeFace VMC Out */}
							<div className='flex flex-wrap items-center justify-between gap-2'>
								<div className='text-xs'>
									<div className='font-medium text-foreground'>Escanear VSeeFace (VMC Out)</div>
									<div className='text-[11px] text-muted-foreground'>
										Detecta blendshapes o morph targets que VSeeFace esté emitiendo en el puerto
										39540
									</div>
								</div>

								<Button
									size='sm'
									variant='outline'
									onClick={handleScanBlendshapes}
									disabled={isScanning}
									className='h-7 gap-1 rounded-lg border-indigo-500/30 text-indigo-400 text-xs hover:bg-indigo-500/10'
								>
									<RefreshCw className={`size-3 ${isScanning ? 'animate-spin' : ''}`} />
									{isScanning ? 'Escaneando...' : 'Escanear'}
								</Button>
							</div>

							{discoveredBlendshapes.length > 0 ? (
								<div className='space-y-1.5'>
									<span className='text-[11px] text-muted-foreground'>
										Blendshapes detectados ({discoveredBlendshapes.length}):
									</span>
									<div className='flex max-h-24 flex-wrap gap-1.5 overflow-y-auto'>
										{discoveredBlendshapes.map((bs) => (
											<button
												key={bs}
												type='button'
												onClick={() => {
													setCustomShapeName(bs);
													void handleApplyCustomShape(1.0);
												}}
												className='rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 font-mono text-[11px] text-indigo-300 transition hover:bg-indigo-500/20'
											>
												{bs}
											</button>
										))}
									</div>
								</div>
							) : (
								<p className='text-[11px] text-muted-foreground/70'>
									Para autodescubrir blendshapes, habilita &quot;VMC Protocol receiver /
									sender&quot; en VSeeFace hacia el puerto 39540.
								</p>
							)}

							{/* Inyector Manual de Blendshape */}
							<div className='space-y-2 border-border/30 border-t pt-2'>
								<span className='font-medium text-foreground text-xs'>
									Inyector Directo de Blendshape / Morph Target
								</span>

								<div className='flex items-center gap-2'>
									<input
										type='text'
										placeholder='Ej: SandyLipOpen, Blink, Joy, Fcl_MTH_A...'
										value={customShapeName}
										onChange={(e) => setCustomShapeName(e.target.value)}
										className='h-8 flex-1 rounded-lg border border-border/50 bg-background/70 px-2.5 font-mono text-foreground text-xs focus:border-indigo-400 focus:outline-none'
									/>
									<Button
										size='sm'
										disabled={!connected || !customShapeName.trim()}
										onClick={() => handleApplyCustomShape(customShapeValue)}
										className='h-8 rounded-lg bg-indigo-600 px-3 text-xs hover:bg-indigo-500'
									>
										Aplicar
									</Button>
									<Button
										size='sm'
										variant='outline'
										disabled={!connected || !customShapeName.trim()}
										onClick={() => handleApplyCustomShape(0)}
										className='h-8 rounded-lg border-border/50 px-2.5 text-xs'
									>
										0.0
									</Button>
								</div>
							</div>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
