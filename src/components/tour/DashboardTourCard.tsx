'use client';
import { Button } from '@/components/ui/button';
import type { CardComponentProps } from 'nextstepjs';
import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
export function DashboardTourCard({
	step,
	currentStep,
	totalSteps,
	nextStep,
	prevStep,
	skipTour,
}: CardComponentProps) {
	const card = useRef<HTMLDialogElement>(null);
	const [position, setPosition] = useState({ left: 12, top: 12 });
	const last = currentStep === totalSteps - 1;
	useLayoutEffect(() => {
		const previous = document.activeElement as HTMLElement | null;
		card.current?.focus();
		return () => previous?.focus();
	}, []);
	useLayoutEffect(() => {
		const place = () => {
			const node = card.current;
			if (!node) return;
			const rect = step.selector
				? document.querySelector(step.selector)?.getBoundingClientRect()
				: null;
			const { width, height } = node.getBoundingClientRect();
			const gap = 16;
			let left = (innerWidth - width) / 2;
			let top = (innerHeight - height) / 2;
			if (rect) {
				if (rect.left > width + gap + 12) {
					left = rect.left - width - gap;
					top = rect.top + (rect.height - height) / 2;
				} else if (innerWidth - rect.right > width + gap + 12) {
					left = rect.right + gap;
					top = rect.top + (rect.height - height) / 2;
				} else {
					left = rect.left + (rect.width - width) / 2;
					top =
						rect.bottom + gap + height < innerHeight - 12
							? rect.bottom + gap
							: rect.top - height - gap;
				}
			}
			setPosition({
				left: Math.max(12, Math.min(innerWidth - width - 12, left)),
				top: Math.max(12, Math.min(innerHeight - height - 12, top)),
			});
		};
		place();
		const observer = new ResizeObserver(place);
		if (card.current) observer.observe(card.current);
		const target = step.selector ? document.querySelector(step.selector) : null;
		if (target) observer.observe(target);
		window.addEventListener('resize', place);
		window.addEventListener('scroll', place, true);
		return () => {
			observer.disconnect();
			window.removeEventListener('resize', place);
			window.removeEventListener('scroll', place, true);
		};
	}, [step.selector, currentStep]);
	return createPortal(
		<dialog
			open
			ref={card}
			aria-modal='true'
			aria-labelledby='studio-tour-title'
			tabIndex={-1}
			data-studio-tour-card
			style={position}
			onKeyDown={(event) => {
				if (event.key === 'Escape') {
					event.preventDefault();
					skipTour?.();
				}
				if (event.key !== 'Tab') return;
				const buttons = [
					...(card.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []),
				];
				const first = buttons[0];
				const final = buttons[buttons.length - 1];
				if (
					event.shiftKey &&
					(document.activeElement === first || document.activeElement === card.current)
				) {
					event.preventDefault();
					final?.focus();
				} else if (!event.shiftKey && document.activeElement === final) {
					event.preventDefault();
					first?.focus();
				}
			}}
			className='fixed right-auto z-[1401] m-0 max-h-[calc(100dvh-1.5rem)] w-[min(22rem,calc(100vw-1.5rem))] overflow-y-auto rounded-xl border border-border bg-popover p-5 text-popover-foreground shadow-xl outline-none [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]'
		>
			<p className='mb-3 text-muted-foreground text-xs'>
				Paso {currentStep + 1} de {totalSteps}
			</p>
			<h2 id='studio-tour-title' className='font-display font-semibold text-lg leading-tight'>
				{step.title}
			</h2>
			<p className='mt-2 text-muted-foreground text-sm leading-relaxed'>{step.content}</p>
			<div className='mt-5 flex items-center justify-between gap-2'>
				<Button
					variant='outline'
					onClick={prevStep}
					disabled={currentStep === 0}
					className='h-10 px-3'
				>
					Atrás
				</Button>
				{skipTour && (
					<button
						type='button'
						onClick={skipTour}
						className='min-h-10 rounded-md px-2 text-muted-foreground text-xs hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring'
					>
						Omitir
					</button>
				)}
				<Button onClick={nextStep} className='h-10 px-4'>
					{last ? 'Terminar' : 'Siguiente'}
				</Button>
			</div>
		</dialog>,
		document.body,
	);
}
