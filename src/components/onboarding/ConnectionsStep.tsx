'use client';

import { OnboardingConnectionsRow } from './OnboardingConnectionsRow';
import { OnboardingStepFrame } from './OnboardingStepFrame';
import type { StepProps } from './onboarding.types';

export function ConnectionsStep({ payload }: StepProps) {
	return (
		<OnboardingStepFrame title={payload.title} description={payload.description}>
			<OnboardingConnectionsRow />
		</OnboardingStepFrame>
	);
}
