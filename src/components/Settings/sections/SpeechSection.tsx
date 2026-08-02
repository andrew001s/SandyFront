import { SettingsDropdownField } from '@/components/Settings/SettingsDropdownField';
import { SettingsSectionCard } from '@/components/Settings/SettingsSectionCard';
import {
	type SettingsFormState,
	type DropdownOption,
} from '@/components/Settings/settings.types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mic } from 'lucide-react';

type SpeechSectionProps = {
	form: SettingsFormState;
	speechState: string;
	browserSupportsNativeSpeech: boolean;
	isAzureRegionOpen: boolean;
	setIsAzureRegionOpen: (open: boolean) => void;
	isAzureLanguageOpen: boolean;
	setIsAzureLanguageOpen: (open: boolean) => void;
	updateField: (field: keyof SettingsFormState, value: string) => void;
	updateSttProvider: (value: 'azure' | 'browser') => void;
	azureRegions: DropdownOption[];
	azureLanguages: DropdownOption[];
};

export function SpeechSection({
	form,
	speechState,
	browserSupportsNativeSpeech,
	isAzureRegionOpen,
	setIsAzureRegionOpen,
	isAzureLanguageOpen,
	setIsAzureLanguageOpen,
	updateField,
	updateSttProvider,
	azureRegions,
	azureLanguages,
}: SpeechSectionProps) {
	return (
		<SettingsSectionCard
			icon={<Mic className='size-5' />}
			title='Reconocimiento de voz'
			description='Convierte tu voz en texto con Azure o con el reconocimiento gratuito del navegador.'
			statusLabel={speechState}
			statusTone={
				speechState === 'Configurado'
					? 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400'
					: speechState === 'No compatible'
						? 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
						: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
			}
		>
			<Tabs
				value={form.stt_provider === 'browser' ? 'browser' : 'azure'}
				onValueChange={(value) => updateSttProvider(value as 'azure' | 'browser')}
				className='w-full'
			>
				<TabsList className='w-full'>
					<TabsTrigger value='azure' className='flex-1'>
						Azure
					</TabsTrigger>
					<TabsTrigger value='browser' className='flex-1'>
						Navegador (gratis)
					</TabsTrigger>
				</TabsList>

				<TabsContent value='browser'>
					<div className='space-y-4 pt-4'>
						<div className='rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-cyan-700 text-sm dark:text-cyan-300'>
							Usa el reconocimiento de voz integrado en tu navegador, sin coste ni claves. Solo
							disponible en navegadores basados en Chromium (Google Chrome, Edge, Brave, Opera,
							Vivaldi).
						</div>
						{browserSupportsNativeSpeech ? (
							<div className='rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-700 text-sm dark:text-emerald-300'>
								Tu navegador es compatible. No hace falta configurar nada más.
							</div>
						) : (
							<div className='rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-700 text-sm dark:text-red-300'>
								Tu navegador no es compatible con esta opción. Solo funciona en Google Chrome y
								otros navegadores basados en Chromium.
							</div>
						)}
						<SettingsDropdownField
							label='Idioma'
							placeholder='Selecciona un idioma'
							value={form.language}
							options={azureLanguages}
							open={isAzureLanguageOpen}
							setOpen={setIsAzureLanguageOpen}
							onChange={(value) => updateField('language', value)}
						/>
					</div>
				</TabsContent>

				<TabsContent value='azure'>
					<div className='grid gap-4 pt-4 lg:grid-cols-2'>
						<div className='space-y-2'>
							<Label htmlFor='azure_speech_key'>Azure Speech Key</Label>
							<Input
								id='azure_speech_key'
								type='password'
								placeholder='tu_clave_de_azure_speech'
								value={form.azure_speech_key}
								onChange={(event) => updateField('azure_speech_key', event.target.value)}
							/>
						</div>
						<SettingsDropdownField
							label='Azure Region'
							placeholder='Selecciona una región'
							value={form.azure_region}
							options={azureRegions}
							open={isAzureRegionOpen}
							setOpen={setIsAzureRegionOpen}
							onChange={(value) => updateField('azure_region', value)}
						/>
						<SettingsDropdownField
							label='Idioma de Azure'
							placeholder='Selecciona un idioma'
							value={form.language}
							options={azureLanguages}
							open={isAzureLanguageOpen}
							setOpen={setIsAzureLanguageOpen}
							onChange={(value) => updateField('language', value)}
							className='lg:col-span-2'
						/>
					</div>
				</TabsContent>
			</Tabs>
		</SettingsSectionCard>
	);
}
