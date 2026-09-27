'use client';

import { getVoiceEdge } from '@/api/fetchEdgeTts';
import { getVoiceLocal } from '@/api/fetchLocalTts';
import { FishVoiceDialog } from '@/components/Settings/FishVoiceDialog';
import { SettingsSectionCard } from '@/components/Settings/SettingsSectionCard';
import { FishVoicePreviewCard } from '@/components/Settings/sections/FishVoicePreviewCard';
import type { SettingsFormState } from '@/components/Settings/settings.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	EDGE_VOICE_PRESETS,
	type EdgeTtsConfig,
	type LocalTtsConfig,
	type TtsProvider,
	getStoredEdgeTtsConfig,
	getStoredLocalTtsConfig,
	storeEdgeTtsConfig,
	storeLocalTtsConfig,
} from '@/lib/tts-provider';
import { Cloud, Cpu, Play, Server, Sparkles, Square, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type VoiceSectionProps = {
	form: SettingsFormState;
	fishState: string;
	updateField: (field: keyof SettingsFormState, value: string) => void;
	onProviderChange?: (value: TtsProvider) => void;
};

export function VoiceSection({
	form,
	fishState,
	updateField,
	onProviderChange,
}: VoiceSectionProps) {
	const [isFishVoiceDialogOpen, setIsFishVoiceDialogOpen] = useState(false);
	const [edgeConfig, setEdgeConfig] = useState<EdgeTtsConfig>(getStoredEdgeTtsConfig);
	const [localConfig, setLocalConfig] = useState<LocalTtsConfig>(getStoredLocalTtsConfig);
	const [isPlayingTest, setIsPlayingTest] = useState(false);
	const currentAudioRef = useRef<HTMLAudioElement | null>(null);

	const activeProvider: TtsProvider = form.tts_provider || 'edge_tts';

	useEffect(() => {
		setEdgeConfig(getStoredEdgeTtsConfig());
		setLocalConfig(getStoredLocalTtsConfig());
	}, []);

	const handleProviderSwitch = (value: string) => {
		const provider = value as TtsProvider;
		onProviderChange?.(provider);
		updateField('tts_provider', provider);
	};

	const handleEdgeChange = (updates: Partial<EdgeTtsConfig>) => {
		const next = { ...edgeConfig, ...updates };
		setEdgeConfig(next);
		storeEdgeTtsConfig(updates);
	};

	const handleLocalChange = (updates: Partial<LocalTtsConfig>) => {
		const next = { ...localConfig, ...updates };
		setLocalConfig(next);
		storeLocalTtsConfig(updates);
	};

	const stopTestAudio = () => {
		if (currentAudioRef.current) {
			currentAudioRef.current.pause();
			currentAudioRef.current = null;
		}
		setIsPlayingTest(false);
	};

	const playTestSpeech = async (provider: TtsProvider) => {
		stopTestAudio();
		setIsPlayingTest(true);

		try {
			let blob: Blob;
			const sampleText = '¡Hola! Soy Sandy, tu compañera y asistente virtual. ¿Cómo estás hoy?';

			if (provider === 'edge_tts') {
				toast.info('Sintetizando voz de prueba con Edge TTS...');
				blob = await getVoiceEdge(sampleText, edgeConfig);
			} else if (provider === 'local_tts') {
				toast.info(`Conectando con servidor local en ${localConfig.baseUrl}...`);
				blob = await getVoiceLocal(sampleText, localConfig);
			} else {
				toast.error('Usa el reproductor de vista previa de Fish Audio debajo');
				setIsPlayingTest(false);
				return;
			}

			if (!blob || blob.size === 0) {
				throw new Error('No se generó audio en la síntesis');
			}

			const audioUrl = URL.createObjectURL(blob);
			const audio = new Audio(audioUrl);
			currentAudioRef.current = audio;

			audio.onended = () => {
				setIsPlayingTest(false);
				URL.revokeObjectURL(audioUrl);
			};

			audio.onerror = (e) => {
				console.error('Error al reproducir audio:', e);
				toast.error('Error al reproducir el audio de prueba');
				setIsPlayingTest(false);
				URL.revokeObjectURL(audioUrl);
			};

			await audio.play();
			toast.success('¡Audio reproducido correctamente!');
		} catch (error) {
			console.error('Fallo en la prueba de voz:', error);
			const msg =
				error instanceof Error ? error.message : 'Error al conectar con el servicio de voz';
			toast.error(msg);
			setIsPlayingTest(false);
		}
	};

	return (
		<>
			<SettingsSectionCard
				icon={<Volume2 className='size-5' />}
				title='Voz sintética (TTS)'
				description='Elige el motor de voz de Sandy: gratuito en la nube (Edge TTS), local en tu PC con voz clonada (XTTS-v2), o Fish Audio.'
				statusLabel={fishState}
				statusTone={
					activeProvider === 'edge_tts'
						? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
						: fishState === 'Configurado'
							? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
							: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
				}
				highlighted
			>
				<Tabs value={activeProvider} onValueChange={handleProviderSwitch} className='w-full'>
					<TabsList className='grid w-full grid-cols-3'>
						<TabsTrigger value='edge_tts' className='flex items-center gap-2'>
							<Sparkles className='size-4 text-emerald-500' />
							<span className='truncate'>Edge TTS (Gratis)</span>
						</TabsTrigger>
						<TabsTrigger value='local_tts' className='flex items-center gap-2'>
							<Server className='size-4 text-violet-500' />
							<span className='truncate'>Local / Voz Clonada</span>
						</TabsTrigger>
						<TabsTrigger value='fish_audio' className='flex items-center gap-2'>
							<Cloud className='size-4 text-sky-500' />
							<span className='truncate'>Fish Audio</span>
						</TabsTrigger>
					</TabsList>

					{/* 1. EDGE TTS (100% GRATUITO) */}
					<TabsContent value='edge_tts' className='space-y-6 pt-5'>
						<div className='flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4'>
							<div className='space-y-1'>
								<div className='flex items-center gap-2'>
									<Badge className='border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'>
										100% Gratuito
									</Badge>
									<span className='font-semibold text-sm'>Voces Neurales de Microsoft</span>
								</div>
								<p className='text-muted-foreground text-xs'>
									Sin límites prácticos, sin API key y sin consumo de tarjeta gráfica (GPU). Ideal
									para comenzar de inmediato.
								</p>
							</div>

							<Button
								type='button'
								variant='outline'
								size='sm'
								onClick={() => (isPlayingTest ? stopTestAudio() : playTestSpeech('edge_tts'))}
								disabled={isPlayingTest && !currentAudioRef.current}
								className='flex items-center gap-2 border-emerald-500/30 hover:bg-emerald-500/10'
							>
								{isPlayingTest ? (
									<>
										<Square className='size-3.5 fill-current text-destructive' />
										<span>Detener prueba</span>
									</>
								) : (
									<>
										<Play className='size-3.5 fill-current text-emerald-500' />
										<span>Probar voz</span>
									</>
								)}
							</Button>
						</div>

						<div className='grid gap-4 sm:grid-cols-2'>
							<div className='space-y-2 sm:col-span-2'>
								<Label htmlFor='edge_voice'>Voz Neural</Label>
								<select
									id='edge_voice'
									value={edgeConfig.voice}
									onChange={(e) => handleEdgeChange({ voice: e.target.value })}
									className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
								>
									{EDGE_VOICE_PRESETS.map((preset) => (
										<option key={preset.id} value={preset.id}>
											{preset.name} ({preset.lang})
										</option>
									))}
								</select>
								<p className='text-muted-foreground text-xs'>
									Recomendada: <strong>España - Elvira</strong> (tono suave y natural para Sandy) o{' '}
									<strong>México - Dalia</strong>.
								</p>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='edge_rate'>Velocidad (Rate)</Label>
								<select
									id='edge_rate'
									value={edgeConfig.rate || '+0%'}
									onChange={(e) => handleEdgeChange({ rate: e.target.value })}
									className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
								>
									<option value='-20%'>Muy lento (-20%)</option>
									<option value='-10%'>Lento (-10%)</option>
									<option value='+0%'>Normal (+0%)</option>
									<option value='+10%'>Rápido (+10%)</option>
									<option value='+20%'>Muy rápido (+20%)</option>
									<option value='+30%'>Ultra rápido (+30%)</option>
								</select>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='edge_pitch'>Tono (Pitch)</Label>
								<select
									id='edge_pitch'
									value={edgeConfig.pitch || '+0Hz'}
									onChange={(e) => handleEdgeChange({ pitch: e.target.value })}
									className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
								>
									<option value='-30Hz'>Muy grave (-30Hz)</option>
									<option value='-15Hz'>Grave (-15Hz)</option>
									<option value='+0Hz'>Normal (+0Hz)</option>
									<option value='+15Hz'>Agudo (+15Hz)</option>
									<option value='+30Hz'>Muy agudo (+30Hz)</option>
									<option value='+50Hz'>Anime / VTuber (+50Hz)</option>
								</select>
							</div>
						</div>
					</TabsContent>

					{/* 2. LOCAL TTS / VOZ CLONADA */}
					<TabsContent value='local_tts' className='space-y-6 pt-5'>
						<div className='flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4'>
							<div className='space-y-1'>
								<div className='flex items-center gap-2'>
									<Badge className='border-violet-500/30 bg-violet-500/15 text-violet-600 dark:text-violet-400'>
										Voz Clonada Local
									</Badge>
									<span className='font-semibold text-sm'>XTTS-v2 / Kokoro / OpenAI API</span>
								</div>
								<p className='text-muted-foreground text-xs'>
									Ejecuta la síntesis de voz directamente en tu tarjeta gráfica o CPU usando
									servidores compatibles con el estándar OpenAI (
									<code className='rounded bg-muted px-1'>/v1/audio/speech</code>).
								</p>
							</div>

							<Button
								type='button'
								variant='outline'
								size='sm'
								onClick={() => (isPlayingTest ? stopTestAudio() : playTestSpeech('local_tts'))}
								disabled={isPlayingTest && !currentAudioRef.current}
								className='flex items-center gap-2 border-violet-500/30 hover:bg-violet-500/10'
							>
								{isPlayingTest ? (
									<>
										<Square className='size-3.5 fill-current text-destructive' />
										<span>Detener prueba</span>
									</>
								) : (
									<>
										<Play className='size-3.5 fill-current text-violet-500' />
										<span>Probar servidor</span>
									</>
								)}
							</Button>
						</div>

						<div className='grid gap-4 sm:grid-cols-2'>
							<div className='space-y-2'>
								<Label htmlFor='local_tts_url'>URL del Servidor TTS Local</Label>
								<Input
									id='local_tts_url'
									placeholder='http://localhost:8020'
									value={localConfig.baseUrl}
									onChange={(e) => handleLocalChange({ baseUrl: e.target.value })}
								/>
								<p className='text-muted-foreground text-xs'>
									Por defecto: <code className='rounded bg-muted px-1'>http://localhost:8020</code>{' '}
									(AllTalk TTS, XTTS streaming, Kokoro-FastAPI).
								</p>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='local_tts_voice'>ID de Voz Clonada / Speaker</Label>
								<Input
									id='local_tts_voice'
									placeholder='sandy'
									value={localConfig.voice}
									onChange={(e) => handleLocalChange({ voice: e.target.value })}
								/>
								<p className='text-muted-foreground text-xs'>
									Nombre del speaker, muestra de audio de referencia o voz configurada en tu
									servidor local.
								</p>
							</div>
						</div>

						<div className='rounded-xl border border-border/60 bg-muted/40 p-4 text-muted-foreground text-xs leading-relaxed'>
							<div className='mb-1 flex items-center gap-1.5 font-semibold text-foreground'>
								<Cpu className='size-4 text-violet-500' />
								¿Cómo clonar la voz de Sandy localmente?
							</div>
							<p>
								Puedes levantar un contenedor o servidor Python local con{' '}
								<strong>Coqui XTTS-v2</strong> o <strong>AllTalk TTS</strong>, colocar un audio de 6
								segundos con la voz que desees en la carpeta de voces con el nombre{' '}
								<code className='font-mono'>sandy.wav</code>, y Sandy hablará con esa voz exacta sin
								ningún coste de suscripción ni conexión a internet.
							</p>
						</div>
					</TabsContent>

					{/* 3. FISH AUDIO (NUBE) */}
					<TabsContent value='fish_audio' className='space-y-6 pt-5'>
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
										Si ya tienes el Voice ID, puedes pegarlo aquí. Si no, usa el buscador lateral.
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
					</TabsContent>
				</Tabs>
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
