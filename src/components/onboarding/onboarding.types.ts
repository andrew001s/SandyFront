import type { OnboardingContext, CustomComponentStepPayload } from '@onboardjs/core';
import type { StepComponentProps } from '@onboardjs/react';
import type { AiProvider } from '@/lib/ai-provider';

export type OnboardingFlowData = {
	twitchConnected?: boolean;
	kickConnected?: boolean;
	youtubeConnected?: boolean;
	aiProvider?: AiProvider;
	geminiApiKey?: string;
	openrouterApiKey?: string;
	openrouterModel?: string;
	fishAudioKey?: string;
	voiceId?: string;
	vtubeConnected?: boolean;
	completedAt?: number;
};

export type SandyOnboardingContext = OnboardingContext & {
	flowData: OnboardingFlowData;
};

export type OnboardingStepPayload = CustomComponentStepPayload & {
	title?: string;
	description?: string;
};

export type StepProps = StepComponentProps<OnboardingStepPayload, SandyOnboardingContext>;
