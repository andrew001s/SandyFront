'use client';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { useExpressionHotkeysContext } from '@/context/ExpressionHotkeysContext';
import { useDraggableWindow } from '@/hooks/useDraggableWindow';
import { Settings2 } from 'lucide-react';
import { useId, useState } from 'react';
import { ExpressionHotkey, ExpressionHotkeyStatus } from './ExpressionHotkey';

export function ExpressionConfiguration({
	scope,
	id,
	label,
	supportsIntensity = false,
	onIntensityChange,
}: {
	scope: string;
	id: string;
	label: string;
	supportsIntensity?: boolean;
	onIntensityChange?: (value: number) => void;
}) {
	const preferences = useExpressionHotkeysContext();
	const window = useDraggableWindow();
	const intensityId = useId();
	const [open, setOpen] = useState(false);
	const [intensity, setIntensity] = useState(1);
	const [chord, setChord] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	if (!preferences) return null;
	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (next) {
					setIntensity(preferences.intensities[`${scope}:${id}`] ?? 1);
					setChord(preferences.bindings[`${scope}:${id}`] ?? null);
					setError(null);
					window.reset();
				}
				setOpen(next);
			}}
		>
			<DialogTrigger asChild>
				<button
					type='button'
					aria-label={`Configurar ${label}`}
					title={`Configurar ${label}`}
					disabled={!preferences.ready}
					className='flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-40'
				>
					<Settings2 className='size-4' />
				</button>
			</DialogTrigger>
			<DialogContent
				ref={window.dialogRef}
				style={window.style}
				overlayClassName='bg-black/20 backdrop-blur-none'
				onEscapeKeyDown={(event) => {
					if (document.activeElement?.matches('[data-hotkey-recorder][aria-pressed="true"]'))
						event.preventDefault();
				}}
				className='right-auto flex max-h-[calc(100dvh-2rem)] w-[min(24rem,calc(100vw-2rem))] translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden p-0 data-[state=closed]:animate-none data-[state=open]:animate-none'
			>
				<DialogHeader
					{...window.handleProps}
					tabIndex={0}
					role='toolbar'
					aria-label='Mover configuración: arrastra el encabezado o usa las flechas. Inicio la centra.'
					className='cursor-grab touch-none select-none border-border border-b px-5 py-4 pr-12 outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing'
				>
					<DialogTitle className='break-words'>{label}</DialogTitle>
					<DialogDescription>
						{supportsIntensity
							? 'Ajusta su intensidad y su atajo de teclado.'
							: 'Asigna un atajo a esta expresión.'}
					</DialogDescription>
				</DialogHeader>
				<div className='min-h-0 space-y-5 overflow-y-auto px-5 py-4 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]'>
					{supportsIntensity && (
						<div className='space-y-3'>
							<div className='flex items-center justify-between gap-3 text-sm'>
								<label htmlFor={intensityId} className='font-medium'>
									Intensidad
								</label>
								<output htmlFor={intensityId} className='font-mono tabular-nums'>
									{Math.round(intensity * 100)} %
								</output>
							</div>
							<input
								id={intensityId}
								type='range'
								min={0}
								max={1}
								step={0.05}
								value={intensity}
								onChange={(event) => setIntensity(Number(event.target.value))}
								className='h-2 w-full accent-primary'
							/>
						</div>
					)}
					<div className='space-y-2'>
						<p className='font-medium text-sm'>Atajo de teclado</p>
						<div className='rounded-lg border border-border p-1'>
							<ExpressionHotkey
								scope={scope}
								id={id}
								label={label}
								value={chord}
								onChange={setChord}
							/>
						</div>
						<p className='text-muted-foreground text-xs'>
							Pulsa para asignarlo. Suprimir lo elimina y Escape cancela la captura.
						</p>
					</div>
					{error && (
						<p role='alert' className='text-destructive text-sm'>
							{error}
						</p>
					)}
					<ExpressionHotkeyStatus showSaved={false} />
				</div>
				<DialogFooter className='shrink-0 flex-row justify-end border-border border-t px-5 py-4'>
					<Button type='button' variant='ghost' onClick={() => setOpen(false)}>
						Cancelar
					</Button>
					<Button
						type='button'
						disabled={!preferences.ready}
						onClick={() => {
							const failure = preferences.setExpressionConfig(
								scope,
								id,
								chord,
								supportsIntensity ? intensity : undefined,
							);
							if (failure) {
								setError(failure);
								return;
							}
							if (supportsIntensity) onIntensityChange?.(intensity);
							setOpen(false);
						}}
					>
						Guardar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
