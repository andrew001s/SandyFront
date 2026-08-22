import type { OnboardingContext, CustomComponentStepPayload } from '@onboardjs/core';
import type { StepComponentProps } from '@onboardjs/react';
import type { AiProvider } from '@/lib/ai-provider';
import type { SandyCoreConfig } from '@/lib/sandycore-config';

export type OnboardingFlowData = {
	twitchConnected?: boolean;
	kickConnected?: boolean;
	youtubeConnected?: boolean;
	uiTheme?: 'light' | 'dark';
	aiProvider?: AiProvider;
	geminiApiKey?: string;
	openrouterApiKey?: string;
	openrouterModel?: string;
	fishAudioKey?: string;
	voiceId?: string;
	sttProvider?: 'azure' | 'browser';
	azureSpeechKey?: string;
	azureRegion?: string;
	language?: string;
	vtubeConnected?: boolean;
	sandyCoreConfig?: SandyCoreConfig;
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
