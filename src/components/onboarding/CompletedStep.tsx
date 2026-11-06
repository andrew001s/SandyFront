'use client';

import { Button } from '@/components/ui/button';
import { markOnboardingComplete } from '@/lib/onboarding/keys';
import { useAuth } from '@clerk/nextjs';
import { useOnboarding } from '@onboardjs/react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { OnboardingFireworks } from './OnboardingFireworks';
import { OnboardingStepFrame } from './OnboardingStepFrame';
import type { SandyOnboardingContext } from './onboarding.types';
import { onboardingReadiness } from './onboardingReadiness';
import { submitOnboardingSettings } from './onboardingSubmit';

export function CompletedStep() {
	const { state, goToStep } = useOnboarding<SandyOnboardingContext>();
	const { getToken, userId } = useAuth();
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const locked = useRef(false);
	const finish = async () => {
		if (locked.current) return;
		locked.current = true;
		setSaving(true);
		setError(null);
		try {
			await submitOnboardingSettings(state?.context.flowData ?? {}, await getToken(), true);
			markOnboardingComplete(userId);
			window.location.replace('/avatar');
		} catch {
			setError(
				'No se pudo guardar la configuración final. Sigues aquí para poder reintentar; todavía no marcamos el recorrido como completado.',
			);
		} finally {
			locked.current = false;
			setSaving(false);
		}
	};
	return (
		<div className='space-y-7'>
			<div className='-mx-5 -mt-5 sm:-mx-8 sm:-mt-8 relative overflow-hidden rounded-t-xl border-border border-b bg-background'>
				<OnboardingFireworks className='pointer-events-none absolute inset-0 z-10 opacity-90 motion-reduce:hidden' />
				<Image
					src='/onboarding/final.webp'
					alt='Sandy te felicita por llegar al final de la configuración'
					width={1672}
					height={941}
					priority
					sizes='(max-width: 768px) calc(100vw - 2rem), 720px'
					className='h-auto w-full object-contain'
				/>
			</div>
			<OnboardingStepFrame
				title='¡Felicidades! Sandy te espera en el estudio'
				description='Llegaste al final del recorrido. Revisa lo que preparaste y los detalles pendientes antes de entrar al estudio.'
			>
				<h2 className='font-semibold text-base'>Tu configuración, de un vistazo</h2>
				<dl className='divide-y divide-border'>
					{onboardingReadiness(state?.context.flowData ?? {}).map((row) => (
						<div key={row.step} className='flex items-start justify-between gap-3 py-3'>
							<div className='min-w-0'>
								<dt className='font-semibold text-sm'>{row.label}</dt>
								<dd className='mt-1 text-muted-foreground text-sm leading-relaxed'>{row.status}</dd>
							</div>
							<Button
								type='button'
								variant='ghost'
								disabled={saving}
								className='min-h-11 shrink-0'
								aria-label={`Revisar ${row.label}`}
								onClick={() => void goToStep(row.step)}
							>
								Revisar
							</Button>
						</div>
					))}
				</dl>
				<div className='border-border border-t pt-5 text-sm leading-relaxed'>
					<h2 className='font-semibold'>Tu siguiente paso</h2>
					<p className='mt-2 text-muted-foreground'>
						Abre la pestaña de tu avatar, carga el modelo y configura las expresiones que quieras
						usar. Cuando tengas IA y voz preparadas, inicia Servicio de emisión y prueba el
						micrófono del dock.
					</p>
					<p className='mt-2 text-muted-foreground'>
						Después puedes copiar Overlay OBS para añadir el avatar a tu escena. No iniciamos
						servicios al terminar esta guía.
					</p>
				</div>
				{error && (
					<p
						role='alert'
						className='rounded-lg border border-destructive/50 p-3 text-sm leading-relaxed'
					>
						{error}
					</p>
				)}
				<Button
					type='button'
					disabled={saving}
					className='min-h-11 w-full sm:w-auto'
					onClick={() => void finish()}
				>
					{saving ? 'Guardando configuración...' : 'Guardar y entrar al estudio'}
				</Button>
			</OnboardingStepFrame>
		</div>
	);
}
