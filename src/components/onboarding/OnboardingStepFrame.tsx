'use client';

import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import type { ReactNode } from 'react';

type OnboardingStepFrameProps = {
	title?: string;
	description?: string;
	children: ReactNode;
};

export function OnboardingStepFrame({ title, description, children }: OnboardingStepFrameProps) {
	const { resolvedTheme, theme } = useTheme();
	const activeTheme = resolvedTheme ?? theme ?? 'dark';
	const isLightTheme = activeTheme === 'light';

	return (
		<motion.div
			className='space-y-6'
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
		>
			<div className='space-y-2'>
				<h2 className='font-bold text-2xl [font-family:var(--font-unbounded)] sm:text-3xl'>
					<span
						className={
							isLightTheme
								? 'bg-gradient-to-r from-violet-700 to-cyan-600 bg-clip-text text-transparent'
								: 'bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent dark:from-[#A78BFA] dark:to-[#22D3EE]'
						}
					>
						{title}
					</span>
				</h2>
				{description ? (
					<p className={`max-w-xl ${isLightTheme ? 'text-zinc-600' : 'text-muted-foreground'}`}>{description}</p>
				) : null}
			</div>
			{children}
		</motion.div>
	);
}
