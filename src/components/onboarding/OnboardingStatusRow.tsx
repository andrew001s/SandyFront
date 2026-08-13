'use client';

import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

type OnboardingStatusRowProps = {
	label: string;
	done: boolean;
};

export function OnboardingStatusRow({ label, done }: OnboardingStatusRowProps) {
	return (
		<motion.li
			variants={{
				hidden: { opacity: 0, x: -10 },
				show: { opacity: 1, x: 0 },
			}}
			className='flex items-center justify-between rounded-xl border px-4 py-2.5'
		>
			<span className='text-sm'>{label}</span>
			{done ? (
				<span className='flex items-center gap-1.5 font-medium text-emerald-500 text-xs'>
					<Check className='size-4' /> Listo
				</span>
			) : (
				<span className='text-muted-foreground text-xs'>Puedes completarlo después</span>
			)}
		</motion.li>
	);
}
