'use client';

import { saveSettings, type SettingsPayload } from '@/api/settings';
import { useAppSettings } from '@/context/AppSettingsContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type SettingsFormState = {
	ai_provider: 'gemini' | 'openrouter';
	gemini_api_key: string;
	openrouter_api_key: string;
	openrouter_model: string;
	stt_provider: string;
	tts_provider: string;
	azure_speech_key: string;
	azure_region: string;
	language: string;
	fish_audio_key: string;
	voice_id: string;
};

const initialState: SettingsFormState = {
	ai_provider: 'gemini',
	gemini_api_key: '',
	openrouter_api_key: '',
	openrouter_model: '',
	stt_provider: 'azure',
	tts_provider: 'fish_audio',
	azure_speech_key: '',
	azure_region: '',
	language: 'es-ES',
	fish_audio_key: '',
	voice_id: '',
};

const normalizeSettings = (settings?: SettingsPayload | null): SettingsFormState => ({
	ai_provider: settings?.ai_provider ?? 'gemini',
	gemini_api_key: settings?.gemini_api_key ?? '',
	openrouter_api_key: settings?.openrouter_api_key ?? '',
	openrouter_model: settings?.openrouter_model ?? '',
	stt_provider: settings?.stt_provider ?? 'azure',
	tts_provider: settings?.tts_provider ?? 'fish_audio',
	azure_speech_key: settings?.azure_speech_key ?? '',
	azure_region: settings?.azure_region ?? '',
	language: settings?.language ?? 'es-ES',
	fish_audio_key: settings?.fish_audio_key ?? '',
	voice_id: settings?.voice_id ?? '',
});

export function SettingsPanel() {
	const { getToken } = useAuth();
	const { settings, isLoading: settingsLoading, refreshSettings } = useAppSettings();
	const [form, setForm] = useState<SettingsFormState>(initialState);
	const [isSaving, setIsSaving] = useState(false);

	const activeProviderLabel = useMemo(
		() => (form.ai_provider === 'gemini' ? 'Gemini' : 'OpenRouter'),
		[form.ai_provider],
	);

	const providerBadgeClassName =
		form.ai_provider === 'gemini'
			? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
			: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400';
	const sttProviderBadgeClassName =
		form.stt_provider === 'azure'
			? 'border-violet-500/30 bg-violet-500/10 text-violet-400'
			: 'border-amber-500/30 bg-amber-500/10 text-amber-400';
	const ttsProviderBadgeClassName =
		form.tts_provider === 'fish_audio'
			? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
			: 'border-violet-500/30 bg-violet-500/10 text-violet-400';

	const geminiState = form.gemini_api_key ? 'Configurado' : 'Pendiente';
	const openRouterState = form.openrouter_api_key && form.openrouter_model ? 'Configurado' : 'Pendiente';
	const speechState = form.azure_speech_key && form.azure_region ? 'Configurado' : 'Pendiente';
	const fishState = form.fish_audio_key && form.voice_id ? 'Configurado' : 'Pendiente';
	const sttProviderLabel = form.stt_provider === 'azure' ? 'Azure' : form.stt_provider;
	const ttsProviderLabel = form.tts_provider === 'fish_audio' ? 'Fish Audio' : form.tts_provider;

	useEffect(() => {
		setForm(normalizeSettings(settings));
	}, [settings]);

	const updateField = (field: keyof SettingsFormState, value: string) => {
		setForm((current) => ({
			...current,
			[field]: value,
		}));
	};

	const handleProviderChange = (value: 'gemini' | 'openrouter') => {
		setForm((current) => ({
			...current,
			ai_provider: value,
			gemini_api_key: value === 'gemini' ? current.gemini_api_key : '',
			openrouter_api_key: value === 'openrouter' ? current.openrouter_api_key : '',
			openrouter_model: value === 'openrouter' ? current.openrouter_model : '',
		}));
	};

	const handleSave = async () => {
		try {
			setIsSaving(true);
			const token = await getToken();

			const payload: SettingsPayload = {
				ai_provider: form.ai_provider,
				gemini_api_key: form.ai_provider === 'gemini' ? form.gemini_api_key : '',
				openrouter_api_key: form.ai_provider === 'openrouter' ? form.openrouter_api_key : '',
				openrouter_model: form.ai_provider === 'openrouter' ? form.openrouter_model : '',
				stt_provider: form.stt_provider,
				tts_provider: form.tts_provider,
				azure_speech_key: form.azure_speech_key,
				azure_region: form.azure_region,
				language: form.language || 'es-ES',
				fish_audio_key: form.fish_audio_key,
				voice_id: form.voice_id,
			};

			await saveSettings(payload, { token });
			await refreshSettings();
			toast.success('Ajustes guardados');
		} catch (error) {
			console.error('Error al guardar settings:', error);
			toast.error('No se pudieron guardar los ajustes');
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Card className='border-border/60 bg-card/80 shadow-xl backdrop-blur-xl'>
			<CardHeader className='space-y-3 border-border/50 border-b'>
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<div className='space-y-2'>
						<CardTitle className='text-2xl'>Configuracion de IA</CardTitle>
						<CardDescription>
							Guarda IA, Azure Speech y Fish Audio por usuario Clerk.
						</CardDescription>
					</div>
					<Badge variant='outline' className={providerBadgeClassName}>
						{activeProviderLabel}
					</Badge>
				</div>
			</CardHeader>

			<CardContent className='grid gap-6 pt-6'>
				<div className='rounded-2xl border border-border/60 bg-background/50 p-4'>
					<div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
						<div>
							<p className='font-medium text-sm'>Estado actual</p>
							<p className='text-muted-foreground text-xs'>Datos cargados desde `GET /settings`.</p>
						</div>
						<Badge variant='outline' className='border-border/70 text-muted-foreground'>
							Sincronizado
						</Badge>
					</div>
					<div className='flex flex-wrap gap-2'>
						<Badge variant='outline' className={providerBadgeClassName}>
							Proveedor: {activeProviderLabel}
						</Badge>
						<Badge variant='outline' className={sttProviderBadgeClassName}>
							STT: {sttProviderLabel}
						</Badge>
						<Badge variant='outline' className={ttsProviderBadgeClassName}>
							TTS: {ttsProviderLabel}
						</Badge>
						<Badge
							variant='outline'
							className={
								form.ai_provider === 'gemini'
									? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
									: 'border-border/70 text-muted-foreground'
							}
						>
							Gemini: {geminiState}
						</Badge>
						<Badge
							variant='outline'
							className={
								form.ai_provider === 'openrouter'
									? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
									: 'border-border/70 text-muted-foreground'
							}
						>
							OpenRouter: {openRouterState}
						</Badge>
						<Badge
							variant='outline'
							className={
								speechState === 'Configurado'
									? 'border-violet-500/30 bg-violet-500/10 text-violet-400'
									: 'border-border/70 text-muted-foreground'
							}
						>
							Azure Speech: {speechState}
						</Badge>
						<Badge
							variant='outline'
							className={
								fishState === 'Configurado'
									? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
									: 'border-border/70 text-muted-foreground'
							}
						>
							Fish Audio: {fishState}
						</Badge>
					</div>
				</div>

				<div className='grid gap-4 lg:grid-cols-2'>
					<div className='space-y-2'>
						<Label htmlFor='ai_provider'>Proveedor de IA</Label>
						<select
							id='ai_provider'
							value={form.ai_provider}
							onChange={(event) => handleProviderChange(event.target.value as 'gemini' | 'openrouter')}
							className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'
						>
							<option value='gemini'>Gemini</option>
							<option value='openrouter'>OpenRouter</option>
						</select>
					</div>
					<div className='space-y-2'>
						<Label htmlFor='gemini_api_key'>Gemini API Key</Label>
						<Input
							id='gemini_api_key'
							type='password'
							placeholder='AIza...'
							value={form.gemini_api_key}
							onChange={(event) => updateField('gemini_api_key', event.target.value)}
							disabled={form.ai_provider !== 'gemini'}
						/>
					</div>
				</div>

				<div className='grid gap-4 lg:grid-cols-2'>
					<div className='space-y-2'>
						<Label htmlFor='openrouter_api_key'>OpenRouter API Key</Label>
						<Input
							id='openrouter_api_key'
							type='password'
							placeholder='sk-or-v1-...'
							value={form.openrouter_api_key}
							onChange={(event) => updateField('openrouter_api_key', event.target.value)}
							disabled={form.ai_provider !== 'openrouter'}
						/>
					</div>
					<div className='space-y-2'>
						<Label htmlFor='openrouter_model'>OpenRouter Model</Label>
						<Input
							id='openrouter_model'
							placeholder='meta-llama/llama-3.3-70b-instruct:free'
							value={form.openrouter_model}
							onChange={(event) => updateField('openrouter_model', event.target.value)}
							disabled={form.ai_provider !== 'openrouter'}
						/>
					</div>
				</div>

				<div className='grid gap-4 rounded-2xl border border-border/60 bg-background/40 p-4 lg:grid-cols-2'>
					<div className='space-y-2'>
						<Label htmlFor='stt_provider'>Proveedor STT</Label>
						<select
							id='stt_provider'
							value={form.stt_provider}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									stt_provider: event.target.value,
								}))
							}
							className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'
						>
							<option value='azure'>Azure</option>
							<option value='fish_audio'>Fish Audio</option>
						</select>
					</div>
					<div className='space-y-2'>
						<Label htmlFor='tts_provider'>Proveedor TTS</Label>
						<select
							id='tts_provider'
							value={form.tts_provider}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									tts_provider: event.target.value,
								}))
							}
							className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'
						>
							<option value='fish_audio'>Fish Audio</option>
							<option value='azure'>Azure</option>
						</select>
					</div>
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
					<div className='space-y-2'>
						<Label htmlFor='azure_region'>Azure Region</Label>
						<Input
							id='azure_region'
							placeholder='eastus'
							value={form.azure_region}
							onChange={(event) => updateField('azure_region', event.target.value)}
						/>
					</div>
					<div className='space-y-2'>
						<Label htmlFor='language'>Idioma</Label>
						<Input
							id='language'
							placeholder='es-ES'
							value={form.language}
							onChange={(event) => updateField('language', event.target.value)}
						/>
					</div>
					<div className='space-y-2'>
						<Label htmlFor='fish_audio_key'>Fish Audio Key</Label>
						<Input
							id='fish_audio_key'
							type='password'
							placeholder='tu_clave_de_fish_audio'
							value={form.fish_audio_key}
							onChange={(event) => updateField('fish_audio_key', event.target.value)}
						/>
					</div>
					<div className='space-y-2 lg:col-span-2'>
						<Label htmlFor='voice_id'>Fish Voice ID</Label>
						<Input
							id='voice_id'
							placeholder='id_de_voz_fish_audio'
							value={form.voice_id}
							onChange={(event) => updateField('voice_id', event.target.value)}
						/>
					</div>
				</div>

				<div className='flex flex-col gap-3 border-border/50 border-t pt-4 sm:flex-row sm:items-center sm:justify-between'>
					<p className='text-muted-foreground text-sm'>
						Los secretos se guardan en SQLite por usuario Clerk. No dejes esto como la unica fuente de verdad.
					</p>
					<Button onClick={handleSave} disabled={settingsLoading || isSaving}>
						{isSaving ? 'Guardando...' : 'Guardar configuracion'}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
