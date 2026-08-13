'use client';

import { saveSettings } from '@/api/settings';
import { FishVoiceDialog } from '@/components/Settings/FishVoiceDialog';
import { FishVoicePreviewCard } from '@/components/Settings/sections/FishVoicePreviewCard';
import { OnboardingOfficialDocs } from '@/components/onboarding/OnboardingOfficialDocs';
import { OnboardingSectionHeader } from '@/components/onboarding/OnboardingSectionHeader';
import { OnboardingStepFrame } from '@/components/onboarding/OnboardingStepFrame';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@clerk/nextjs';
import type { OnboardingFlowData, StepProps, SandyOnboardingContext } from '@/components/onboarding/onboarding.types';
import { useOnboarding } from '@onboardjs/react';
import { motion } from 'framer-motion';
import { Smile, Sparkles, Volume2 } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

export function VoiceStep({ payload }: StepProps) {
	const { state, updateContext } = useOnboarding<SandyOnboardingContext>();
	const { getToken } = useAuth();
	const flowData = state?.context.flowData;
	const [fishKey, setFishKey] = useState(flowData?.fishAudioKey ?? '');
	const [voiceId, setVoiceId] = useState(flowData?.voiceId ?? '');
	const [isFishVoiceDialogOpen, setIsFishVoiceDialogOpen] = useState(false);
	const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const persist = useCallback(
		async (patch: Partial<OnboardingFlowData>) => {
			const nextFlow = { ...state?.context.flowData, ...patch };
			void updateContext({ flowData: nextFlow });
			if (saveTimer.current) clearTimeout(saveTimer.current);
			saveTimer.current = setTimeout(async () => {
				try {
					const token = await getToken();
					await saveSettings(
						{
							tts_provider: 'fish',
							fish_audio_key: nextFlow.fishAudioKey,
							voice_id: nextFlow.voiceId,
						},
						{ token },
					);
				} catch {
					toast.error('No se pudo guardar la configuración de voz');
				}
			}, 500);
		},
		[getToken, state?.context.flowData, updateContext],
	);

	return (
		<OnboardingStepFrame title={payload.title} description={payload.description}>
			<motion.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.32 }}
			>
				<Card className='overflow-hidden border-border/60 bg-card/80 shadow-[0_20px_60px_rgba(0,0,0,0.10)] backdrop-blur-sm'>
					<div className='flex flex-col gap-0'>
						<div className='border-border/60 border-b p-5 sm:p-6'>
							<OnboardingSectionHeader
								eyebrow='Fish Audio'
								title='API key'
								description='Agrega tu acceso para habilitar la selección de voz.'
								icon={<Volume2 className='size-4' />}
							/>

							<div className='mt-6 space-y-2'>
								<label htmlFor='fish-key' className='font-medium text-muted-foreground text-sm'>
									Clave
								</label>
								<Input
									id='fish-key'
									type='password'
									value={fishKey}
									onChange={(event) => {
										setFishKey(event.target.value);
										void persist({ fishAudioKey: event.target.value });
									}}
									placeholder='FM0LwDs...'
									className='h-12 rounded-2xl border-border/70 bg-background/80'
								/>
							</div>

							<p className='mt-4 flex items-start gap-2 text-muted-foreground text-xs leading-relaxed'>
								<Smile className='mt-0.5 size-4 shrink-0' />
								La voz se elige abajo, sin repetir información.
							</p>
						</div>

						<div className='p-5 sm:p-6'>
							<OnboardingSectionHeader
								eyebrow='Fish Voice'
								title='Selecciona la voz'
								description='Toca la preview para abrir el selector visual y escoger una voz.'
								icon={<Sparkles className='size-4' />}
							/>

							<div className='mt-5'>
								<FishVoicePreviewCard
									apiKey={fishKey}
									voiceId={voiceId}
									onClick={() => setIsFishVoiceDialogOpen(true)}
								/>
							</div>
						</div>
					</div>
				</Card>
			</motion.div>

			<OnboardingOfficialDocs
				title='Documentación oficial'
				description='Si quieres crear la key o revisar cómo funciona la voz, abre estas guías de Fish Audio.'
				links={[
					{
						label: 'Crear API key',
						href: 'https://fish.audio/app/api-keys/',
						description: 'Abrir el panel oficial de claves.',
					},
					{
						label: 'Quickstart',
						href: 'https://docs.fish.audio/developer-guide/getting-started/quickstart',
						description: 'Ver la guía oficial para empezar con TTS.',
					},
				]}
				className='pt-2'
			/>

			<FishVoiceDialog
				open={isFishVoiceDialogOpen}
				onOpenChange={setIsFishVoiceDialogOpen}
				apiKey={fishKey}
				voiceId={voiceId}
				onPickVoiceId={(pickedVoiceId) => {
					setVoiceId(pickedVoiceId);
					void persist({ voiceId: pickedVoiceId });
				}}
			/>
		</OnboardingStepFrame>
	);
}
