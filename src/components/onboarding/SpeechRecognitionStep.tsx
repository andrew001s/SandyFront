'use client';

import { SettingsDropdownField } from '@/components/Settings/SettingsDropdownField';
import { azureLanguages, azureRegions } from '@/components/Settings/settings.constants';
import { Input } from '@/components/ui/input';
import { getStoredSttProvider } from '@/lib/stt-provider';
import { useEffect, useState } from 'react';
import { OnboardingOfficialDocs } from './OnboardingOfficialDocs';
import { OnboardingSelectableCard } from './OnboardingSelectableCard';
import { OnboardingStepFrame } from './OnboardingStepFrame';
import type { StepProps } from './onboarding.types';
import { useOnboardingDraft } from './useOnboardingDraft';

export function SpeechRecognitionStep({ payload }: StepProps) {
	const { data, update } = useOnboardingDraft();
	const [supported, setSupported] = useState<boolean | null>(null);
	const [regionOpen, setRegionOpen] = useState(false);
	const [languageOpen, setLanguageOpen] = useState(false);
	useEffect(() => {
		const speechWindow = window as Window & {
			SpeechRecognition?: unknown;
			webkitSpeechRecognition?: unknown;
		};
		const available = Boolean(
			speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition,
		);
		setSupported(available);
		if (!data.sttProvider)
			void update({
				sttProvider: getStoredSttProvider() ?? (available ? 'browser' : 'azure'),
				language: data.language ?? 'es-ES',
			});
	}, [data.sttProvider, data.language, update]);
	const provider = data.sttProvider;
	return (
		<OnboardingStepFrame title={payload.title} description={payload.description}>
			<fieldset aria-label='Reconocimiento de voz' className='space-y-3'>
				<OnboardingSelectableCard
					title='Navegador'
					description={
						supported
							? 'Disponible en este navegador. No necesitas introducir claves.'
							: 'Depende del reconocimiento de voz que ofrezca tu navegador.'
					}
					selected={provider === 'browser'}
					onClick={() =>
						void update({ sttProvider: 'browser', language: data.language ?? 'es-ES' })
					}
				/>
				<OnboardingSelectableCard
					title='Azure Speech'
					description='Usa un recurso Speech de Microsoft con su clave y región.'
					selected={provider === 'azure'}
					onClick={() => void update({ sttProvider: 'azure', language: data.language ?? 'es-ES' })}
				/>
			</fieldset>
			<SettingsDropdownField
				label='Idioma en el que hablarás'
				placeholder='Elige un idioma'
				value={data.language ?? 'es-ES'}
				options={azureLanguages}
				open={languageOpen}
				setOpen={setLanguageOpen}
				onChange={(language) => void update({ language })}
			/>
			{provider === 'browser' ? (
				<div className='space-y-3 text-sm leading-relaxed'>
					<p aria-live='polite'>
						{supported === null
							? 'Comprobando compatibilidad...'
							: supported
								? 'Reconocimiento disponible. Falta comprobar el permiso y la captura del micrófono.'
								: 'No detectamos reconocimiento de voz en este navegador. Prueba otro navegador compatible, usa Azure Speech o decide después.'}
					</p>
					<p className='text-muted-foreground'>
						En el estudio, inicia Servicio de emisión y pulsa el micrófono del dock para hablar con
						Sandy. El navegador te pedirá permiso al usarlo. No solicitamos el micrófono en este
						paso.
					</p>
				</div>
			) : (
				<div className='space-y-4'>
					<div className='space-y-2'>
						<label htmlFor='azure_speech_key' className='font-medium text-sm'>
							Clave de Azure Speech
						</label>
						<Input
							id='azure_speech_key'
							type='password'
							autoComplete='off'
							className='min-h-11'
							value={data.azureSpeechKey ?? ''}
							onChange={(event) => void update({ azureSpeechKey: event.target.value })}
						/>
					</div>
					<SettingsDropdownField
						label='Región del recurso de Azure'
						placeholder='Elige la región de tu recurso'
						value={data.azureRegion ?? ''}
						options={azureRegions}
						open={regionOpen}
						setOpen={setRegionOpen}
						onChange={(azureRegion) => void update({ azureRegion })}
					/>
					<OnboardingOfficialDocs
						title='encontrar la clave y la región'
						description='En Azure, abre el recurso Speech y copia ambos datos desde Claves y punto de conexión. La región debe ser la del mismo recurso.'
						links={[
							{
								label: 'Crear un recurso Speech',
								href: 'https://learn.microsoft.com/en-us/azure/ai-services/speech-service/get-started-speech-to-text',
								description: 'Guía oficial de Microsoft para obtener las credenciales.',
							},
						]}
					/>
				</div>
			)}
		</OnboardingStepFrame>
	);
}
