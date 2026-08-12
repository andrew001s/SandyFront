'use client';

import { Button } from '@/components/ui/button';
import { OnboardingStatusRow } from '@/components/onboarding/OnboardingStatusRow';
import type { SandyOnboardingContext, StepProps } from '@/components/onboarding/onboarding.types';
import { OnboardingStepFrame } from '@/components/onboarding/OnboardingStepFrame';
import { useOnboarding } from '@onboardjs/react';
import { motion } from 'framer-motion';
import { ChevronRight, Sparkles } from 'lucide-react';

export function CompletedStep({ payload }: StepProps) {
	const { state, next } = useOnboarding<SandyOnboardingContext>();
	const flowData = state?.context.flowData;

	const rows = [
		{
			label: 'Conexiones',
			done: Boolean(flowData?.twitchConnected || flowData?.kickConnected || flowData?.youtubeConnected),
		},
		{ label: 'Modelo de IA', done: Boolean(flowData?.aiProvider) },
		{ label: 'Voz configurada', done: Boolean(flowData?.fishAudioKey && flowData?.voiceId) },
		{ label: 'VTube Studio conectado', done: Boolean(flowData?.vtubeConnected) },
	];

	return (
		<OnboardingStepFrame title={payload.title} description={payload.description}>
			<motion.ul
				className='max-w-lg space-y-2'
				initial='hidden'
				animate='show'
				variants={{
					hidden: {},
					show: { transition: { staggerChildren: 0.05 } },
				}}
			>
				{rows.map((row) => (
					<OnboardingStatusRow key={row.label} label={row.label} done={row.done} />
				))}
			</motion.ul>
			<div className='flex items-center gap-3 pt-2'>
				<Sparkles className='size-5 text-amber-400' />
				<p className='text-muted-foreground text-sm'>
					¡Listo! Ya podés ir a tu dashboard y hacer vivir a tu VTuber.
				</p>
			</div>
			<div className='flex justify-end pt-2'>
				<Button size='lg' onClick={() => void next()}>
					Ir al dashboard
					<ChevronRight className='size-4' />
				</Button>
			</div>
		</OnboardingStepFrame>
	);
}
