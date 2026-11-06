'use client';

import { useExpressionHotkeysContext } from '@/context/ExpressionHotkeysContext';
import { expressionChord, formatExpressionChord } from '@/lib/avatar/expressionHotkeys';
import { useState } from 'react';

export function ExpressionHotkey({
	scope,
	id,
	label,
}: { scope: string; id: string; label: string }) {
	const context = useExpressionHotkeysContext();
	const [recording, setRecording] = useState(false);
	const [error, setError] = useState<string | null>(null);
	if (!context) return null;
	const chord = context.bindings[`${scope}:${id}`];
	return (
		<div className='min-w-0'>
			<button
				type='button'
				data-hotkey-recorder
				aria-label={`Atajo de ${label}`}
				aria-pressed={recording}
				disabled={context.status === 'loading'}
				onClick={() => {
					setRecording(true);
					setError(null);
				}}
				onBlur={() => setRecording(false)}
				onKeyDown={(event) => {
					if (!recording) return;
					event.stopPropagation();
					if (event.key === 'Tab') {
						setRecording(false);
						return;
					}
					event.preventDefault();
					if (event.key === 'Escape') {
						setRecording(false);
						return;
					}
					if (event.repeat) return;
					if (['Control', 'Meta', 'Alt', 'Shift'].includes(event.key)) return;
					const removing = ['Backspace', 'Delete'].includes(event.key);
					const value = removing ? null : expressionChord(event.nativeEvent);
					if (!removing && !value) {
						setError('Usa otra tecla o combinación.');
						return;
					}
					const failure = context.setBinding(scope, id, value);
					setError(failure);
					if (!failure) setRecording(false);
				}}
				className={`min-h-8 w-full rounded-md border px-2 text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50 ${recording ? 'border-primary bg-primary/10 text-primary' : 'border-transparent text-muted-foreground hover:border-border hover:bg-muted'}`}
			>
				{recording ? (
					'Pulsa una tecla…'
				) : chord ? (
					<kbd>{formatExpressionChord(chord)}</kbd>
				) : (
					'Asignar tecla'
				)}
			</button>
			{error && (
				<p role='alert' className='text-destructive text-xs'>
					{error}
				</p>
			)}
		</div>
	);
}

export function ExpressionHotkeyStatus() {
	const context = useExpressionHotkeysContext();
	if (!context) return null;
	return (
		<div className='border-border border-t pt-2 text-muted-foreground text-xs'>
			<p>
				Los atajos funcionan mientras el estudio tiene el foco. Para quitar uno, asígnalo y pulsa
				Suprimir.
			</p>
			<output className='mt-1 block'>
				{context.status === 'loading' ? (
					'Cargando atajos de tu cuenta…'
				) : context.status === 'saving' ? (
					'Guardando atajos…'
				) : context.status === 'error' ? (
					<>
						No se pudieron guardar o cargar los atajos.{' '}
						<button type='button' onClick={context.retry} className='underline underline-offset-2'>
							Reintentar
						</button>
					</>
				) : (
					'Atajos guardados en tu cuenta.'
				)}
			</output>
		</div>
	);
}
