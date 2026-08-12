'use client';

import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import type { ReactNode } from 'react';

type OnboardingSelectableCardProps = {
	title: string;
	description: string;
	selected?: boolean;
	delay?: number;
	onClick: () => void;
	icon?: ReactNode;
};

export function OnboardingSelectableCard({
	title,
	description,
	selected = false,
	delay = 0,
	onClick,
	icon = <Bot className='size-4 text-primary' />,
}: OnboardingSelectableCardProps) {
	return (
		<motion.button
			type='button'
			onClick={onClick}
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.28, delay }}
			whileHover={{ y: -2 }}
			whileTap={{ scale: 0.98 }}
			className={`rounded-2xl border p-4 text-left transition-colors ${
				selected
					? 'border-primary bg-primary/5 ring-1 ring-primary/30'
					: 'border-border/70 bg-background/80 hover:border-primary/40'
			}`}
		>
			<div className='flex items-center gap-2'>
				<div className='flex size-6 items-center justify-center'>{icon}</div>
				<span className='font-medium'>{title}</span>
			</div>
			<p className='mt-1 text-muted-foreground text-xs'>{description}</p>
		</motion.button>
	);
}
