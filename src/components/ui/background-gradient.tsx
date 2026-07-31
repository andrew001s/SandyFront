import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import React from 'react';

export const BackgroundGradient = ({
	children,
	className,
	containerClassName,
	animate = true,
}: {
	children?: React.ReactNode;
	className?: string;
	containerClassName?: string;
	animate?: boolean;
}) => {
	const variants = {
		initial: {
			backgroundPosition: '0 50%',
		},
		animate: {
			backgroundPosition: ['0, 50%', '100% 50%', '0 50%'],
		},
	};
	return (
		<div className={cn('relative p-[4px] group', containerClassName)}>
			<motion.div
				variants={animate ? variants : undefined}
				initial={animate ? 'initial' : undefined}
				animate={animate ? 'animate' : undefined}
				transition={
					animate
						? {
								duration: 5,
								repeat: Infinity,
								repeatType: 'reverse',
							}
						: undefined
				}
				style={{
					backgroundSize: animate ? '400% 400%' : undefined,
				}}
				className={cn(
					'absolute inset-0 z-[1] rounded-3xl opacity-55 blur-xl transition duration-500 will-change-transform group-hover:opacity-100',
					'bg-[radial-gradient(circle_farthest-side_at_0_100%,rgba(14,165,233,0.20),transparent),radial-gradient(circle_farthest-side_at_100%_0,rgba(168,85,247,0.16),transparent),radial-gradient(circle_farthest-side_at_100%_100%,rgba(245,158,11,0.14),transparent),radial-gradient(circle_farthest-side_at_0_0,rgba(59,130,246,0.16),transparent)]',
					'dark:bg-[radial-gradient(circle_farthest-side_at_0_100%,rgba(14,165,233,0.18),transparent),radial-gradient(circle_farthest-side_at_100%_0,rgba(168,85,247,0.18),transparent),radial-gradient(circle_farthest-side_at_100%_100%,rgba(245,158,11,0.12),transparent),radial-gradient(circle_farthest-side_at_0_0,rgba(59,130,246,0.18),transparent)]',
				)}
			/>
			<motion.div
				variants={animate ? variants : undefined}
				initial={animate ? 'initial' : undefined}
				animate={animate ? 'animate' : undefined}
				transition={
					animate
						? {
								duration: 5,
								repeat: Infinity,
								repeatType: 'reverse',
							}
						: undefined
				}
				style={{
					backgroundSize: animate ? '400% 400%' : undefined,
				}}
				className={cn(
					'absolute inset-0 z-[1] rounded-3xl will-change-transform',
					'bg-[radial-gradient(circle_farthest-side_at_0_100%,rgba(14,165,233,0.18),transparent),radial-gradient(circle_farthest-side_at_100%_0,rgba(168,85,247,0.14),transparent),radial-gradient(circle_farthest-side_at_100%_100%,rgba(245,158,11,0.12),transparent),radial-gradient(circle_farthest-side_at_0_0,rgba(59,130,246,0.14),transparent)]',
					'dark:bg-[radial-gradient(circle_farthest-side_at_0_100%,rgba(14,165,233,0.22),transparent),radial-gradient(circle_farthest-side_at_100%_0,rgba(168,85,247,0.18),transparent),radial-gradient(circle_farthest-side_at_100%_100%,rgba(245,158,11,0.12),transparent),radial-gradient(circle_farthest-side_at_0_0,rgba(59,130,246,0.18),transparent)]',
				)}
			/>

			<div className={cn('relative z-10', className)}>{children}</div>
		</div>
	);
};
