'use client';

import { Check } from 'lucide-react';
import type { ReactNode } from 'react';

export function OnboardingSelectableCard({
	title,
	description,
	selected = false,
	onClick,
	icon,
}: {
	title: string;
	description: string;
	selected?: boolean;
	delay?: number;
	onClick: () => void;
	icon?: ReactNode;
}) {
	return (
		<button
			type='button'
			aria-pressed={selected}
			onClick={onClick}
			className={`flex min-h-11 w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 ${selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
		>
			{icon && (
				<span aria-hidden='true' className='mt-0.5 shrink-0 text-muted-foreground'>
					{icon}
				</span>
			)}
			<span className='min-w-0 flex-1'>
				<span className='block font-semibold text-sm'>{title}</span>
				<span className='mt-1 block text-muted-foreground text-sm leading-relaxed'>
					{description}
				</span>
			</span>
			<span
				aria-hidden='true'
				className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}
			>
				{selected && <Check className='size-3' />}
			</span>
		</button>
	);
}
