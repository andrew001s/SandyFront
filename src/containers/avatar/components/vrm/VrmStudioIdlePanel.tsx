'use client';

import { Button } from '@/components/ui/button';
import { DEFAULT_VRM_IDLE_SETTINGS, type VrmIdleSettings } from '@/lib/avatar/vrmIdle';
import { vrmManager } from '@/lib/avatar/vrmManager';
import { RotateCcw, Wind, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
	onClose: () => void;
}

export function VrmStudioIdlePanel({ onClose }: Props) {
	const [settings, setSettings] = useState<VrmIdleSettings>(() => vrmManager.getIdleSettings());

	useEffect(() => {
		return vrmManager.subscribe(() => setSettings(vrmManager.getIdleSettings()));
	}, []);

	const update = (patch: Partial<VrmIdleSettings>) => {
		const next = { ...settings, ...patch };
		setSettings(next);
		vrmManager.setIdleSettings(patch);
	};

	const reset = () => {
		setSettings({ ...DEFAULT_VRM_IDLE_SETTINGS });
		vrmManager.setIdleSettings(DEFAULT_VRM_IDLE_SETTINGS);
	};

	const rangeControl = (
		key: 'breathAmount' | 'swayAmount' | 'speed',
		label: string,
		value: number,
		min: number,
		max: number,
		step: number,
		format: (value: number) => string,
	) => (
		<label className='block space-y-1.5'>
			<span className='flex items-center justify-between gap-3 text-xs'>
				<span className='font-medium text-foreground'>{label}</span>
				<output className='font-mono text-muted-foreground tabular-nums'>{format(value)}</output>
			</span>
			<input
				aria-label={label}
				className='h-1.5 w-full cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-40'
				disabled={!settings.enabled}
				max={max}
				min={min}
				onChange={(event) =>
					update({ [key]: Number(event.target.value) } as Partial<VrmIdleSettings>)
				}
				step={step}
				type='range'
				value={value}
			/>
		</label>
	);

	return (
		<section
			aria-label='Configuración del idle del avatar'
			className='w-80 max-w-[calc(100vw-3rem)] space-y-3 rounded-xl border border-border/80 bg-background/95 p-3.5 text-foreground shadow-xl backdrop-blur-md sm:w-88'
		>
			<header className='flex items-center justify-between border-border/60 border-b pb-2.5'>
				<div className='flex items-center gap-2'>
					<Wind aria-hidden='true' className='size-4 text-primary' />
					<div>
						<h2 className='font-bold font-display text-sm'>Idle del avatar</h2>
						<p className='text-[11px] text-muted-foreground'>Respiración y balanceo suave</p>
					</div>
				</div>
				<div className='flex items-center gap-1'>
					<Button
						aria-label='Restaurar valores iniciales del idle'
						onClick={reset}
						size='icon'
						title='Restaurar valores iniciales'
						variant='ghost'
					>
						<RotateCcw className='size-3.5' />
					</Button>
					<Button aria-label='Cerrar ajustes de idle' onClick={onClose} size='icon' variant='ghost'>
						<X className='size-3.5' />
					</Button>
				</div>
			</header>

			<label className='flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2'>
				<span>
					<span className='block font-medium text-xs'>Animación idle</span>
					<span className='block text-[11px] text-muted-foreground'>
						{settings.enabled ? 'Activa en el modelo VRM' : 'Pausada'}
					</span>
				</span>
				<input
					aria-label='Activar animación idle'
					checked={settings.enabled}
					className='size-4 accent-primary focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2'
					onChange={(event) => update({ enabled: event.target.checked })}
					type='checkbox'
				/>
			</label>

			<div className='space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3'>
				{rangeControl(
					'breathAmount',
					'Respiración',
					settings.breathAmount,
					0,
					2,
					0.05,
					(v) => `${Math.round(v * 100)}%`,
				)}
				{rangeControl(
					'swayAmount',
					'Balanceo',
					settings.swayAmount,
					0,
					2,
					0.05,
					(v) => `${Math.round(v * 100)}%`,
				)}
				{rangeControl(
					'speed',
					'Velocidad',
					settings.speed,
					0.25,
					2,
					0.05,
					(v) => `${v.toFixed(2)}×`,
				)}
			</div>
		</section>
	);
}
