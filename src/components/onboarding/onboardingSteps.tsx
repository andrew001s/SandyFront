'use client';

import { AiStep } from '@/components/onboarding/AiStep';
import { AvatarSetupStep } from '@/components/onboarding/AvatarSetupStep';
import { CompletedStep } from '@/components/onboarding/CompletedStep';
import { ConnectionsStep } from '@/components/onboarding/ConnectionsStep';
import { SandyCoreStep } from '@/components/onboarding/SandyCoreStep';
import { SpeechRecognitionStep } from '@/components/onboarding/SpeechRecognitionStep';
import { ThemeStep } from '@/components/onboarding/ThemeStep';
import { VoiceStep } from '@/components/onboarding/VoiceStep';
import { WelcomeStep } from '@/components/onboarding/WelcomeStep';
import type { SandyOnboardingContext } from '@/components/onboarding/onboarding.types';
import type { OnboardingStep } from '@onboardjs/react';
import {
	Bot,
	Check,
	FileJson,
	GitBranch,
	Mic,
	MonitorSpeaker,
	Palette,
	Sparkles,
	Volume2,
} from 'lucide-react';
import type { ReactNode } from 'react';

export type {
	OnboardingFlowData,
	OnboardingStepPayload,
	SandyOnboardingContext,
} from '@/components/onboarding/onboarding.types';

const stepMeta = {
	welcome: {
		title: '¡Bienvenido a Sandy Studio!',
		description:
			'Prepara las respuestas, la voz y el formato de tu avatar. Puedes dejar cualquier decisión para después y probarlo en el estudio.',
	},
	connections: {
		title: '¿Dónde está tu comunidad?',
		description:
			'Conecta las plataformas cuyo chat quieres usar. Puedes probar a hablar con Sandy sin conectar un canal todavía.',
	},
	theme: {
		title: 'Un espacio cómodo para configurar',
		description: 'Elige claro u oscuro. Puedes cambiarlo después desde el estudio.',
	},
	ai: {
		title: 'Elige tu modelo de IA',
		description:
			'La IA decide qué responder. Elige un proveedor y completa su acceso; la voz se configura en el siguiente bloque.',
	},
	'sandy-core': {
		title: 'Personalidad de la VTuber',
		description:
			'Descarga la plantilla, define cómo habla tu VTuber y carga su archivo JSON. Puedes completar este paso después.',
	},
	voice: {
		title: 'Así sonará Sandy',
		description:
			'Elige Edge TTS, Fish Audio o tu servidor local. Escucha una frase de prueba antes de seguir.',
	},
	speech: {
		title: 'Habla con Sandy',
		description:
			'Esto convierte tu voz en texto. Es distinto de la voz con la que Sandy te responde.',
	},
	'vtube-studio': {
		title: 'Elige el formato de tu avatar',
		description:
			'PNGTuber, Live2D y VRM funcionan dentro del estudio. Allí cargarás el modelo y prepararás sus expresiones.',
	},
	completed: {
		title: 'Revisa antes de entrar al estudio',
		description:
			'Estos son los datos que preparaste y las comprobaciones que todavía quedan pendientes.',
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
		nextStep: 'sandy-core',
	},
	{
		id: 'sandy-core',
		type: 'CUSTOM_COMPONENT',
		component: SandyCoreStep,
		payload: { ...stepMeta['sandy-core'], componentKey: 'sandy-core' },
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
		component: AvatarSetupStep,
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

export const stepLabels: Record<OnboardingStepId, string> = {
	welcome: 'Bienvenida',
	theme: 'Apariencia',
	connections: 'Conexiones',
	ai: 'Respuestas de IA',
	'sandy-core': 'Personalidad',
	voice: 'Voz',
	speech: 'Micrófono',
	'vtube-studio': 'Avatar',
	completed: 'Revisión',
};

export const onboardingStepsIcons: Record<OnboardingStepId, ReactNode> = {
	welcome: <Sparkles className='size-4' />,
	theme: <Palette className='size-4' />,
	connections: <GitBranch className='size-4' />,
	ai: <Bot className='size-4' />,
	'sandy-core': <FileJson className='size-4' />,
	voice: <Volume2 className='size-4' />,
	speech: <Mic className='size-4' />,
	'vtube-studio': <MonitorSpeaker className='size-4' />,
	completed: <Check className='size-4' />,
};
