'use client';

import { getVoiceEdge } from '@/api/fetchEdgeTts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { KOFI_URL } from '@/lib/links';
import { DEFAULT_EDGE_VOICE } from '@/lib/tts-provider';
import {
	ArrowRight,
	CheckCircle2,
	Coffee,
	Cpu,
	ExternalLink,
	Gift,
	Heart,
	Loader2,
	Play,
	Sparkles,
	Square,
	Volume2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export const SANDY_NEWS_STORAGE_KEY = 'sandy_news_last_seen_version';
export const CURRENT_NEWS_VERSION = '0.2.1';
export const OPEN_NEWS_MODAL_EVENT = 'open-sandy-news-modal';

export const openNewsModal = () => {
	if (typeof window !== 'undefined') {
		window.dispatchEvent(new CustomEvent(OPEN_NEWS_MODAL_EVENT));
	}
};

const NEWS_FEATURES = [
	{
		title: 'Voz Clonada Local (XTTS-v2 & Kokoro)',
		category: 'Hardware & Privacidad',
		badge: '100% Privado',
		badgeColor: 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400',
		icon: Cpu,
		iconColor: 'text-violet-500 dark:text-violet-400',
		iconBg: 'bg-violet-500/10 border-violet-500/20',
		description:
			'Conecta tu servidor local compatible (/v1/audio/speech) para que tu Vtuber hable con voz clonada directamente en tu GPU o CPU, sin conexión externa ni costes.',
	},
	{
		title: 'Recompensas de Canal & Conexiones',
		category: 'Interacción',
		badge: 'Twitch & Kick',
		badgeColor: 'border-pink-500/30 bg-pink-500/10 text-pink-600 dark:text-pink-400',
		icon: Gift,
		iconColor: 'text-pink-500 dark:text-pink-400',
		iconBg: 'bg-pink-500/10 border-pink-500/20',
		description: 'Personaliza respuestas de IA para canjes de puntos en Twitch y Kick.',
	},
];

export function NewsModal() {
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const [isPlayingDemo, setIsPlayingDemo] = useState(false);
	const [isLoadingAudio, setIsLoadingAudio] = useState(false);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	const stopAudio = useCallback(() => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
			audioRef.current = null;
		}
		setIsPlayingDemo(false);
		setIsLoadingAudio(false);
	}, []);

	const handleClose = useCallback(() => {
		stopAudio();
		setIsOpen(false);
		if (typeof window !== 'undefined') {
			try {
				window.localStorage.setItem(SANDY_NEWS_STORAGE_KEY, CURRENT_NEWS_VERSION);
			} catch (e) {
				console.error('No se pudo guardar la versión de novedades en localStorage:', e);
			}
		}
	}, [stopAudio]);

	const handleGoToVoiceSettings = useCallback(() => {
		handleClose();
		router.push('/settings?tab=voice');
	}, [handleClose, router]);

	const handlePlayEdgeDemo = async () => {
		if (isPlayingDemo) {
			stopAudio();
			return;
		}

		stopAudio();
		setIsLoadingAudio(true);

		try {
			const sampleText =
				'¡Hola! Ahora puedo hablar contigo y tu chat de forma 100% gratuita con voces neurales ultra realistas. ¡Pruébame en tu próximo stream!';

			const blob = await getVoiceEdge(sampleText, {
				voice: DEFAULT_EDGE_VOICE,
				rate: '+0%',
				pitch: '+0Hz',
			});

			if (!blob || blob.size === 0) {
				throw new Error('No se pudo generar el audio de muestra');
			}

			const audioUrl = URL.createObjectURL(blob);
			const audio = new Audio(audioUrl);
			audioRef.current = audio;

			audio.onplay = () => {
				setIsLoadingAudio(false);
				setIsPlayingDemo(true);
			};

			audio.onended = () => {
				setIsPlayingDemo(false);
				URL.revokeObjectURL(audioUrl);
				audioRef.current = null;
			};

			audio.onerror = () => {
				setIsLoadingAudio(false);
				setIsPlayingDemo(false);
				URL.revokeObjectURL(audioUrl);
				audioRef.current = null;
				toast.error('No se pudo reproducir el audio de prueba.');
			};

			await audio.play();
		} catch (error) {
			console.error('Error al generar audio de prueba Edge TTS:', error);
			setIsLoadingAudio(false);
			setIsPlayingDemo(false);
			toast.error('No se pudo conectar con el servicio de voz de prueba.');
		}
	};

	useEffect(() => {
		const handleOpenEvent = () => setIsOpen(true);
		window.addEventListener(OPEN_NEWS_MODAL_EVENT, handleOpenEvent);

		try {
			const lastSeenVersion = window.localStorage.getItem(SANDY_NEWS_STORAGE_KEY);
			if (lastSeenVersion !== CURRENT_NEWS_VERSION) {
				const timer = window.setTimeout(() => {
					setIsOpen(true);
				}, 600);
				return () => {
					window.clearTimeout(timer);
					window.removeEventListener(OPEN_NEWS_MODAL_EVENT, handleOpenEvent);
				};
			}
		} catch {
			// localStorage no disponible o bloqueado
		}

		return () => {
			window.removeEventListener(OPEN_NEWS_MODAL_EVENT, handleOpenEvent);
			stopAudio();
		};
	}, [stopAudio]);

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) handleClose();
				else setIsOpen(true);
			}}
		>
			<DialogContent className='max-h-[92vh] overflow-y-auto p-0 sm:max-w-3xl'>
				<div className='relative overflow-hidden rounded-2xl'>
					{/* Ambient background glows */}
					<div className='-top-20 -right-20 pointer-events-none absolute size-64 rounded-full bg-emerald-500/15 blur-3xl' />
					<div className='-bottom-20 -left-20 pointer-events-none absolute size-64 rounded-full bg-violet-600/15 blur-3xl' />

					{/* Modal Header */}
					<DialogHeader className='border-border/60 border-b p-6 pb-5'>
						<div className='flex flex-wrap items-center gap-2'>
							<Badge
								variant='outline'
								className='gap-1 border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-medium text-emerald-600 text-xs dark:text-emerald-400'
							>
								<Sparkles className='size-3' />
								Novedades
							</Badge>
							<Badge variant='secondary' className='font-mono font-semibold text-xs tracking-wide'>
								v{CURRENT_NEWS_VERSION}
							</Badge>
							<Badge
								variant='outline'
								className='border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[11px] text-violet-600 dark:text-violet-400'
							>
								Voz Gratuita & TTS Local
							</Badge>
						</div>

						<DialogTitle className='pt-2 font-bold text-2xl tracking-tight sm:text-3xl'>
							¡Llegó la Voz Gratuita y Local para Sandy!
						</DialogTitle>
						<DialogDescription className='text-muted-foreground text-sm leading-relaxed sm:text-base'>
							Ahora puedes darle voz a tu VTuber sin suscripciones ni límites de tokens. Descubre
							las nuevas opciones de síntesis de voz y optimizaciones del sistema.
						</DialogDescription>
					</DialogHeader>

					<div className='space-y-5 p-6'>
						{/* Spotlight Card: Edge TTS 100% Gratuito */}
						<div className='relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent p-5 shadow-sm sm:p-6'>
							<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
								<div className='space-y-2'>
									<div className='flex flex-wrap items-center gap-2'>
										<Badge className='border-emerald-500/40 bg-emerald-500/20 font-semibold text-emerald-700 text-xs dark:text-emerald-300'>
											🌟 Novedad Principal
										</Badge>
										<Badge
											variant='outline'
											className='border-emerald-500/30 text-emerald-600 text-xs dark:text-emerald-400'
										>
											100% Gratuito & Sin API Key
										</Badge>
									</div>

									<h3 className='font-bold text-foreground text-lg sm:text-xl'>
										Edge TTS: Voces Neurales Ilimitadas
									</h3>

									<p className='max-w-xl text-muted-foreground text-xs leading-relaxed sm:text-sm'>
										Voces naturales de Microsoft integradas directamente sin necesidad de tarjeta de
										crédito ni cuenta externa. Incluye presets de acentos en español (España,
										México, Colombia, Argentina y más) con control de velocidad y afinación.
									</p>

									<div className='flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-muted-foreground text-xs'>
										<span className='flex items-center gap-1.5 font-medium text-foreground'>
											<CheckCircle2 className='size-3.5 text-emerald-500' />
											Cero consumo de GPU
										</span>
										<span className='flex items-center gap-1.5 font-medium text-foreground'>
											<CheckCircle2 className='size-3.5 text-emerald-500' />
											Activada por defecto
										</span>
									</div>
								</div>

								{/* Audio Demo Button */}
								<div className='shrink-0 pt-2 sm:pt-0'>
									<Button
										type='button'
										onClick={handlePlayEdgeDemo}
										disabled={isLoadingAudio}
										variant='outline'
										className='group relative flex h-11 w-full items-center justify-center gap-2 rounded-xl border-emerald-500/40 bg-emerald-500/10 px-4 font-semibold text-emerald-700 text-sm shadow-xs transition-all hover:border-emerald-500/60 hover:bg-emerald-500/20 active:scale-95 sm:w-auto dark:text-emerald-300'
									>
										{isLoadingAudio ? (
											<>
												<Loader2 className='size-4 animate-spin text-emerald-600 dark:text-emerald-400' />
												<span>Sintetizando...</span>
											</>
										) : isPlayingDemo ? (
											<>
												<Square className='size-4 fill-destructive text-destructive' />
												<span className='text-destructive'>Detener demo</span>
												<span className='ml-1 flex items-center gap-0.5'>
													<span className='inline-block size-1 animate-pulse rounded-full bg-destructive' />
													<span className='inline-block size-1 animate-pulse rounded-full bg-destructive delay-75' />
													<span className='inline-block size-1 animate-pulse rounded-full bg-destructive delay-150' />
												</span>
											</>
										) : (
											<>
												<Play className='size-4 fill-emerald-600 text-emerald-600 transition-transform group-hover:scale-110 dark:fill-emerald-400 dark:text-emerald-400' />
												<span>Escuchar demo de voz</span>
											</>
										)}
									</Button>
								</div>
							</div>
						</div>

						{/* Feature Grid */}
						<div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
							{NEWS_FEATURES.map((item) => (
								<div
									key={item.title}
									className='flex flex-col justify-between rounded-xl border border-border/70 bg-background/60 p-4 transition-all hover:border-border hover:bg-background/90'
								>
									<div className='flex items-start gap-3'>
										<div
											className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${item.iconBg} ${item.iconColor}`}
										>
											<item.icon className='size-5' />
										</div>
										<div className='min-w-0 flex-1'>
											<div className='flex items-center justify-between gap-1'>
												<span className='font-semibold text-[11px] text-muted-foreground uppercase tracking-wider'>
													{item.category}
												</span>
												<Badge
													variant='outline'
													className={`px-1.5 py-0 text-[10px] ${item.badgeColor}`}
												>
													{item.badge}
												</Badge>
											</div>
											<h4 className='mt-0.5 font-semibold text-foreground text-sm leading-snug'>
												{item.title}
											</h4>
											<p className='mt-1 text-muted-foreground text-xs leading-relaxed'>
												{item.description}
											</p>
										</div>
									</div>
								</div>
							))}
						</div>

						{/* Ko-fi Community Support Card */}
						<div className='relative overflow-hidden rounded-xl border border-[#FF5E5B]/25 bg-gradient-to-br from-[#FF5E5B]/10 via-[#FF5E5B]/5 to-transparent p-4 sm:p-5'>
							<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
								<div className='flex items-start gap-3.5'>
									<div className='flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#FF5E5B]/30 bg-[#FF5E5B]/15 text-[#FF5E5B] shadow-xs'>
										<Coffee className='size-5' />
									</div>
									<div className='space-y-1'>
										<div className='flex items-center gap-1.5'>
											<span className='font-semibold text-[#FF5E5B] text-xs uppercase tracking-wider'>
												Comunidad & Apoyo
											</span>
											<Heart className='size-3 fill-[#FF5E5B] text-[#FF5E5B]' />
										</div>
										<h4 className='font-semibold text-foreground text-sm sm:text-base'>
											¿Te gustan las nuevas voces gratuitas? Invítale un café
										</h4>
										<p className='text-muted-foreground text-xs leading-relaxed'>
											Sandy Studio es un proyecto 100% abierto y gratuito. Cada café en Ko-fi ayuda
											a mantener los servidores y financiar el desarrollo de nuevas funciones.
										</p>
									</div>
								</div>
								<div className='pt-1 sm:shrink-0 sm:pt-0'>
									<a
										href={KOFI_URL}
										target='_blank'
										rel='noopener noreferrer'
										className='inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-[#FF5E5B] px-4 font-medium text-white text-xs shadow-sm transition-transform hover:scale-[1.02] hover:bg-[#e04e4b] active:scale-[0.98] sm:w-auto'
									>
										<Coffee className='size-3.5' />
										<span>Donar en Ko-fi</span>
										<ExternalLink className='size-3 opacity-70' />
									</a>
								</div>
							</div>
						</div>
					</div>

					{/* Modal Footer with Actions */}
					<DialogFooter className='flex flex-col-reverse gap-2 border-border/60 border-t bg-muted/25 px-6 py-4 sm:flex-row sm:justify-between'>
						<Button
							type='button'
							variant='ghost'
							onClick={handleClose}
							className='h-10 rounded-xl text-muted-foreground hover:text-foreground'
						>
							Cerrar
						</Button>

						<div className='flex flex-col gap-2 sm:flex-row'>
							<Button
								type='button'
								onClick={handleGoToVoiceSettings}
								variant='outline'
								className='flex h-10 items-center justify-center gap-2 rounded-xl border-violet-500/40 font-medium text-sm text-violet-700 hover:bg-violet-500/10 dark:text-violet-300'
							>
								<Volume2 className='size-4' />
								<span>Personalizar Voces</span>
								<ArrowRight className='size-3.5' />
							</Button>

							<Button
								type='button'
								onClick={handleClose}
								className='flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 font-semibold text-white shadow-sm hover:bg-violet-700'
							>
								<Sparkles className='size-4' />
								<span>¡Entendido, explorar Sandy!</span>
							</Button>
						</div>
					</DialogFooter>
				</div>
			</DialogContent>
		</Dialog>
	);
}
