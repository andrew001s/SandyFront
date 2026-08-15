'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CardComponentProps } from 'nextstepjs';
import { useTheme } from 'next-themes';

export function DashboardTourCard({
	step,
	currentStep,
	totalSteps,
	nextStep,
	prevStep,
	skipTour,
	arrow,
}: CardComponentProps) {
	const { resolvedTheme, theme } = useTheme();
	const activeTheme = resolvedTheme ?? theme ?? 'dark';
	const isLightTheme = activeTheme === 'light';
	const isLastStep = currentStep >= totalSteps - 1;

	return (
		<div
			className={cn(
				'relative w-[min(92vw,38rem)] overflow-hidden rounded-[2rem] border backdrop-blur-xl',
				isLightTheme
					? 'border-black/10 bg-white/95 text-zinc-900 shadow-[0_28px_100px_rgba(109,91,208,0.18)]'
					: 'border-white/10 bg-[#0B1020]/95 text-white shadow-[0_28px_100px_rgba(0,0,0,0.52)]',
			)}
		>
			<div
				className={cn(
					'absolute inset-x-0 top-0 h-28',
					isLightTheme
						? 'bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.12),transparent_32%)]'
						: 'bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.22),transparent_38%),radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.16),transparent_32%)]',
				)}
			/>
			<div
				className={cn(
					'absolute inset-0 opacity-40',
					isLightTheme
						? 'bg-[linear-gradient(rgba(109,91,208,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(109,91,208,0.06)_1px,transparent_1px)] bg-[size:18px_18px]'
						: 'bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:18px_18px]',
				)}
			/>

			<div className='relative space-y-5 p-5 sm:p-6'>
				<div className='flex items-start justify-between gap-4'>
					<div className='space-y-2'>
						<div
							className={cn(
								'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em]',
								isLightTheme
									? 'border-violet-500/20 bg-violet-500/10 text-violet-700'
									: 'border-violet-400/20 bg-violet-400/10 text-violet-200',
							)}
						>
							<span className='text-sm leading-none'>{step.icon ?? '✦'}</span>
							<span>Paso {currentStep + 1} de {totalSteps}</span>
						</div>
						<div className='space-y-1'>
							<h2
								className={cn(
									'font-semibold text-[1.35rem] leading-tight sm:text-[1.55rem]',
									isLightTheme ? 'text-zinc-900' : 'text-white',
								)}
							>
								{step.title}
							</h2>
							<p className={cn('max-w-[32rem] text-sm leading-relaxed sm:text-[0.96rem]', isLightTheme ? 'text-zinc-600' : 'text-white/70')}>
								{step.content}
							</p>
						</div>
					</div>

					<div
						className={cn(
							'flex size-10 shrink-0 items-center justify-center rounded-2xl border',
							isLightTheme
								? 'border-black/10 bg-white text-violet-600'
								: 'border-white/10 bg-white/5 text-violet-200',
						)}
					>
						<span className='text-lg leading-none'>{step.icon ?? '✦'}</span>
					</div>
				</div>

				<div className='space-y-2'>
					<div className={cn('h-2 overflow-hidden rounded-full', isLightTheme ? 'bg-black/10' : 'bg-white/10')}>
						<div
							className='h-full rounded-full bg-violet-600 transition-all duration-300'
							style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
						/>
					</div>
					<div className={cn('flex items-center justify-between text-[11px]', isLightTheme ? 'text-zinc-500' : 'text-white/45')}>
						<span>
							{currentStep + 1} de {totalSteps}
						</span>
						<span>{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
					</div>
				</div>

				<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
					<div className='flex items-center gap-2'>
						<Button
							type='button'
							variant='outline'
							className={cn(
								'h-11 rounded-full px-5',
								isLightTheme
									? 'border-black/10 bg-white text-zinc-700 hover:bg-zinc-50'
									: 'border-white/10 bg-white/5 text-white hover:bg-white/10',
							)}
							onClick={prevStep}
							disabled={currentStep === 0}
						>
							Previous
						</Button>

						{skipTour && !isLastStep ? (
							<Button
								type='button'
								variant='ghost'
								className={cn(
									'h-11 rounded-full px-5',
									isLightTheme
										? 'text-zinc-500 hover:bg-violet-500/10 hover:text-zinc-900'
										: 'text-white/55 hover:bg-white/5 hover:text-white',
								)}
								onClick={skipTour}
							>
								Skip Tour
							</Button>
						) : null}
					</div>

					<Button
						type='button'
						className='h-11 rounded-full bg-violet-600 px-5 font-semibold text-white shadow-lg shadow-violet-500/20 hover:bg-violet-500'
						onClick={nextStep}
					>
						{isLastStep ? 'Finish' : 'Next'}
					</Button>
				</div>
			</div>

			{arrow}
		</div>
	);
}
