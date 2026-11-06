'use client';

import { StarField } from '@/components/landing/StarField';
import { Button } from '@/components/ui/button';
import { markOnboardingDismissed } from '@/lib/onboarding/keys';
import { useAuth } from '@clerk/nextjs';
import { useOnboarding } from '@onboardjs/react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type SandyOnboardingContext, stepLabels, stepOrder } from './onboardingSteps';
import { submitOnboardingSettings } from './onboardingSubmit';
import { onboardingStepError } from './onboardingValidation';
import { OnboardingDraftProvider } from './useOnboardingDraft';

export function OnboardingShell() {
	return (
		<OnboardingDraftProvider>
			<OnboardingShellContent />
		</OnboardingDraftProvider>
	);
}

function OnboardingShellContent() {
	const { state, currentStep, loading, next, goToStep, renderStep } =
		useOnboarding<SandyOnboardingContext>();
	const { getToken, userId } = useAuth();
	const { resolvedTheme } = useTheme();
	const [isPersisting, setIsPersisting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const locked = useRef(false);
	const alertRef = useRef<HTMLDivElement>(null);
	const stepId = currentStep?.id;
	const stepIndex = Math.max(0, stepOrder.indexOf(stepId as (typeof stepOrder)[number]));
	const isCompleted = stepId === 'completed';
	const isWelcome = stepId === 'welcome';
	const busy = loading.isAnyLoading || isPersisting;
	const progress = Math.round(((stepIndex + 1) / stepOrder.length) * 100);

	useEffect(() => {
		setError(null);
		document.querySelector<HTMLElement>('[data-onboarding-title]')?.focus({ preventScroll: true });
		window.scrollTo(0, 0);
	}, [stepId]);
	useEffect(() => {
		if (error) alertRef.current?.focus();
	}, [error]);

	const save = useCallback(
		async (action: 'next' | 'later' | 'skip') => {
			if (locked.current || !state) return;
			const validation =
				action === 'next'
					? onboardingStepError(String(stepId), state.context.flowData ?? {})
					: null;
			if (validation) {
				setError(validation);
				return;
			}
			locked.current = true;
			setIsPersisting(true);
			setError(null);
			try {
				await submitOnboardingSettings(state.context.flowData ?? {}, await getToken());
				if (action === 'later') {
					markOnboardingDismissed(userId);
					window.location.assign('/avatar');
				} else await next();
			} catch {
				setError(
					'No se pudo guardar. Conservamos este paso para que reintentes. Revisa tu conexión y vuelve a pulsar la acción que querías realizar.',
				);
			} finally {
				locked.current = false;
				setIsPersisting(false);
			}
		},
		[state, stepId, getToken, userId, next],
	);

	if (!state || loading.isHydrating)
		return (
			<div
				aria-live='polite'
				className='flex min-h-dvh items-center justify-center bg-background px-6 text-muted-foreground'
			>
				Cargando tu configuración inicial...
			</div>
		);

	return (
		<div className='relative isolate min-h-dvh bg-background text-foreground'>
			<StarField
				count={64}
				seed={12}
				className='-z-10 pointer-events-none fixed inset-0 opacity-50'
			/>
			<header className='border-border border-b bg-background/85'>
				<div className='mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6'>
					<Image
						src={resolvedTheme === 'light' ? '/icons/sandyLight.png' : '/icons/sandyDark.png'}
						alt='Sandy Studio'
						width={120}
						height={40}
						priority
						className='h-auto w-24 shrink-0 sm:w-28'
					/>
					<Button
						type='button'
						variant='ghost'
						disabled={busy}
						onClick={() => void save('later')}
						className='min-h-11 whitespace-normal text-sm'
					>
						Guardar y salir
					</Button>
				</div>
			</header>
			<div className='mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10'>
				<div className='mb-5 space-y-3'>
					<div className='flex items-center justify-between gap-3 text-muted-foreground text-sm'>
						<p aria-live='polite'>
							Paso {stepIndex + 1} de {stepOrder.length}
						</p>
						<p>{stepLabels[stepId as keyof typeof stepLabels] ?? 'Configuración inicial'}</p>
					</div>
					<progress
						aria-label='Recorrido de configuración'
						max={100}
						value={progress}
						aria-valuetext={`Paso ${stepIndex + 1} de ${stepOrder.length}`}
						className='block h-1 w-full appearance-none overflow-hidden rounded-full [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary'
					/>
				</div>
				<section
					aria-label='Configuración inicial'
					className='rounded-xl border border-border bg-card'
				>
					<fieldset disabled={isPersisting} aria-busy={isPersisting} className='min-w-0 p-5 sm:p-8'>
						{renderStep()}
					</fieldset>
					{error && (
						<div
							ref={alertRef}
							role='alert'
							tabIndex={-1}
							className='mx-5 mb-5 rounded-lg border border-destructive/50 p-4 text-foreground text-sm leading-relaxed focus-visible:outline-2 focus-visible:outline-ring sm:mx-8'
						>
							{error}
						</div>
					)}
					{!isWelcome && !isCompleted && (
						<footer className='rounded-b-xl border-border border-t bg-card px-4 py-3 sm:px-6'>
							<div className='flex flex-wrap items-center justify-between gap-2'>
								<Button
									type='button'
									variant='ghost'
									disabled={!stepIndex || busy}
									className='min-h-11'
									onClick={() => {
										setError(null);
										void goToStep(stepOrder[stepIndex - 1]);
									}}
								>
									Atrás
								</Button>
								<div className='flex flex-wrap items-center gap-2'>
									<Button
										type='button'
										variant='ghost'
										disabled={busy}
										className='min-h-11 px-2 text-muted-foreground'
										onClick={() => void save('skip')}
									>
										Decidir después
									</Button>
									<Button
										type='button'
										disabled={busy}
										className='min-h-11'
										onClick={() => void save('next')}
									>
										{isPersisting ? 'Guardando...' : 'Guardar y seguir'}
									</Button>
								</div>
							</div>
							<p className='mt-2 text-muted-foreground text-xs leading-relaxed'>
								Tus cambios se guardan al seguir o salir. Las conexiones se actualizan al vincular
								tu cuenta.
							</p>
						</footer>
					)}
				</section>
			</div>
		</div>
	);
}
