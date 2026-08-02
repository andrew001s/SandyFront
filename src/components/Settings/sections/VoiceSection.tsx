import { SettingsSectionCard } from '@/components/Settings/SettingsSectionCard';
import { type SettingsFormState } from '@/components/Settings/settings.types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Volume2 } from 'lucide-react';

type VoiceSectionProps = {
	form: SettingsFormState;
	fishState: string;
	updateField: (field: keyof SettingsFormState, value: string) => void;
};

export function VoiceSection({ form, fishState, updateField }: VoiceSectionProps) {
	return (
		<SettingsSectionCard
			icon={<Volume2 className='size-5' />}
			title='Voz sintética'
			description='Define la voz sintética. Por ahora solo usa Fish Audio.'
			statusLabel={fishState}
			statusTone={
				fishState === 'Configurado'
					? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
					: 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400'
			}
		>
			<div className='grid gap-4 lg:grid-cols-2'>
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
				</div>
			</div>
		</SettingsSectionCard>
	);
}
