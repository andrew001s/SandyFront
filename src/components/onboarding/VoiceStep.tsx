'use client';

import { getVoiceEdge } from '@/api/fetchEdgeTts';
import { getVoiceSandy } from '@/api/fetchFishAudio';
import { getVoiceLocal } from '@/api/fetchLocalTts';
import { FishVoiceDialog } from '@/components/Settings/FishVoiceDialog';
import { FishVoicePreviewCard } from '@/components/Settings/sections/FishVoicePreviewCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	EDGE_VOICE_PRESETS,
	type TtsProvider,
	getStoredEdgeTtsConfig,
	getStoredLocalTtsConfig,
	getStoredTtsProvider,
} from '@/lib/tts-provider';
import { useCallback, useEffect, useRef, useState } from 'react';
import { OnboardingOfficialDocs } from './OnboardingOfficialDocs';
import { OnboardingSelectableCard } from './OnboardingSelectableCard';
import { OnboardingStepFrame } from './OnboardingStepFrame';
import type { StepProps } from './onboarding.types';
import { voiceSignature } from './onboardingReadiness';
import { useOnboardingDraft } from './useOnboardingDraft';

const providers: { id: TtsProvider; label: string; description: string }[] = [
	{
		id: 'edge_tts',
		label: 'Edge TTS',
		description: 'Voces predefinidas sin introducir una clave de API.',
	},
	{
		id: 'fish_audio',
		label: 'Fish Audio',
		description: 'Necesitas una clave y una voz de tu cuenta de Fish Audio.',
	},
	{
		id: 'local_tts',
		label: 'Servidor local',
		description: 'Usa el servicio de voz compatible que ya tengas en tu equipo.',
	},
];
const selectClass =
	'min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring';

export function VoiceStep({ payload }: StepProps) {
	const { data, update } = useOnboardingDraft();
	const provider = data.ttsProvider ?? getStoredTtsProvider();
	const edge = data.edgeTts ?? getStoredEdgeTtsConfig();
	const local = data.localTts ?? getStoredLocalTtsConfig();
	const [dialog, setDialog] = useState(false);
	const [phase, setPhase] = useState<'idle' | 'loading' | 'playing' | 'done'>('idle');
	const [error, setError] = useState<string | null>(null);
	const controller = useRef<AbortController | null>(null);
	const audio = useRef<HTMLAudioElement | null>(null);
	const url = useRef<string | null>(null);
	const cleanup = useCallback(() => {
		controller.current?.abort();
		controller.current = null;
		if (audio.current) {
			audio.current.onended = null;
			audio.current.onerror = null;
			audio.current.pause();
			audio.current = null;
		}
		if (url.current) {
			URL.revokeObjectURL(url.current);
			url.current = null;
		}
	}, []);
	const stop = () => {
		cleanup();
		setPhase('idle');
	};
	useEffect(() => cleanup, [cleanup]);
	useEffect(() => {
		if (!data.ttsProvider || !data.edgeTts || !data.localTts)
			void update({ ttsProvider: provider, edgeTts: edge, localTts: local });
	}, [data.ttsProvider, data.edgeTts, data.localTts, provider, edge, local, update]);
	const preview = async () => {
		cleanup();
		setError(null);
		setPhase('loading');
		const request = new AbortController();
		controller.current = request;
		const snapshot = { ...data, ttsProvider: provider, edgeTts: edge, localTts: local };
		try {
			const sample = 'Hola, soy Sandy. Esta es una prueba de mi voz.';
			const options = { signal: request.signal };
			const blob =
				provider === 'edge_tts'
					? await getVoiceEdge(sample, edge, options)
					: provider === 'local_tts'
						? await getVoiceLocal(sample, local, options)
						: await getVoiceSandy(
								sample,
								{ apiKey: data.fishAudioKey ?? '', voiceId: data.voiceId ?? '' },
								options,
							);
			if (request.signal.aborted) return;
			if (!blob.size) throw new Error('La respuesta de audio llegó vacía.');
			url.current = URL.createObjectURL(blob);
			const player = new Audio(url.current);
			audio.current = player;
			player.onended = () => {
				if (request.signal.aborted) return;
				void update({ voiceTestSignature: voiceSignature(snapshot) });
				cleanup();
				setPhase('done');
			};
			player.onerror = () => {
				if (request.signal.aborted) return;
				cleanup();
				setPhase('idle');
				setError('No se pudo reproducir el audio. Revisa la salida de sonido y vuelve a probar.');
			};
			await player.play();
			if (!request.signal.aborted) setPhase('playing');
		} catch {
			if (request.signal.aborted) return;
			cleanup();
			setPhase('idle');
			setError(
				'No se pudo probar la voz. Revisa los datos del proveedor y tu conexión; después reintenta.',
			);
		}
	};
	const switchProvider = (value: TtsProvider) => {
		stop();
		setError(null);
		void update({ ttsProvider: value, edgeTts: edge, localTts: local });
	};
	return (
		<OnboardingStepFrame title={payload.title} description={payload.description}>
			<fieldset aria-label='Proveedor de voz' className='space-y-3'>
				{providers.map((option) => (
					<OnboardingSelectableCard
						key={option.id}
						title={option.label}
						description={option.description}
						selected={provider === option.id}
						onClick={() => switchProvider(option.id)}
					/>
				))}
			</fieldset>
			{provider === 'edge_tts' && (
				<div className='space-y-2'>
					<label htmlFor='onboarding-edge-voice' className='font-medium text-sm'>
						Voz de Sandy
					</label>
					<select
						id='onboarding-edge-voice'
						className={selectClass}
						value={edge.voice}
						onChange={(event) => {
							stop();
							void update({ edgeTts: { ...edge, voice: event.target.value } });
						}}
					>
						{EDGE_VOICE_PRESETS.map((voice) => (
							<option key={voice.id} value={voice.id}>
								{voice.name}
							</option>
						))}
					</select>
					<p className='text-muted-foreground text-sm'>
						Velocidad y tono están disponibles después en Configuración. Necesitas conexión para
						generar la voz.
					</p>
				</div>
			)}
			{provider === 'local_tts' && (
				<div className='space-y-4'>
					<div className='space-y-2'>
						<label htmlFor='onboarding-local-tts' className='font-medium text-sm'>
							URL del servidor de voz
						</label>
						<Input
							id='onboarding-local-tts'
							type='url'
							className='min-h-11'
							value={local.baseUrl}
							onChange={(event) => {
								stop();
								void update({ localTts: { ...local, baseUrl: event.target.value } });
							}}
						/>
						<p className='text-muted-foreground text-sm'>
							El servicio debe estar encendido y aceptar solicitudes desde este navegador.
						</p>
					</div>
					<div className='space-y-2'>
						<label htmlFor='onboarding-local-voice' className='font-medium text-sm'>
							Identificador de voz
						</label>
						<Input
							id='onboarding-local-voice'
							className='min-h-11'
							value={local.voice}
							onChange={(event) => {
								stop();
								void update({ localTts: { ...local, voice: event.target.value } });
							}}
						/>
					</div>
				</div>
			)}
			{provider === 'fish_audio' && (
				<div className='space-y-4'>
					<div className='space-y-2'>
						<label htmlFor='fish-key' className='font-medium text-sm'>
							Clave de API de Fish Audio
						</label>
						<Input
							id='fish-key'
							type='password'
							autoComplete='off'
							className='min-h-11'
							value={data.fishAudioKey ?? ''}
							onChange={(event) => {
								stop();
								void update({ fishAudioKey: event.target.value });
							}}
						/>
					</div>
					<div className='space-y-2'>
						<label htmlFor='onboarding-fish-voice' className='font-medium text-sm'>
							Identificador de voz
						</label>
						<Input
							id='onboarding-fish-voice'
							className='min-h-11'
							value={data.voiceId ?? ''}
							onChange={(event) => {
								stop();
								void update({ voiceId: event.target.value });
							}}
						/>
						<Button
							type='button'
							variant='outline'
							className='min-h-11'
							disabled={!data.fishAudioKey?.trim()}
							onClick={() => setDialog(true)}
						>
							Buscar una voz en Fish Audio
						</Button>
						<p className='text-muted-foreground text-sm'>
							Pega una voz que ya conozcas o introduce tu clave para abrir el buscador. La prueba
							usa tu cuenta del proveedor.
						</p>
					</div>
					<FishVoicePreviewCard
						apiKey={data.fishAudioKey ?? ''}
						voiceId={data.voiceId ?? ''}
						onClick={data.fishAudioKey?.trim() ? () => setDialog(true) : undefined}
					/>
					<OnboardingOfficialDocs
						title='conseguir mi clave y elegir una voz'
						links={[
							{
								label: 'Claves de Fish Audio',
								href: 'https://fish.audio/app/api-keys/',
								description: 'Crea una clave en tu cuenta y pégala en el campo de arriba.',
							},
						]}
					/>
				</div>
			)}
			<div className='space-y-3 border-border border-t pt-5'>
				<Button
					type='button'
					variant='outline'
					className='min-h-11'
					onClick={() => (phase === 'loading' || phase === 'playing' ? stop() : void preview())}
					disabled={
						provider === 'fish_audio' && (!data.fishAudioKey?.trim() || !data.voiceId?.trim())
					}
				>
					{phase === 'loading'
						? 'Cancelar prueba'
						: phase === 'playing'
							? 'Detener prueba'
							: 'Escuchar frase de prueba'}
				</Button>
				<p aria-live='polite' className='text-muted-foreground text-sm leading-relaxed'>
					{phase === 'loading'
						? 'Generando el audio de prueba...'
						: phase === 'playing'
							? 'Reproduciendo la frase de Sandy.'
							: phase === 'done'
								? 'La frase terminó de reproducirse con esta configuración.'
								: 'La prueba comprueba la voz. Todavía no inicia el avatar ni el servicio de emisión.'}
				</p>
				{error && (
					<p role='alert' className='text-sm leading-relaxed'>
						{error}
					</p>
				)}
			</div>
			<FishVoiceDialog
				open={dialog}
				onOpenChange={setDialog}
				apiKey={data.fishAudioKey ?? ''}
				voiceId={data.voiceId ?? ''}
				onPickVoiceId={(voiceId) => {
					stop();
					void update({ voiceId });
				}}
			/>
		</OnboardingStepFrame>
	);
}
