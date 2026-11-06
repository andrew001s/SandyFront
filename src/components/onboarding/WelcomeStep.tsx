'use client';

import { Button } from '@/components/ui/button';
import { useOnboarding } from '@onboardjs/react';
import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import type { StepProps } from './onboarding.types';

export function WelcomeStep({ payload }: StepProps) {
	const { next } = useOnboarding();
	return (
		<div className='flex min-h-[min(58dvh,34rem)] flex-col items-center justify-center py-6 text-center sm:py-10'>
			<div className='flex size-20 items-center justify-center rounded-2xl border border-border bg-background sm:size-24'>
				<Image
					src='/icons/icon.png'
					alt=''
					width={56}
					height={56}
					priority
					className='size-14 object-contain'
				/>
			</div>
			<h1
				data-onboarding-title
				tabIndex={-1}
				className='mt-8 max-w-xl text-balance font-bold font-display text-3xl tracking-tight outline-none sm:text-5xl'
			>
				{payload.title}
			</h1>
			<p className='mt-5 max-w-xl text-balance text-base text-muted-foreground leading-relaxed sm:text-lg'>
				{payload.description}
			</p>
			<Button
				type='button'
				className='mt-8 min-h-12 w-full max-w-sm rounded-xl text-base'
				onClick={() => void next()}
			>
				Configurar mi VTuber
				<ChevronRight aria-hidden='true' className='size-4' />
			</Button>
			<p className='mt-4 max-w-md text-muted-foreground text-sm leading-relaxed'>
				Avanza a tu ritmo. Puedes decidir después o guardar y salir en cualquier paso.
			</p>
		</div>
	);
}
