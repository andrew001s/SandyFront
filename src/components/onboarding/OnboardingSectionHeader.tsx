'use client';

import type { ReactNode } from 'react';

type OnboardingSectionHeaderProps = {
	eyebrow: string;
	title: string;
	description: string;
	icon: ReactNode;
};

export function OnboardingSectionHeader({
	eyebrow,
	title,
	description,
	icon,
}: OnboardingSectionHeaderProps) {
	return (
		<div className='flex items-start gap-3'>
			<div className='flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-background/85 text-primary shadow-sm'>
				{icon}
			</div>
			<div className='space-y-1'>
				<p className='text-muted-foreground text-xs uppercase tracking-[0.22em]'>{eyebrow}</p>
				<h3 className='font-semibold text-xl'>{title}</h3>
				<p className='max-w-lg text-muted-foreground text-sm leading-relaxed'>{description}</p>
			</div>
		</div>
	);
}
