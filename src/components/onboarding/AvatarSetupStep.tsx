'use client';

import { Check, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { OnboardingStepFrame } from './OnboardingStepFrame';
import type { OnboardingFlowData, StepProps } from './onboarding.types';
import { useOnboardingDraft } from './useOnboardingDraft';

const formats = [
	{
		id: 'pngtuber',
		label: 'PNGTuber',
		description:
			'Imágenes para reposo, habla y emociones. Es la opción más sencilla si ya tienes tus PNG.',
		image: '/onboarding/formats/sandy-pngtuber.png',
	},
	{
		id: 'live2d',
		label: 'Avatar 2D · Live2D',
		description: 'Un paquete de modelo Live2D con su archivo .model3.json, texturas y expresiones.',
		image: '/onboarding/formats/sandy-live2d.png',
	},
	{
		id: 'vrm',
		label: 'Avatar 3D · VRM',
		description:
			'Tu archivo .vrm. El estudio leerá las expresiones que tenga configuradas el modelo.',
		image: '/onboarding/formats/sandy-vrm.png',
	},
] as const;

export function AvatarSetupStep({ payload }: StepProps) {
	const { data, update } = useOnboardingDraft();
	return (
		<OnboardingStepFrame title={payload.title} description={payload.description}>
			<fieldset aria-label='Formato del avatar' className='grid gap-3 sm:grid-cols-3'>
				{formats.map((format) => (
					<button
						key={format.id}
						type='button'
						aria-label={format.label}
						aria-pressed={data.avatarMode === format.id}
						className={`flex min-w-0 items-center gap-3 overflow-hidden rounded-xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 sm:flex-col sm:items-stretch ${data.avatarMode === format.id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/50'}`}
						onClick={() =>
							void update({ avatarMode: format.id as OnboardingFlowData['avatarMode'] })
						}
					>
						<span className='relative block aspect-square w-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:aspect-[4/5] sm:w-full'>
							<Image
								src={format.image}
								alt={`Ejemplo ilustrado de Sandy como ${format.id === 'pngtuber' ? 'PNGTuber' : format.id === 'live2d' ? 'Live2D' : 'avatar VRM'}`}
								fill
								sizes='(min-width: 640px) 210px, 96px'
								className='object-contain'
							/>
						</span>
						<span className='min-w-0 flex-1'>
							<span className='flex items-start justify-between gap-2 font-semibold text-sm'>
								{format.label}
								{data.avatarMode === format.id && (
									<Check aria-hidden='true' className='size-4 shrink-0 text-primary' />
								)}
							</span>
							<span className='mt-2 block text-muted-foreground text-sm leading-relaxed'>
								{format.description}
							</span>
						</span>
					</button>
				))}
			</fieldset>
			<p className='text-muted-foreground text-sm leading-relaxed'>
				Las miniaturas son ejemplos ilustrativos de Sandy. Elegir un formato abrirá su pestaña en el
				estudio; allí cargarás tus imágenes o tu modelo. No inicia la emisión.
			</p>
			<details className='group border-border border-t pt-3'>
				<summary className='flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-md font-medium text-sm hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring'>
					<span>Qué puedes configurar después</span>
					<ChevronDown
						aria-hidden='true'
						className='size-4 shrink-0 text-muted-foreground group-open:rotate-180'
					/>
				</summary>
				<dl className='space-y-4 pt-3 text-sm leading-relaxed'>
					<div>
						<dt className='font-semibold'>Expresiones manuales</dt>
						<dd className='mt-1 text-muted-foreground'>
							Activa y desactiva expresiones desde Avatar. En su configuración asignas atajos y, en
							Live2D o VRM, intensidad individual. Los atajos funcionan mientras el estudio tiene el
							foco.
						</dd>
					</div>
					<div>
						<dt className='font-semibold'>Reacciones de IA</dt>
						<dd className='mt-1 text-muted-foreground'>
							Elige las emociones que la IA puede analizar y las expresiones que usará en cada una.
							Las emociones apagadas quedan fuera del análisis automático.
						</dd>
					</div>
					<div>
						<dt className='font-semibold'>Primera prueba y OBS</dt>
						<dd className='mt-1 text-muted-foreground'>
							Carga el avatar, inicia Servicio de emisión y usa el micrófono del dock para hablar
							con Sandy. Después copia Overlay OBS para llevarlo a tu escena. La prueba de voz y lip
							sync está en Opciones avanzadas.
						</dd>
					</div>
				</dl>
			</details>
		</OnboardingStepFrame>
	);
}
