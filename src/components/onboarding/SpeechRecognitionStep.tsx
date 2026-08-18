'use client';

import { saveSettings } from '@/api/settings';
import { SettingsDropdownField } from '@/components/Settings/SettingsDropdownField';
import { azureLanguages, azureRegions } from '@/components/Settings/settings.constants';
import { OnboardingOfficialDocs } from '@/components/onboarding/OnboardingOfficialDocs';
import { OnboardingSelectableCard } from '@/components/onboarding/OnboardingSelectableCard';
import { OnboardingStepFrame } from '@/components/onboarding/OnboardingStepFrame';
import type { OnboardingFlowData, SandyOnboardingContext, StepProps } from '@/components/onboarding/onboarding.types';
import { getStoredSttProvider, storeSttProvider, type SttProvider } from '@/lib/stt-provider';
import { useAuth } from '@clerk/nextjs';
import { useOnboarding } from '@onboardjs/react';
import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
	const [browserSupportsNativeSpeech, setBrowserSupportsNativeSpeech] = useState(false);
	const [isAzureRegionOpen, setIsAzureRegionOpen] = useState(false);
	const [isAzureLanguageOpen, setIsAzureLanguageOpen] = useState(false);
	const [azureSpeechKey, setAzureSpeechKey] = useState(state?.context.flowData.azureSpeechKey ?? '');
	const [azureRegion, setAzureRegion] = useState(state?.context.flowData.azureRegion ?? '');
	const [language, setLanguage] = useState(state?.context.flowData.language ?? 'es-ES');
	const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const selectedProvider = state?.context.flowData.sttProvider ?? getStoredSttProvider() ?? 'azure';

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

	useEffect(
		() => () => {
			if (saveTimer.current) {
				clearTimeout(saveTimer.current);
			}
		},
		[],
	);

	const persist = useCallback(
		async (patch: Partial<OnboardingFlowData>) => {
			const nextFlow = {
				...state?.context.flowData,
				...patch,
			};

			void updateContext({
				flowData: nextFlow,
			});

			if (saveTimer.current) {
				clearTimeout(saveTimer.current);
			}

			saveTimer.current = setTimeout(async () => {
				try {
					const token = await getToken();
					await saveSettings(
						{
							stt_provider: nextFlow.sttProvider,
							azure_speech_key: nextFlow.azureSpeechKey,
							azure_region: nextFlow.azureRegion,
							language: nextFlow.language ?? 'es-ES',
						},
						{ token },
					);
				} catch {
					toast.error('No se pudo guardar el reconocimiento de voz');
				}
			}, 500);
		},
		[getToken, state?.context.flowData, updateContext],
	);

	const handleProviderChange = useCallback(
		(provider: SttProvider) => {
			storeSttProvider(provider);
			void persist({ sttProvider: provider });
		},
		[persist],
	);

	const docs =
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
			  ];

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
							onClick={() => void handleProviderChange(option.id)}
						/>
					))}
				</motion.div>

				<div className='space-y-4 rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur-sm sm:p-6'>
					<div className='space-y-2'>
						<p className='text-muted-foreground text-xs uppercase tracking-[0.22em]'>Configuración</p>
						<h4 className='font-semibold text-lg'>Idioma de reconocimiento</h4>
						<p className='max-w-xl text-muted-foreground text-sm leading-relaxed'>
							Este idioma se usa tanto para Azure como para el reconocimiento del navegador.
						</p>
					</div>

					<SettingsDropdownField
						label='Idioma'
						placeholder='Selecciona un idioma'
						value={language}
						options={azureLanguages}
						open={isAzureLanguageOpen}
						setOpen={setIsAzureLanguageOpen}
						onChange={(value) => {
							setLanguage(value);
							void persist({ language: value });
						}}
					/>

					{selectedProvider === 'azure' ? (
						<div className='space-y-4 border-border/60 border-t pt-4'>
							<div className='space-y-2'>
								<p className='text-muted-foreground text-xs uppercase tracking-[0.22em]'>Azure Speech</p>
								<h4 className='font-semibold text-lg'>Credenciales y región</h4>
								<p className='max-w-xl text-muted-foreground text-sm leading-relaxed'>
									Completa estos datos para activar el reconocimiento de voz con Microsoft Azure.
								</p>
							</div>

							<div className='grid gap-4 lg:grid-cols-2'>
								<div className='space-y-2 lg:col-span-2'>
									<Label htmlFor='azure_speech_key'>Azure Speech Key</Label>
									<Input
										id='azure_speech_key'
										type='password'
										placeholder='tu_clave_de_azure_speech'
										value={azureSpeechKey}
										onChange={(event) => {
											const value = event.target.value;
											setAzureSpeechKey(value);
											void persist({ azureSpeechKey: value });
										}}
									/>
								</div>

								<SettingsDropdownField
									label='Azure Region'
									placeholder='Selecciona una región'
									value={azureRegion}
									options={azureRegions}
									open={isAzureRegionOpen}
									setOpen={setIsAzureRegionOpen}
									onChange={(value) => {
										setAzureRegion(value);
										void persist({ azureRegion: value });
									}}
									className='lg:col-span-2'
								/>
							</div>
						</div>
					) : (
						<div className='rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-cyan-700 text-sm dark:text-cyan-300'>
							Usa el reconocimiento de voz integrado en tu navegador, sin claves. Solo disponible en
							navegadores basados en Chromium (Google Chrome, Edge, Brave, Opera, Vivaldi).
						</div>
					)}

					{selectedProvider === 'browser' ? (
						browserSupportsNativeSpeech ? (
							<div className='rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-700 text-sm dark:text-emerald-300'>
								Tu navegador es compatible. No hace falta configurar nada más.
							</div>
						) : (
							<div className='rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-700 text-sm dark:text-red-300'>
								Tu navegador no es compatible con esta opción. Solo funciona en Google Chrome y otros
								navegadores basados en Chromium.
							</div>
						)
					) : null}
				</div>
			</div>

			{selectedProvider === 'azure' ? (
				<OnboardingOfficialDocs
					title='Documentación oficial'
					description='Abre la guía correcta si quieres revisar soporte, crear la clave o entender cómo funciona el reconocimiento.'
					links={docs}
					className='pt-1'
				/>
			) : null}
		</OnboardingStepFrame>
	);
}

