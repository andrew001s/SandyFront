'use client';

import { saveSettings } from '@/api/settings';
import { OnboardingOfficialDocs } from '@/components/onboarding/OnboardingOfficialDocs';
import { OnboardingSelectableCard } from '@/components/onboarding/OnboardingSelectableCard';
import { OnboardingStepFrame } from '@/components/onboarding/OnboardingStepFrame';
import type { SandyOnboardingContext, StepProps } from '@/components/onboarding/onboarding.types';
import { getStoredSttProvider, storeSttProvider, type SttProvider } from '@/lib/stt-provider';
import { useOnboarding } from '@onboardjs/react';
import { useAuth } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Mic, Sparkles } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const sttOptions: Array<{
	id: SttProvider;
	label: string;
	description: string;
}> = [
	{
		id: 'browser',
		label: 'Navegador',
		description: 'Gratis, sin claves. Funciona mejor en Chrome, Edge y navegadores Chromium.',
	},
	{
		id: 'azure',
		label: 'Azure Speech',
		description: 'Más control y compatibilidad si ya tienes tus credenciales de Microsoft.',
	},
];

export function SpeechRecognitionStep({ payload }: StepProps) {
	const { state, updateContext } = useOnboarding<SandyOnboardingContext>();
	const { getToken } = useAuth();
	const { resolvedTheme, theme } = useTheme();
	const [browserSupportsNativeSpeech, setBrowserSupportsNativeSpeech] = useState(false);
	const selectedProvider = state?.context.flowData.sttProvider ?? getStoredSttProvider() ?? 'azure';
	const isLightTheme = (resolvedTheme ?? theme ?? 'dark') === 'light';

	useEffect(() => {
		const speechWindow = window as Window & {
			SpeechRecognition?: unknown;
			webkitSpeechRecognition?: unknown;
			mozSpeechRecognition?: unknown;
			msSpeechRecognition?: unknown;
		};

		setBrowserSupportsNativeSpeech(
			Boolean(
				speechWindow.SpeechRecognition ||
					speechWindow.webkitSpeechRecognition ||
					speechWindow.mozSpeechRecognition ||
					speechWindow.msSpeechRecognition,
			),
		);
	}, []);

	const persist = useCallback(
		async (provider: SttProvider) => {
			storeSttProvider(provider);
			void updateContext({
				flowData: {
					...state?.context.flowData,
					sttProvider: provider,
				},
			});

			try {
				const token = await getToken();
				await saveSettings({ stt_provider: provider }, { token });
			} catch {
				toast.error('No se pudo guardar el reconocimiento de voz');
			}
		},
		[getToken, state?.context.flowData, updateContext],
	);

	const docs = useMemo(
		() =>
			selectedProvider === 'browser'
				? []
				: [
						{
							label: 'Speech to text',
							href: 'https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-to-text',
							description: 'Guía oficial para texto desde voz en Azure.',
						},
						{
							label: 'Crear recurso Speech',
							href: 'https://learn.microsoft.com/en-us/azure/ai-services/speech-service/get-started-speech-to-text',
							description: 'Pasos para crear tu recurso y obtener la key.',
						},
				  ],
		[selectedProvider],
	);

	return (
		<OnboardingStepFrame title={payload.title} description={payload.description}>
			<div className='space-y-6'>
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.32 }}
					className='grid grid-cols-1 gap-3 sm:grid-cols-2'
				>
					{sttOptions.map((option, index) => (
						<OnboardingSelectableCard
							key={option.id}
							title={option.label}
							description={option.description}
							selected={selectedProvider === option.id}
							delay={index * 0.06}
							icon={<Mic className='size-4 text-primary' />}
							onClick={() => void persist(option.id)}
						/>
					))}
				</motion.div>

				<div
					className={`rounded-2xl border px-4 py-3 text-sm leading-relaxed ${
						selectedProvider === 'browser'
							? browserSupportsNativeSpeech
								? isLightTheme
									? 'border-emerald-500/20 bg-emerald-500/8 text-emerald-900'
									: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
								: isLightTheme
									? 'border-amber-500/20 bg-amber-500/8 text-amber-900'
									: 'border-amber-500/30 bg-amber-500/10 text-amber-100'
							: isLightTheme
								? 'border-violet-500/20 bg-violet-500/8 text-violet-900'
								: 'border-violet-500/30 bg-violet-500/10 text-violet-100'
					}`}
				>
					<div className='flex items-start gap-2'>
						<Sparkles
							className={`mt-0.5 size-4 shrink-0 ${
								isLightTheme ? 'text-violet-500' : 'text-current'
							}`}
						/>
						<p className={isLightTheme ? 'text-zinc-800' : ''}>
							{selectedProvider === 'browser'
								? browserSupportsNativeSpeech
									? 'Tu navegador soporta reconocimiento nativo. No necesitas claves adicionales.'
									: 'Este navegador no soporta reconocimiento nativo. Si eliges esta opción, te recomendamos usar Chrome o Edge.'
								: 'Con Azure podrás usar reconocimiento de voz con tu propia clave y región de Speech.'}
						</p>
					</div>
				</div>

				{selectedProvider === 'browser' ? null : (
					<OnboardingOfficialDocs
						title='Documentación oficial'
						description='Abre la guía correcta si quieres revisar soporte, crear la clave o entender cómo funciona el reconocimiento.'
						links={docs}
						className='pt-1'
					/>
				)}
			</div>
		</OnboardingStepFrame>
	);
}
