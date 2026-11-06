'use client';

import { Button } from '@/components/ui/button';
import { downloadSandyCoreTemplate, normalizeSandyCoreConfig } from '@/lib/sandycore-config';
import { FileJson, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { OnboardingStepFrame } from './OnboardingStepFrame';
import type { StepProps } from './onboarding.types';
import { useOnboardingDraft } from './useOnboardingDraft';

export function SandyCoreStep({ payload }: StepProps) {
	const { data, update } = useOnboardingDraft();
	const profile = data.personaProfile ?? data.sandyCoreConfig?.persona_profile;
	const input = useRef<HTMLInputElement>(null);
	const [error, setError] = useState<string | null>(null);
	const [fileName, setFileName] = useState<string | null>(null);
	const [reading, setReading] = useState(false);
	const [dragging, setDragging] = useState(false);
	const importFile = async (file: File) => {
		setError(null);
		setReading(true);
		try {
			const parsed: unknown = JSON.parse(await file.text());
			if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
				throw new Error('invalid');
			const config = normalizeSandyCoreConfig(parsed);
			if (
				!config.persona_profile ||
				(config.persona_profile.name !== undefined &&
					typeof config.persona_profile.name !== 'string')
			)
				throw new Error('invalid');
			const source = parsed as Record<string, unknown>;
			await update({
				personaProfile: config.persona_profile,
				sandyCoreConfig: {
					...data.sandyCoreConfig,
					...(source.feature_flags !== undefined ? { feature_flags: config.feature_flags } : {}),
					...(source.banned_content !== undefined ||
					source.custom_banned_words !== undefined ||
					source.custom_banned_symbols !== undefined ||
					source.custom_banned_links !== undefined
						? { banned_content: config.banned_content }
						: {}),
				},
			});
			setFileName(file.name);
		} catch {
			setError(
				'No pudimos cargar ese archivo. Comprueba que sea un JSON de personalidad válido o descarga la plantilla para empezar.',
			);
		} finally {
			setReading(false);
		}
	};
	return (
		<OnboardingStepFrame title={payload.title} description={payload.description}>
			<div className='flex flex-wrap items-center justify-between gap-4 border-border border-b pb-5'>
				<div className='min-w-0 space-y-1'>
					<p className='font-medium text-sm'>Personalidad actual</p>
					<p className='break-words font-semibold text-base'>
						{profile?.name || 'Sin personalidad cargada'}
					</p>
					<p className='text-muted-foreground text-sm leading-relaxed'>
						{profile
							? 'Puedes reemplazarla cargando otro archivo.'
							: 'Usa la plantilla para definir su nombre, su tono y sus reglas.'}
					</p>
				</div>
				<Button
					type='button'
					variant='outline'
					className='min-h-11'
					onClick={downloadSandyCoreTemplate}
				>
					<FileJson aria-hidden='true' className='size-4' />
					Descargar plantilla
				</Button>
			</div>
			<button
				type='button'
				disabled={reading}
				onClick={() => input.current?.click()}
				onDragOver={(event) => {
					event.preventDefault();
					setDragging(true);
				}}
				onDragLeave={() => setDragging(false)}
				onDrop={(event) => {
					event.preventDefault();
					setDragging(false);
					const file = event.dataTransfer.files[0];
					if (file && !reading) void importFile(file);
				}}
				className={`flex min-h-48 w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 disabled:opacity-60 ${dragging ? 'border-primary bg-primary/10' : 'border-border bg-background/50 hover:border-primary/60 hover:bg-muted/50'}`}
			>
				<Upload aria-hidden='true' className='size-6 text-primary' />
				<span className='font-semibold'>
					{reading ? 'Leyendo archivo...' : 'Arrastra tu archivo JSON aquí'}
				</span>
				<span className='text-muted-foreground text-sm'>o pulsa para seleccionarlo</span>
			</button>
			<input
				ref={input}
				type='file'
				accept='.json,application/json'
				aria-label='Archivo de personalidad JSON'
				className='hidden'
				onChange={(event) => {
					const file = event.target.files?.[0];
					event.target.value = '';
					if (file) void importFile(file);
				}}
			/>
			{fileName && (
				<p aria-live='polite' className='break-words text-muted-foreground text-sm'>
					Archivo incorporado al borrador: {fileName}. Se guardará al seguir.
				</p>
			)}
			{error && (
				<p role='alert' className='text-sm'>
					{error}
				</p>
			)}
			<p className='text-muted-foreground text-sm leading-relaxed'>
				La importación reemplaza la personalidad. Si el archivo incluye módulos o filtros, también
				se incorporan al guardar. Puedes decidir después y configurarlo desde Ajustes.
			</p>
		</OnboardingStepFrame>
	);
}
