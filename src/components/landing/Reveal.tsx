'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

type RevealProps = {
	children: ReactNode;
	className?: string;
	delay?: number;
	y?: number;
	amount?: number;
};

export function Reveal({ children, className, delay = 0, y = 32, amount = 0.2 }: RevealProps) {
	return (
		<motion.div
			className={className}
			initial={{ opacity: 0, y }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, amount }}
			transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
		>
			{children}
		</motion.div>
	);
}
