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
	Box,
	CheckCircle2,
	Coffee,
	Cpu,
	ExternalLink,
	Heart,
	Layers,
	Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export const SANDY_NEWS_STORAGE_KEY = 'sandy_news_last_seen_version';
export const CURRENT_NEWS_VERSION = '0.2.3';
export const OPEN_NEWS_MODAL_EVENT = 'open-sandy-news-modal';

export const openNewsModal = () => {
	if (typeof window !== 'undefined') {
		window.dispatchEvent(new CustomEvent(OPEN_NEWS_MODAL_EVENT));
	}
};

const NEWS_FEATURES = [
	{
		title: 'Elige entre 2D o 3D con 1 clic',
		category: 'Tus Programas',
		badge: 'VTube Studio & VSeeFace',
		badgeColor: 'border-pink-500/30 bg-pink-500/10 text-pink-600 dark:text-pink-400',
		icon: Layers,
		iconColor: 'text-pink-500 dark:text-pink-400',
		iconBg: 'bg-pink-500/10 border-pink-500/20',
		description:
			'¿Prefieres 2D en VTube Studio o modelos 3D en VSeeFace? Puedes cambiar de software cuando quieras y Sandy guardará tu configuración preferida.',
	},
	{
		title: 'Voz más fluida y sin repeticiones',
		category: 'Conversación',
		badge: 'Mejor Experiencia',
		badgeColor: 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400',
		icon: Cpu,
		iconColor: 'text-violet-500 dark:text-violet-400',
		iconBg: 'bg-violet-500/10 border-violet-500/20',
		description:
			'Optimizamos las respuestas de la IA para que hable de forma continua, evitando que se repitan frases o choquen los audios mientras interactúas.',
	},
];

export function NewsModal() {
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const [isPlayingDemo, setIsPlayingDemo] = useState(false);
	const [_isLoadingAudio, setIsLoadingAudio] = useState(false);
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

	const handleGoToAvatar = useCallback(() => {
		handleClose();
		router.push('/avatar');
	}, [handleClose, router]);

	const _handlePlayEdgeDemo = async () => {
		if (isPlayingDemo) {
			stopAudio();
			return;
		}

		stopAudio();
		setIsLoadingAudio(true);

		try {
			const sampleText =
				'¡Hola! Ahora también puedes usarme con avatares 3D en VSeeFace. Muevo mi boca al hablar y expreso emociones en tiempo real. ¡Pruébame en tu próximo directo!';

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
					<div className='-top-20 -right-20 pointer-events-none absolute size-64 rounded-full bg-cyan-500/15 blur-3xl' />
					<div className='-bottom-20 -left-20 pointer-events-none absolute size-64 rounded-full bg-violet-600/15 blur-3xl' />

					{/* Modal Header */}
					<DialogHeader className='border-border/60 border-b p-6 pb-5'>
						<div className='flex flex-wrap items-center gap-2'>
							<Badge
								variant='outline'
								className='gap-1 border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 font-medium text-cyan-600 text-xs dark:text-cyan-400'
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
								Avatares 3D & VSeeFace
							</Badge>
						</div>

						<DialogTitle className='pt-2 font-bold text-2xl tracking-tight sm:text-3xl'>
							¡Llegó la Conexión con VSeeFace y Avatares 3D!
						</DialogTitle>
						<DialogDescription className='text-muted-foreground text-sm leading-relaxed sm:text-base'>
							¡Tu VTuber ahora puede ser en 3D! Conecta fácilmente tu modelo con VSeeFace para que
							hable, mueva su boca en tiempo real y exprese emociones en tus directos.
						</DialogDescription>
					</DialogHeader>

					<div className='space-y-5 p-6'>
						{/* Spotlight Card: VSeeFace 3D Integration */}
						<div className='relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/15 via-cyan-500/5 to-transparent p-5 shadow-sm sm:p-6'>
							<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
								<div className='space-y-2'>
									<div className='flex flex-wrap items-center gap-2'>
										<Badge className='border-cyan-500/40 bg-cyan-500/20 font-semibold text-cyan-700 text-xs dark:text-cyan-300'>
											🌟 Novedad Principal
										</Badge>
										<Badge
											variant='outline'
											className='border-cyan-500/30 text-cyan-600 text-xs dark:text-cyan-400'
										>
											Avatares 3D
										</Badge>
										<Badge
											variant='outline'
											className='border-violet-500/30 text-violet-600 text-xs dark:text-violet-400'
										>
											Compatible con VRoid
										</Badge>
									</div>

									<h3 className='font-bold text-foreground text-lg sm:text-xl'>
										VSeeFace: Da vida a tu Avatar 3D
									</h3>

									<p className='max-w-xl text-muted-foreground text-xs leading-relaxed sm:text-sm'>
										Si tienes un modelo 3D (creado en VRoid o cualquier avatar .vrm), ahora puedes
										darle vida con Sandy en segundos. Tu personaje hablará con voz natural, moverá
										la boca al instante.
									</p>

									<div className='flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-muted-foreground text-xs'>
										<span className='flex items-center gap-1.5 font-medium text-foreground'>
											<CheckCircle2 className='size-3.5 text-cyan-500' />
											Boca sincronizada al hablar
										</span>
										<span className='flex items-center gap-1.5 font-medium text-foreground'>
											<CheckCircle2 className='size-3.5 text-cyan-500' />
											Expresiones suaves y naturales
										</span>
										<span className='flex items-center gap-1.5 font-medium text-foreground'>
											<CheckCircle2 className='size-3.5 text-cyan-500' />
											Compatible con VRoid y modelos 3D
										</span>
									</div>
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
											¿Te gustan las nuevas funciones de avatares 3D? Invítale un café
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
								onClick={handleGoToAvatar}
								variant='outline'
								className='flex h-10 items-center justify-center gap-2 rounded-xl border-cyan-500/40 font-medium text-cyan-700 text-sm hover:bg-cyan-500/10 dark:text-cyan-300'
							>
								<Box className='size-4' />
								<span>Configurar Avatar 3D</span>
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
