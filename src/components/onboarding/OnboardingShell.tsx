'use client';

import { useOnboarding } from '@onboardjs/react';
import { ArrowLeft, ArrowRight, LogOut, SkipForward } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { submitOnboardingSettings } from '@/components/onboarding/onboardingSubmit';
import { StarField } from '@/components/landing/StarField';
import { Button } from '@/components/ui/button';
import { markOnboardingDismissed } from '@/lib/onboarding/keys';
import { toast } from 'sonner';

import { stepOrder, type SandyOnboardingContext } from './onboardingSteps';

export function OnboardingShell() {
	const { state, currentStep, loading, next, goToStep, skip, renderStep } =
		useOnboarding<SandyOnboardingContext>();
	const { getToken, userId } = useAuth();
	const { theme, resolvedTheme } = useTheme();
	const activeTheme = resolvedTheme ?? theme ?? 'dark';
	const isLightTheme = activeTheme === 'light';
	const [isPersisting, setIsPersisting] = useState(false);

	const isFirst = state?.isFirstStep ?? true;
	const isLast = state?.isLastStep ?? false;
	const isHydrating = loading.isHydrating ?? loading.isAnyLoading;
	const isBusy = loading.isAnyLoading || isPersisting;
	const isWelcome = currentStep?.id === 'welcome';
	const isCompleted = currentStep?.id === 'completed';
	const hidePrimaryAction = isWelcome || isCompleted;
	const previousStepId = currentStep
		? stepOrder[stepOrder.indexOf(currentStep.id as (typeof stepOrder)[number]) - 1]
		: null;
	const progressPercentage = isCompleted ? 100 : Math.round(state?.progressPercentage ?? 0);
	const currentStepNumber = isCompleted
		? (state?.totalSteps ?? stepOrder.length)
		: (state?.currentStepNumber ?? 1);

	const handleDismiss = useCallback(() => {
		markOnboardingDismissed(userId);
		window.location.assign('/home');
	}, [userId]);

	const handlePrevious = useCallback(() => {
		if (!previousStepId) return;
		void goToStep(previousStepId);
	}, [goToStep, previousStepId]);

	const persistCurrentStep = useCallback(async () => {
		if (!state?.context.flowData) {
			return;
		}

		try {
			setIsPersisting(true);
			const token = await getToken();
			await submitOnboardingSettings(state.context.flowData, token);
		} catch (error) {
			console.error('Error guardando el progreso del onboarding:', error);
			toast.error('No se pudo guardar el progreso del onboarding');
		} finally {
			setIsPersisting(false);
		}
	}, [getToken, state?.context.flowData]);

	const handleContinue = useCallback(async () => {
		await persistCurrentStep();
		await next();
	}, [next, persistCurrentStep]);

	const handleSkipForward = useCallback(async () => {
		await persistCurrentStep();
		await skip();
	}, [persistCurrentStep, skip]);

	if (isHydrating || !state) {
		return (
			<div className='flex min-h-screen items-center justify-center'>
				<div
					className={`h-10 w-10 animate-spin rounded-full border-2 ${
						isLightTheme
							? 'border-[#8B5CF6] border-t-transparent'
							: 'border-primary border-t-transparent'
					}`}
				/>
			</div>
		);
	}

	return (
		<div
			className={`relative min-h-screen overflow-hidden ${
				isLightTheme ? 'bg-[#F6F3FC] text-zinc-900' : 'bg-[#050816] text-white'
			}`}
		>
			{isLightTheme ? (
				<div className='pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.14),_transparent_34%),radial-gradient(circle_at_bottom,_rgba(34,211,238,0.1),_transparent_30%)]' />
			) : (
				<StarField count={64} seed={12} className='pointer-events-none fixed inset-0 opacity-50' />
			)}
			<div
				className={`pointer-events-none fixed inset-0 ${
					isLightTheme
						? 'bg-[linear-gradient(rgba(139,92,246,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,.08)_1px,transparent_1px)] bg-[size:80px_80px] opacity-10'
						: 'bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:80px_80px] opacity-20'
				}`}
			/>

			<header
				className={`relative z-10 flex h-16 items-center justify-between border-b px-4 backdrop-blur-xl md:px-8 ${
					isLightTheme ? 'border-black/10 bg-white/40' : 'border-white/10 bg-transparent'
				}`}
			>
				<div className='flex items-center'>
					<Image
						src={isLightTheme ? '/icons/sandyLight.png' : '/icons/sandyDark.png'}
						alt='Sandy Studio'
						width={120}
						height={40}
						priority
						className='h-auto w-auto max-w-[120px] object-contain'
					/>
				</div>

				{isFirst ? (
					<Button
						variant='ghost'
						size='sm'
						className={`gap-2 ${
							isLightTheme
								? 'text-zinc-600 hover:bg-[#8B5CF6]/10 hover:text-zinc-900'
								: 'text-white/70 hover:bg-white/5 hover:text-white'
						}`}
						onClick={handleDismiss}
					>
						<LogOut className='size-4' />
						Continuar más tarde
					</Button>
				) : null}
			</header>

			<main className='relative z-10 mx-auto flex w-full max-w-4xl flex-col px-4 py-8 md:px-6 md:py-12'>
				<div className='mx-auto mb-8 w-full max-w-3xl'>
					<div
						className={`mb-3 flex items-center justify-between text-xs ${isLightTheme ? 'text-zinc-500' : 'text-white/60'}`}
					>
						<span>
							Paso {currentStepNumber} de {state.totalSteps ?? stepOrder.length}
						</span>
						<span>{progressPercentage}%</span>
					</div>
					<div
						className={`h-1.5 w-full overflow-hidden rounded-full ${isLightTheme ? 'bg-black/10' : 'bg-white/10'}`}
					>
						<div
							className='h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 transition-all duration-500'
							style={{ width: `${progressPercentage}%` }}
						/>
					</div>
				</div>

				<div className='mx-auto w-full max-w-3xl'>
					<AnimatePresence mode='wait' initial={false}>
						<motion.div
							key={currentStep?.id ?? 'loading'}
							initial={{ opacity: 0, y: 18, scale: 0.985, filter: 'blur(6px)' }}
							animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
							exit={{ opacity: 0, y: -14, scale: 0.985, filter: 'blur(4px)' }}
							transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
							className={
								isCompleted
									? 'w-full'
									: isLightTheme
										? 'rounded-[2rem] border border-black/10 bg-white/75 p-5 shadow-[0_24px_90px_rgba(109,91,208,0.12)] backdrop-blur-xl md:p-8'
										: 'rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.42)] backdrop-blur-xl md:p-8'
							}
						>
							{isBusy ? renderLoading() : renderStep()}
						</motion.div>
					</AnimatePresence>

					{!hidePrimaryAction ? (
						<div className='mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between'>
							<Button
								type='button'
								variant='ghost'
								className={`gap-2 ${
									isLightTheme
										? 'text-zinc-600 hover:bg-[#8B5CF6]/10 hover:text-zinc-900'
										: 'text-white/70 hover:bg-white/5 hover:text-white'
								}`}
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
										className={`gap-2 ${
											isLightTheme
												? 'text-zinc-600 hover:bg-[#8B5CF6]/10 hover:text-zinc-900'
												: 'text-white/70 hover:bg-white/5 hover:text-white'
										}`}
										disabled={isBusy}
										onClick={() => void handleSkipForward()}
									>
										<SkipForward className='size-4' />
										Omitir
									</Button>
								) : null}
								<Button
									type='button'
									className={`gap-2 rounded-full px-5 ${
										isLightTheme
											? 'bg-[#101423] text-white hover:bg-[#0b1020]'
											: 'bg-white text-slate-900 hover:bg-white/90'
									}`}
									disabled={!state.canGoNext || isBusy}
									onClick={() => void handleContinue()}
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
			<div className='h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary' />
			<p className='text-muted-foreground text-sm'>Guardando tu progreso...</p>
		</div>
	);
}
