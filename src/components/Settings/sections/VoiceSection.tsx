'use client';

import { SettingsSectionCard } from '@/components/Settings/SettingsSectionCard';
import { FishVoiceDialog } from '@/components/Settings/FishVoiceDialog';
import { FishVoicePreviewCard } from '@/components/Settings/sections/FishVoicePreviewCard';
import type { SettingsFormState } from '@/components/Settings/settings.types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Volume2 } from 'lucide-react';
import { useState } from 'react';

type VoiceSectionProps = {
	form: SettingsFormState;
	fishState: string;
	updateField: (field: keyof SettingsFormState, value: string) => void;
};

export function VoiceSection({ form, fishState, updateField }: VoiceSectionProps) {
	const [isFishVoiceDialogOpen, setIsFishVoiceDialogOpen] = useState(false);

	return (
		<>
			<SettingsSectionCard
				icon={<Volume2 className='size-5' />}
				title='Voz sintética'
				description='Define la voz sintética. Puedes buscar voces en Fish Audio o pegar un Voice ID directo.'
				statusLabel={fishState}
				statusTone={
					fishState === 'Configurado'
						? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
						: 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400'
				}
			>
				<div className='mx-auto grid w-full max-w-6xl gap-6 xl:grid-cols-2 xl:items-start'>
					<div className='w-full max-w-xl space-y-4 justify-self-center xl:justify-self-end'>
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

						<div className='space-y-2'>
							<Label htmlFor='voice_id'>Fish Voice ID</Label>
							<Input
								id='voice_id'
								placeholder='id_de_voz_fish_audio'
								value={form.voice_id}
								onChange={(event) => updateField('voice_id', event.target.value)}
							/>
							<p className='text-muted-foreground text-xs'>
								Si ya tienes el Voice ID, puedes pegarlo aquí. Si no, usa el buscador.
							</p>
						</div>
					</div>

					<div className='w-full max-w-xl space-y-4 justify-self-center xl:justify-self-start'>
						<FishVoicePreviewCard
							apiKey={form.fish_audio_key}
							voiceId={form.voice_id}
							onClick={() => setIsFishVoiceDialogOpen(true)}
						/>
					</div>
				</div>
			</SettingsSectionCard>

			<FishVoiceDialog
				open={isFishVoiceDialogOpen}
				onOpenChange={setIsFishVoiceDialogOpen}
				apiKey={form.fish_audio_key}
				voiceId={form.voice_id}
				onPickVoiceId={(voiceId) => updateField('voice_id', voiceId)}
			/>
		</>
	);
}
