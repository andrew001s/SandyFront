import type { AiProvider } from '@/lib/ai-provider';
import type { PersonaProfile } from '@/lib/persona-profile';
import type { SandyCoreConfig } from '@/lib/sandycore-config';
import type { EdgeTtsConfig, LocalTtsConfig, TtsProvider } from '@/lib/tts-provider';
import type { CustomComponentStepPayload, OnboardingContext } from '@onboardjs/core';
import type { StepComponentProps } from '@onboardjs/react';

export type OnboardingFlowData = {
	twitchConnected?: boolean;
	kickConnected?: boolean;
	youtubeConnected?: boolean;
	uiTheme?: 'light' | 'dark';
	aiProvider?: AiProvider;
	geminiApiKey?: string;
	openrouterApiKey?: string;
	openrouterModel?: string;
	localApiUrl?: string;
	localModel?: string;
	fishAudioKey?: string;
	voiceId?: string;
	ttsProvider?: TtsProvider;
	edgeTts?: EdgeTtsConfig;
	localTts?: LocalTtsConfig;
	voiceTestSignature?: string;
	avatarMode?: 'pngtuber' | 'live2d' | 'vrm';
	sttProvider?: 'azure' | 'browser';
	azureSpeechKey?: string;
	azureRegion?: string;
	language?: string;
	vtubeConnected?: boolean;
	sandyCoreConfig?: Partial<SandyCoreConfig>;
	personaProfile?: PersonaProfile;
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
