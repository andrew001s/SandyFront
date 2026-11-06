'use client';

import type { ReactNode } from 'react';

export function OnboardingStepFrame({
	title,
	description,
	children,
}: {
	title?: string;
	description?: string;
	children: ReactNode;
}) {
	return (
		<div className='space-y-7'>
			<div className='space-y-3'>
				<h1
					data-onboarding-title
					tabIndex={-1}
					className='font-bold font-display text-2xl tracking-tight outline-none sm:text-3xl'
				>
					{title}
				</h1>
				{description && (
					<p className='max-w-[65ch] text-muted-foreground text-sm leading-relaxed sm:text-base'>
						{description}
					</p>
				)}
			</div>
			{children}
		</div>
	);
}
