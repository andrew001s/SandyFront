'use client';

import type { OnboardingStep } from '@onboardjs/react';
import { Bot, Check, GitBranch, Mic, MonitorSpeaker, Palette, Sparkles, Volume2 } from 'lucide-react';
import { ConnectionsStep } from '@/components/onboarding/ConnectionsStep';
import { AiStep } from '@/components/onboarding/AiStep';
import { CompletedStep } from '@/components/onboarding/CompletedStep';
import { ThemeStep } from '@/components/onboarding/ThemeStep';
import { VTubeStudioStep } from '@/components/onboarding/VTubeStudioStep';
import { VoiceStep } from '@/components/onboarding/VoiceStep';
import { SpeechRecognitionStep } from '@/components/onboarding/SpeechRecognitionStep';
import { WelcomeStep } from '@/components/onboarding/WelcomeStep';
import type { ReactNode } from 'react';
import type { SandyOnboardingContext } from '@/components/onboarding/onboarding.types';

export type { OnboardingFlowData, OnboardingStepPayload, SandyOnboardingContext } from '@/components/onboarding/onboarding.types';

const stepMeta = {
	welcome: {
		title: '¡Bienvenido a Sandy Studio!',
		description:
			'Vamos a dejar tu VTuber lista para hablar, responder y presentarse bien desde el primer inicio.',
	},
	connections: {
		title: 'Tus conexiones',
		description:
			'Conectar Twitch, Kick y YouTube permite que Sandy lea mensajes y reaccione desde donde ya está tu comunidad.',
	},
	theme: {
		title: 'Elegí el estilo de la app',
		description:
			'Selecciona el tema que prefieras para que Sandy Studio se sienta cómodo desde el primer uso.',
	},
	ai: {
		title: 'Elige tu modelo de IA',
		description:
			'Este modelo entiende el chat y decide cómo responder, así que aquí defines el tono, la velocidad y el costo de cada mensaje.',
	},
	voice: {
		title: 'Configurá su voz',
		description:
			'La voz le da identidad al avatar. Aquí eliges cómo sonará para que la experiencia se sienta natural y coherente.',
	},
	speech: {
		title: 'Reconocimiento de voz',
		description:
			'Activa cómo Sandy escuchará tu voz para responderte en tiempo real mientras usas la app.',
	},
	'vtube-studio': {
		title: 'Conectá VTube Studio',
		description:
			'Conecta el avatar para que Sandy pueda mover la boca y reaccionar en tiempo real mientras habla.',
	},
	completed: {
		title: '¡Todo listo!',
		description:
			'Antes de entrar al dashboard, revisa qué quedó conectado y qué puedes completar después sin perder el avance.',
	},
} as const;

export type OnboardingStepId = keyof typeof stepMeta;

export const steps: OnboardingStep<SandyOnboardingContext>[] = [
	{
		id: 'welcome',
		type: 'CUSTOM_COMPONENT',
		component: WelcomeStep,
		payload: { ...stepMeta.welcome, componentKey: 'welcome' },
		nextStep: 'theme',
	},
	{
		id: 'theme',
		type: 'CUSTOM_COMPONENT',
		component: ThemeStep,
		payload: { ...stepMeta.theme, componentKey: 'theme' },
		nextStep: 'connections',
	},
	{
		id: 'connections',
		type: 'CUSTOM_COMPONENT',
		component: ConnectionsStep,
		payload: { ...stepMeta.connections, componentKey: 'connections' },
		nextStep: 'ai',
	},
	{
		id: 'ai',
		type: 'CUSTOM_COMPONENT',
		component: AiStep,
		payload: { ...stepMeta.ai, componentKey: 'ai' },
		nextStep: 'voice',
	},
	{
		id: 'voice',
		type: 'CUSTOM_COMPONENT',
		component: VoiceStep,
		payload: { ...stepMeta.voice, componentKey: 'voice' },
		nextStep: 'speech',
	},
	{
		id: 'speech',
		type: 'CUSTOM_COMPONENT',
		component: SpeechRecognitionStep,
		payload: { ...stepMeta.speech, componentKey: 'speech' },
		nextStep: 'vtube-studio',
	},
	{
		id: 'vtube-studio',
		type: 'CUSTOM_COMPONENT',
		component: VTubeStudioStep,
		payload: { ...stepMeta['vtube-studio'], componentKey: 'vtube-studio' },
		nextStep: 'completed',
		isSkippable: true,
		skipToStep: 'completed',
	},
	{
		id: 'completed',
		type: 'CUSTOM_COMPONENT',
		component: CompletedStep,
		payload: { ...stepMeta.completed, componentKey: 'completed' },
		nextStep: null,
	},
];

export const stepOrder = steps.map((step) => step.id) as OnboardingStepId[];

export const onboardingStepsIcons: Record<OnboardingStepId, ReactNode> = {
	welcome: <Sparkles className='size-4' />,
	theme: <Palette className='size-4' />,
	connections: <GitBranch className='size-4' />,
	ai: <Bot className='size-4' />,
	voice: <Volume2 className='size-4' />,
	speech: <Mic className='size-4' />,
	'vtube-studio': <MonitorSpeaker className='size-4' />,
	completed: <Check className='size-4' />,
};
