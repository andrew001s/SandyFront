'use client';

import { StarField } from '@/components/landing/StarField';
import { Button } from '@/components/ui/button';
import { ONBOARDING_DISMISSED_KEY } from '@/lib/onboarding/keys';
import { AnimatePresence, motion } from 'framer-motion';
import { useOnboarding } from '@onboardjs/react';
import { ArrowLeft, ArrowRight, LogOut, SkipForward } from 'lucide-react';
import { useCallback } from 'react';
import { stepOrder, type SandyOnboardingContext } from './onboardingSteps';

export function OnboardingShell() {
	const { state, currentStep, loading, next, goToStep, skip, renderStep } =
		useOnboarding<SandyOnboardingContext>();

	const isFirst = state?.isFirstStep ?? true;
	const isLast = state?.isLastStep ?? false;
	const isHydrating = loading.isHydrating ?? loading.isAnyLoading;
	const isBusy = loading.isAnyLoading;
	const isWelcome = currentStep?.id === 'welcome';
	const isCompleted = currentStep?.id === 'completed';
	const hidePrimaryAction = isWelcome || isCompleted;
	const previousStepId = currentStep ? stepOrder[stepOrder.indexOf(currentStep.id as (typeof stepOrder)[number]) - 1] : null;

	const handleDismiss = useCallback(() => {
		try {
			window.localStorage.setItem(ONBOARDING_DISMISSED_KEY, '1');
		} catch {
			// ignore storage errors
		}
		window.location.assign('/home');
	}, []);

	const handlePrevious = useCallback(() => {
		if (!previousStepId) return;
		void goToStep(previousStepId);
	}, [goToStep, previousStepId]);

	if (isHydrating || !state) {
		return (
			<div className='flex min-h-screen items-center justify-center'>
				<div className='h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent' />
			</div>
		);
	}

	return (
		<div className='relative min-h-screen overflow-hidden bg-[#050816] text-white'>
			<StarField count={64} seed={12} className='pointer-events-none fixed inset-0 opacity-50' />
			<div className='pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.18),_transparent_34%),radial-gradient(circle_at_bottom,_rgba(139,92,246,0.1),_transparent_30%)]' />
			<div className='pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:80px_80px] opacity-20' />

			<header className='relative z-10 flex h-16 items-center justify-between border-white/10 border-b px-4 backdrop-blur-xl md:px-8'>
				<div className='flex items-center gap-2.5'>
					<div className='flex size-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-black/20'>
						<div className='h-4 w-4 rounded-[6px] border-2 border-white/90' />
					</div>
					<div className='leading-tight'>
						<p className='font-semibold text-sm text-white/95'>Sandy Studio</p>
						<p className='text-[11px] text-white/55'>Configuración inicial</p>
					</div>
				</div>

				{isFirst ? (
					<Button
						variant='ghost'
						size='sm'
						className='gap-2 text-white/70 hover:bg-white/5 hover:text-white'
						onClick={handleDismiss}
					>
						<LogOut className='size-4' />
						Continuar más tarde
					</Button>
				) : null}
			</header>

			<main className='relative z-10 mx-auto flex w-full max-w-4xl flex-col px-4 py-8 md:px-6 md:py-12'>
				<div className='mx-auto mb-8 w-full max-w-3xl'>
					<div className='mb-3 flex items-center justify-between text-white/60 text-xs'>
						<span>
							Paso {state.currentStepNumber} de {state.totalSteps}
						</span>
						<span>{Math.round(state.progressPercentage)}%</span>
					</div>
					<div className='h-1.5 w-full overflow-hidden rounded-full bg-white/10'>
						<div
							className='h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 transition-all duration-500'
							style={{ width: `${state.progressPercentage}%` }}
						/>
					</div>
				</div>

				<div className='mx-auto w-full max-w-3xl'>
					<div className='rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.42)] backdrop-blur-xl md:p-8'>
						<AnimatePresence mode='wait' initial={false}>
							<motion.div
								key={currentStep?.id ?? 'loading'}
								initial={{ opacity: 0, y: 18, scale: 0.985, filter: 'blur(6px)' }}
								animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
								exit={{ opacity: 0, y: -14, scale: 0.985, filter: 'blur(4px)' }}
								transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
							>
								{isBusy ? renderLoading() : renderStep()}
							</motion.div>
						</AnimatePresence>
					</div>

					{!hidePrimaryAction ? (
						<div className='mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between'>
							<Button
								type='button'
								variant='ghost'
								className='gap-2 text-white/70 hover:bg-white/5 hover:text-white'
								disabled={!previousStepId || isBusy}
								onClick={handlePrevious}
							>
								<ArrowLeft className='size-4' />
								Atrás
							</Button>
							<div className='flex items-center gap-2'>
								{state.isSkippable && !isLast ? (
									<Button
										type='button'
										variant='ghost'
										className='gap-2 text-white/70 hover:bg-white/5 hover:text-white'
										disabled={isBusy}
										onClick={() => void skip()}
									>
										<SkipForward className='size-4' />
										Omitir
									</Button>
								) : null}
								<Button
									type='button'
									className='gap-2 rounded-full bg-white px-5 text-slate-900 hover:bg-white/90'
									disabled={!state.canGoNext || isBusy}
									onClick={() => void next()}
								>
									{isLast ? 'Finalizar' : 'Continuar'}
									<ArrowRight className='size-4' />
								</Button>
							</div>
						</div>
					) : null}
				</div>
			</main>
		</div>
	);
}

function renderLoading() {
	return (
		<div className='flex flex-col items-center justify-center gap-3 py-16'>
			<div className='h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white' />
			<p className='text-white/65 text-sm'>Guardando tu progreso...</p>
		</div>
	);
}
