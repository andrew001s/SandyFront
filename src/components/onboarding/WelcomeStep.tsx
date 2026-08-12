'use client';

import { Button } from '@/components/ui/button';
import type { StepProps } from '@/components/onboarding/onboarding.types';
import { useOnboarding } from '@onboardjs/react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import Image from 'next/image';

export function WelcomeStep({ payload }: StepProps) {
	const { next } = useOnboarding();

	return (
		<motion.div
			className='flex min-h-[58vh] flex-col items-center justify-center text-center'
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
		>
			<div className='space-y-8'>
				<motion.div
					initial={{ opacity: 0, scale: 0.92 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.35, delay: 0.05 }}
					className='flex justify-center'
				>
					<div className='flex size-20 items-center justify-center rounded-[1.8rem] border border-white/10 bg-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur-sm'>
						<Image
							src='/icons/icon.png'
							alt='Sandy Studio'
							width={48}
							height={48}
							priority
							className='h-12 w-12 object-contain'
						/>
					</div>
				</motion.div>

				<div className='space-y-5'>
					<div className='space-y-3'>
						<h2 className='font-semibold text-4xl text-white tracking-tight [font-family:var(--font-unbounded)] sm:text-5xl'>
							{payload.title}
						</h2>
						<p className='mx-auto max-w-2xl text-balance text-lg text-white/60 leading-relaxed sm:text-xl'>
							{payload.description}
						</p>
					</div>

					<div className='flex flex-col items-center gap-3 pt-2'>
						<Button
							type='button'
							size='lg'
							onClick={() => void next()}
							className='h-12 w-full max-w-md rounded-2xl bg-white px-8 text-base text-slate-900 shadow-[0_12px_40px_rgba(255,255,255,0.12)] hover:bg-white/90'
						>
							Empezar
							<ChevronRight className='size-4' />
						</Button>
						<p className='text-sm text-white/45'>Te tomará unos minutos dejarlo listo.</p>
					</div>
				</div>
			</div>
		</motion.div>
	);
}
