'use client';

import { OnboardingConnectionsRow } from '@/components/onboarding/OnboardingConnectionsRow';
import { OnboardingStepFrame } from '@/components/onboarding/OnboardingStepFrame';
import type { StepProps } from '@/components/onboarding/onboarding.types';
import { motion } from 'framer-motion';

export function ConnectionsStep({ payload }: StepProps) {
	return (
		<OnboardingStepFrame title={payload.title} description={payload.description}>
			<motion.div
				initial={{ opacity: 0, y: 12, scale: 0.99 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
			>
				<OnboardingConnectionsRow />
			</motion.div>
		</OnboardingStepFrame>
	);
}
