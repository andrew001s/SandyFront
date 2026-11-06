'use client';
import { Button } from '@/components/ui/button';
import { useExpressionHotkeysContext } from '@/context/ExpressionHotkeysContext';
import {
	useVrmActiveExpressions,
	useVrmExpressionWeights,
	useVrmExpressions,
} from '@/hooks/useVrmExpressions';
import { VRM_EMOTIONS } from '@/lib/avatar/constants';
import { vrmManager } from '@/lib/avatar/vrmManager';
import { RotateCcw, X } from 'lucide-react';
import { ExpressionConfiguration } from '../common/ExpressionConfiguration';
import { ExpressionHotkeyStatus } from '../common/ExpressionHotkey';
interface Props {
	onClose: () => void;
}
export function VrmStudioExpressionsPanel({ onClose }: Props) {
	const available = useVrmExpressions();
	const active = useVrmActiveExpressions();
	const weights = useVrmExpressionWeights();
	const preferences = useExpressionHotkeysContext();
	return (
		<div className='flex w-full max-w-[calc(100vw-1.5rem)] flex-col gap-3 rounded-xl border border-border bg-background p-3.5 shadow-lg md:w-88'>
			<div className='flex items-center justify-between gap-3 border-border border-b pb-2'>
				<h3 className='font-display font-semibold text-sm'>Expresiones del modelo</h3>
				<div className='flex items-center gap-1'>
					<Button
						variant='ghost'
						size='icon'
						onClick={() => vrmManager.resetEmotions()}
						disabled={active.length === 0}
						aria-label='Apagar todas las expresiones'
						title='Apagar todas'
						className='size-8 text-muted-foreground'
					>
						<RotateCcw className='size-4' />
					</Button>
					<Button
						variant='ghost'
						size='icon'
						onClick={onClose}
						aria-label='Cerrar expresiones'
						className='size-8 text-muted-foreground'
					>
						<X className='size-4' />
					</Button>
				</div>
			</div>
			{available.length === 0 && (
				<p className='text-muted-foreground text-sm'>
					Carga un modelo VRM para ver sus expresiones.
				</p>
			)}
			<div className='max-h-[min(55dvh,28rem)] overflow-y-auto overscroll-contain [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]'>
				{available.map((id) => {
					const label = VRM_EMOTIONS.find((preset) => preset.id === id)?.name ?? id;
					const isActive = active.includes(id);
					const configuredIntensity = preferences?.intensities[`vrm:${id}`] ?? 1;
					return (
						<div
							key={id}
							className='flex items-center gap-2 border-border/60 border-b py-1 last:border-0'
						>
							<button
								type='button'
								role='switch'
								aria-checked={isActive}
								aria-label={label}
								onClick={() => vrmManager.toggleExpression(id, configuredIntensity)}
								className='flex min-h-11 min-w-0 flex-1 items-center justify-between gap-3 rounded-lg px-2 text-left hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring'
							>
								<span className='min-w-0'>
									<span className='block truncate font-medium text-sm'>{label}</span>
									<span className='block text-muted-foreground text-xs'>
										{isActive
											? `Activa · ${Math.round((weights[id] ?? configuredIntensity) * 100)} %`
											: 'Apagada'}
									</span>
								</span>
								<span
									aria-hidden='true'
									className={`inline-flex h-5 w-8 shrink-0 items-center rounded-full p-0.5 ${isActive ? 'bg-primary' : 'bg-muted-foreground/40'}`}
								>
									<span
										className={`size-4 rounded-full bg-white transition-transform ${isActive ? 'translate-x-3' : ''}`}
									/>
								</span>
							</button>
							<ExpressionConfiguration
								scope='vrm'
								id={id}
								label={label}
								supportsIntensity
								onIntensityChange={(value) => vrmManager.setExpressionIntensity(id, value)}
							/>
						</div>
					);
				})}
			</div>
			<ExpressionHotkeyStatus compact />
		</div>
	);
}
