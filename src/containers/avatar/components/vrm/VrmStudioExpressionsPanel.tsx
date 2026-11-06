'use client';
import { Button } from '@/components/ui/button';
import { useVrmActiveExpressions, useVrmExpressions } from '@/hooks/useVrmExpressions';
import { VRM_EMOTIONS } from '@/lib/avatar/constants';
import { vrmManager } from '@/lib/avatar/vrmManager';
import { RotateCcw, Smile, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { ExpressionHotkey, ExpressionHotkeyStatus } from '../common/ExpressionHotkey';
interface Props {
	onClose: () => void;
}
export function VrmStudioExpressionsPanel({ onClose }: Props) {
	const available = useVrmExpressions();
	const expressions = available.map((id) => ({
		id,
		name: VRM_EMOTIONS.find((preset) => preset.id === id)?.name ?? id,
	}));
	const activeExpressions = useVrmActiveExpressions();
	const [intensity, setIntensity] = useState<number>(1.0);
	const handleIntensityChange = (val: number) => {
		setIntensity(val);
		vrmManager.setEmotions(activeExpressions, val);
	};
	const handleReset = () => vrmManager.resetEmotions();
	return (
		<div className='flex w-full max-w-[calc(100vw-1.5rem)] flex-col gap-3 rounded-2xl border border-border/80 bg-background p-3.5 shadow-lg md:w-88'>
			{/* Encabezado */}
			<div className='flex items-center justify-between border-border/60 border-b pb-2.5'>
				<div className='flex items-center gap-2'>
					<div className='rounded-lg bg-secondary/20 p-1.5 text-secondary'>
						<Smile className='size-4' />
					</div>
					<div>
						<h3 className='font-bold font-display text-foreground text-sm tracking-tight'>
							Expresiones y Emociones
						</h3>
						<p className='text-[10px] text-muted-foreground'>Control gestual en vivo</p>
					</div>
				</div>
				<div className='flex items-center gap-1'>
					<Button
						variant='ghost'
						size='icon'
						onClick={handleReset}
						disabled={activeExpressions.length === 0}
						className='size-7 text-muted-foreground hover:bg-muted hover:text-foreground'
						title='Restablecer a Neutral'
					>
						<RotateCcw className='size-3.5' />
					</Button>
					<Button
						variant='ghost'
						size='icon'
						onClick={onClose}
						aria-label='Cerrar expresiones'
						className='size-7 text-muted-foreground hover:bg-muted hover:text-foreground'
					>
						<X className='size-3.5' />
					</Button>
				</div>
			</div>
			{/* Control de Intensidad */}
			<div className='space-y-1.5 rounded-xl border border-border/60 bg-muted/30 p-2.5'>
				<div className='flex items-center justify-between text-xs'>
					<span className='flex items-center gap-1 font-medium text-foreground text-xs'>
						<Sparkles className='size-3 text-secondary' /> Intensidad
					</span>
					<span className='font-mono font-semibold text-secondary text-xs'>
						{Math.round(intensity * 100)}%
					</span>
				</div>
				<div className='flex items-center gap-2'>
					<input
						type='range'
						min='0.1'
						max='1.0'
						step='0.05'
						value={intensity}
						onChange={(e) => handleIntensityChange(Number(e.target.value))}
						className='h-1.5 flex-1 cursor-pointer rounded-lg bg-muted accent-secondary'
					/>
					<div className='flex items-center gap-1'>
						{[0.5, 0.8, 1.0].map((presetVal) => (
							<button
								key={presetVal}
								type='button'
								onClick={() => handleIntensityChange(presetVal)}
								className={`rounded px-1.5 py-0.5 font-mono text-[10px] transition-colors ${
									Math.abs(intensity - presetVal) < 0.04
										? 'bg-secondary/20 font-bold text-secondary'
										: 'text-muted-foreground hover:bg-muted hover:text-foreground'
								}`}
							>
								{Math.round(presetVal * 100)}%
							</button>
						))}
					</div>
				</div>
			</div>
			{/* Cuadrícula de Emociones */}
			{expressions.length === 0 && (
				<p className='text-muted-foreground text-sm'>
					Carga un modelo VRM para ver sus expresiones.
				</p>
			)}
			<div className='grid max-h-[260px] grid-cols-2 gap-1.5 overflow-y-auto pr-0.5 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar]:size-1'>
				{expressions.map((preset) => {
					const isCurrent = activeExpressions.includes(preset.id);
					const isNeutral = preset.id === 'neutral';
					return (
						<div key={preset.id} className='min-w-0'>
							<button
								role='switch'
								aria-checked={isCurrent}
								type='button'
								onClick={() => vrmManager.toggleExpression(preset.id)}
								className={`flex min-h-11 w-full items-center gap-2 rounded-lg border p-2 text-left transition-colors ${
									isCurrent
										? 'border-secondary/60 bg-secondary/15 text-foreground shadow-xs ring-1 ring-secondary/40'
										: isNeutral
											? 'border-border/60 bg-background/60 text-muted-foreground hover:border-border hover:text-foreground'
											: 'border-border/40 bg-card/40 text-foreground hover:border-secondary/40 hover:bg-card/80'
								}`}
							>
								<Smile aria-hidden='true' className='size-4 shrink-0' />
								<div className='min-w-0 flex-1 truncate'>
									<div className='truncate font-medium text-xs'>{preset.name}</div>
									<div className='truncate text-[10px] text-muted-foreground/80'>
										{isCurrent ? 'Activa · pulsa para apagar' : 'Apagada'}
									</div>
								</div>
							</button>
							<ExpressionHotkey scope='vrm' id={preset.id} label={preset.name} />
						</div>
					);
				})}
			</div>
			<ExpressionHotkeyStatus />
		</div>
	);
}
