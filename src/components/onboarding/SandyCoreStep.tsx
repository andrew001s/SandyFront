'use client';

import { saveSettings } from '@/api/settings';
import { OnboardingStepFrame } from '@/components/onboarding/OnboardingStepFrame';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
	type SandyCoreConfig,
	downloadSandyCoreTemplate,
	normalizeSandyCoreConfig,
	toSandyCorePayload,
} from '@/lib/sandycore-config';
import type { StepProps, SandyOnboardingContext } from '@/components/onboarding/onboarding.types';
import { useAuth } from '@clerk/nextjs';
import { useOnboarding } from '@onboardjs/react';
import { motion } from 'framer-motion';
import { CheckCircle2, Download, FileJson, Sparkles } from 'lucide-react';
import { useCallback, useRef, useState, type DragEvent } from 'react';
import { toast } from 'sonner';

export function SandyCoreStep({ payload }: StepProps) {
	const { state, updateContext } = useOnboarding<SandyOnboardingContext>();
	const { getToken } = useAuth();
	const [config, setConfig] = useState<SandyCoreConfig>(
		state?.context.flowData.sandyCoreConfig ?? normalizeSandyCoreConfig({}),
	);
	const [isDragging, setIsDragging] = useState(false);
	const [fileName, setFileName] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const persistConfig = useCallback(
		async (nextConfig: SandyCoreConfig) => {
			void updateContext({
				flowData: {
					...state?.context.flowData,
					sandyCoreConfig: nextConfig,
				},
			});

			try {
				const token = await getToken();
				await saveSettings(toSandyCorePayload(nextConfig), { token });
			} catch (error) {
				console.error('Error guardando la personalidad de la VTuber:', error);
				toast.error('No se pudo guardar la personalidad de la VTuber');
			}
		},
		[getToken, state?.context.flowData, updateContext],
	);

	const applyConfig = useCallback(
		(parsed: unknown, name?: string) => {
			try {
				const nextConfig = normalizeSandyCoreConfig(parsed);
				setConfig(nextConfig);
				setFileName(name ?? null);
				void persistConfig(nextConfig);
				toast.success('Personalidad cargada correctamente');
			} catch {
				toast.error('El archivo no contiene un JSON válido');
			}
		},
		[persistConfig],
	);

	const handleFile = useCallback(
		(file: File) => {
			const reader = new FileReader();
			reader.onload = () => {
				try {
					const parsed: unknown = JSON.parse(String(reader.result));
					applyConfig(parsed, file.name);
				} catch {
					toast.error('El archivo no contiene un JSON válido');
				}
			};
			reader.readAsText(file);
		},
		[applyConfig],
	);

	const handleDrop = useCallback(
		(event: DragEvent<HTMLButtonElement>) => {
			event.preventDefault();
			setIsDragging(false);
			const file = event.dataTransfer.files?.[0];
			if (file) {
				handleFile(file);
			}
		},
		[handleFile],
	);

	const personaName = config.persona_profile?.name ?? 'Sin personalidad cargada';
	const hasConfig = Boolean(config.persona_profile);

	return (
		<OnboardingStepFrame title={payload.title} description={payload.description}>
			<motion.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
			>
				<Card className='overflow-hidden border-border/60 bg-card/80 shadow-[0_20px_60px_rgba(0,0,0,0.10)] backdrop-blur-sm'>
					<div className='border-border/60 border-b p-5 sm:p-6'>
						<div className='flex items-start gap-4'>
							<div className='flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-background/80 text-violet-600 shadow-sm'>
								<Sparkles className='size-5' />
							</div>
							<div className='space-y-1'>
								<p className='font-semibold text-muted-foreground text-sm uppercase tracking-[0.18em]'>
									Personalidad VTuber
								</p>
								<h3 className='font-semibold text-xl'>Descarga y carga tu JSON</h3>
								<p className='max-w-2xl text-muted-foreground text-sm leading-relaxed'>
									Usa la plantilla para definir cómo habla, responde y se comporta Sandy. Si ya
									tienes un archivo listo, súbelo aquí mismo para dejarlo guardado en tu onboarding.
								</p>
							</div>
						</div>
					</div>

					<div className='space-y-5 p-5 sm:p-6'>
						<div className='grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center'>
							<div className='rounded-2xl border border-border/60 bg-background/60 p-4'>
								<div className='flex items-center gap-2 font-semibold text-muted-foreground text-xs uppercase tracking-[0.2em]'>
									<FileJson className='size-4 text-violet-600 dark:text-[#A78BFA]' />
									Estado actual
								</div>
								<p className='mt-2 font-medium text-lg'>{personaName}</p>
								<p className='text-muted-foreground text-sm'>
									{hasConfig
										? 'La personalidad está lista y se guardará al avanzar.'
										: 'Todavía no cargaste un JSON; puedes descargar la plantilla y completarla.'}
								</p>
							</div>

							<Button
								type='button'
								variant='outline'
								onClick={downloadSandyCoreTemplate}
								className='h-11 rounded-2xl px-4'
							>
								<Download className='size-4' />
								Descargar plantilla
							</Button>
						</div>

						<button
							type='button'
							onClick={() => fileInputRef.current?.click()}
							onDragOver={(event) => {
								event.preventDefault();
								setIsDragging(true);
							}}
							onDragLeave={() => setIsDragging(false)}
							onDrop={handleDrop}
							className={`flex min-h-40 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center outline-none transition-all focus-visible:ring-2 focus-visible:ring-violet-500/50 ${
								isDragging
									? 'border-violet-500 bg-violet-500/10'
									: 'border-border/60 bg-background/60 hover:border-violet-500/50 hover:bg-violet-500/5'
							}`}
						>
							<div className='flex size-14 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-[#A78BFA]'>
								<FileJson className='size-7' />
							</div>
							<div>
								<p className='font-medium'>
									{fileName ? `Archivo cargado: ${fileName}` : 'Arrastra tu archivo JSON aquí'}
								</p>
								<p className='text-muted-foreground text-sm'>
									{fileName
										? 'Suéltalo para reemplazar la personalidad actual'
										: 'o haz clic para seleccionarlo'}
								</p>
							</div>
							{hasConfig && !fileName ? (
								<div className='flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-600 text-xs dark:text-emerald-400'>
									<CheckCircle2 className='size-3.5' />
									Usando la configuración cargada
								</div>
							) : null}
						</button>

						<input
							ref={fileInputRef}
							type='file'
							accept='.json,application/json'
							className='hidden'
							onChange={(event) => {
								const file = event.target.files?.[0];
								if (file) {
									handleFile(file);
								}
								event.target.value = '';
							}}
						/>

						<p className='text-muted-foreground text-sm leading-relaxed'>
							Carga un archivo con la personalidad, los prompts y las flags de la VTuber. Si más
							tarde quieres cambiarlo, podrás volver a este paso o a Ajustes sin perder el resto del
							onboarding.
						</p>
					</div>
				</Card>
			</motion.div>
		</OnboardingStepFrame>
	);
}
