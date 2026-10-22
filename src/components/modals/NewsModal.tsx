'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { KOFI_URL } from '@/lib/links';
import { ArrowRight, Box, Coffee, ExternalLink, Heart, Settings, Sparkles, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export const SANDY_NEWS_STORAGE_KEY = 'sandy_news_last_seen_version';
export const CURRENT_NEWS_VERSION = '0.2.4';
export const OPEN_NEWS_MODAL_EVENT = 'open-sandy-news-modal';

export const openNewsModal = () => {
	if (typeof window !== 'undefined') {
		window.dispatchEvent(new CustomEvent(OPEN_NEWS_MODAL_EVENT));
	}
};

export function NewsModal() {
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);

	const handleClose = useCallback(() => {
		setIsOpen(false);
		if (typeof window !== 'undefined') {
			try {
				window.localStorage.setItem(SANDY_NEWS_STORAGE_KEY, CURRENT_NEWS_VERSION);
			} catch (e) {
				console.error('No se pudo guardar la versión de novedades en localStorage:', e);
			}
		}
	}, []);

	const handleGoToSettings = useCallback(() => {
		handleClose();
		router.push('/settings?tab=ai');
	}, [handleClose, router]);

	const handleGoToAvatar = useCallback(() => {
		handleClose();
		router.push('/avatar');
	}, [handleClose, router]);

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
		};
	}, []);

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) handleClose();
				else setIsOpen(true);
			}}
		>
			<DialogContent className='max-h-[95vh] w-[92vw] max-w-[430px] overflow-hidden border-0 bg-transparent p-0 shadow-2xl sm:max-w-[460px] [&>button]:hidden'>
				{/* Outer Poster Frame matching the reference illustration */}
				<div className='relative flex flex-col overflow-hidden rounded-[32px] border border-indigo-400/20 bg-[#161233] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]'>
					{/* Close Button at top-right */}
					<button
						type='button'
						onClick={handleClose}
						aria-label='Cerrar modal'
						className='absolute top-3.5 right-3.5 z-20 flex size-8 items-center justify-center rounded-full bg-black/40 text-white/80 backdrop-blur-md transition-all hover:bg-black/60 hover:text-white active:scale-95'
					>
						<X className='size-4' />
					</button>

					{/* Top Artwork Area with Custom VTuber Flat Banner */}
					<div className='relative h-60 w-full overflow-hidden sm:h-64'>
						<Image
							src='/news/command-trigger-banner.jpg'
							alt='Novedad Sandy - Respuesta por comandos personalizada'
							fill
							priority
							className='pointer-events-none select-none object-cover object-center'
						/>
						{/* Subtle top atmospheric shading */}
						<div className='pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-transparent' />

						{/* Floating update pill badge */}
						<div className='absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full border border-white/20 bg-[#1e1b4b]/80 px-3 py-1 shadow-md backdrop-blur-md'>
							<Sparkles className='size-3 text-cyan-400' />
							<span className='font-bold text-[11px] text-white uppercase tracking-wide'>
								Actualización
							</span>
							<span className='rounded-full bg-cyan-500/20 px-1.5 py-0.2 font-bold font-mono text-[10px] text-cyan-300'>
								v{CURRENT_NEWS_VERSION}
							</span>
						</div>
					</div>

					{/* Cloud-integrated Notice Sheet (White / Light Clean Card) */}
					<div className='-mt-8 relative mx-3 mb-3 flex flex-col rounded-[26px] bg-[#fbfbff] p-5 text-slate-800 shadow-xl sm:p-6'>
						{/* Notice Header */}
						<div className='flex items-center justify-between border-slate-100 border-b pb-3'>
							<div>
								<DialogTitle className='font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl'>
									Actualización:
								</DialogTitle>
								<DialogDescription className='mt-0.5 font-medium text-slate-500 text-xs sm:text-sm'>
									¡Llegó la respuesta por comando personalizado!
								</DialogDescription>
							</div>

							<Badge
								variant='outline'
								className='border-violet-200 bg-violet-50 font-bold font-mono text-[11px] text-violet-700'
							>
								!bot
							</Badge>
						</div>

						{/* Notice Body */}
						<div className='mt-3.5 space-y-2.5 text-slate-600 text-xs sm:text-[13px] sm:leading-relaxed'>
							<p className='font-semibold text-slate-800'>
								¡Hola streamers! Ahora tu VTuber puede responder solo a cuando tu chat o tú la
								llamen con un comando:
							</p>

							{/* Numbered bullet list matching the reference layout */}
							<div className='space-y-2 rounded-xl bg-slate-50/80 p-3 text-xs'>
								<div className='flex items-start gap-2'>
									<span className='flex size-4 shrink-0 items-center justify-center rounded-full bg-violet-600 font-bold text-[10px] text-white'>
										1
									</span>
									<p className='text-slate-700'>
										<strong className='text-slate-900'>Por comando o por mensajes:</strong> Elige en{' '}
										<span className='font-medium text-violet-700'>Configuración</span> si responde a
										lotes de chat o solo con un prefijo.
									</p>
								</div>

								<div className='flex items-start gap-2'>
									<span className='flex size-4 shrink-0 items-center justify-center rounded-full bg-violet-600 font-bold text-[10px] text-white'>
										2
									</span>
									<p className='text-slate-700'>
										<strong className='text-slate-900'>Totalmente personalizable:</strong> Usa{' '}
										<code className='rounded bg-violet-100 px-1 py-0.5 font-mono font-semibold text-violet-900'>
											!bot
										</code>{' '}
										o la palabra clave que prefieras en Twitch, YouTube y Kick.
									</p>
								</div>

								<div className='flex items-start gap-2'>
									<span className='flex size-4 shrink-0 items-center justify-center rounded-full bg-violet-600 font-bold text-[10px] text-white'>
										3
									</span>
									<p className='text-slate-700'>
										<strong className='text-slate-900'>Cero spam y ahorro de tokens:</strong> Tu
										VTuber ya no se saturará en directos con chats rápidos.
									</p>
								</div>
							</div>

							{/* Call to action & button row */}
							<div className='flex flex-col gap-2 pt-2'>
								<div className='flex items-center gap-2'>
									<Button
										type='button'
										onClick={handleGoToSettings}
										className='h-10 flex-1 gap-2 rounded-xl bg-violet-600 font-semibold text-white text-xs shadow-md transition-all hover:bg-violet-700 active:scale-[0.98]'
									>
										<Settings className='size-3.5' />
										<span>Configurar comando</span>
										<ArrowRight className='size-3.5' />
									</Button>

									<button
										type='button'
										onClick={handleGoToAvatar}
										className='inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3.5 font-semibold text-slate-700 text-xs shadow-xs transition-all hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98]'
									>
										<Box className='size-3.5 text-cyan-600' />
										<span>Avatares 3D</span>
									</button>
								</div>
							</div>

							{/* High-visibility Ko-fi Community Support Card */}
							<div className='relative mt-1 overflow-hidden rounded-2xl border-2 border-[#FF5E5B]/40 bg-gradient-to-r from-[#FF5E5B]/15 via-[#FF5E5B]/10 to-[#FFA14A]/15 p-3.5 shadow-sm'>
								<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
									<div className='flex items-start gap-2.5'>
										<div className='flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF5E5B] to-[#ff423e] text-white shadow-[#FF5E5B]/30 shadow-md'>
											<Coffee className='size-4 animate-bounce' />
										</div>
										<div className='space-y-0.5'>
											<div className='flex items-center gap-1.5'>
												<span className='font-extrabold text-slate-900 text-xs tracking-tight'>
													¿Te gusta Sandy?
												</span>
												<Heart className='size-3 animate-pulse fill-[#FF5E5B] text-[#FF5E5B]' />
											</div>
											<p className='font-medium text-[11px] text-slate-600 leading-snug'>
												Sandy es 100% gratuita. ¡Apóyanos con un cafecito para seguir mejorando!
											</p>
										</div>
									</div>

									<a
										href={KOFI_URL}
										target='_blank'
										rel='noopener noreferrer'
										className='inline-flex h-9 w-full shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF5E5B] to-[#ff423e] px-4 font-bold text-white text-xs shadow-[#FF5E5B]/30 shadow-md transition-all hover:scale-[1.02] hover:shadow-[#FF5E5B]/40 hover:shadow-lg active:scale-95 sm:w-auto'
									>
										<span>Invitar café</span>
										<ExternalLink className='size-3 opacity-90' />
									</a>
								</div>
							</div>

							{/* Secondary dismiss */}
							<div className='pt-1 text-center'>
								<button
									type='button'
									onClick={handleClose}
									className='h-7 w-full rounded-lg font-medium text-[11px] text-slate-400 transition-colors hover:bg-slate-100/80 hover:text-slate-600 active:text-slate-900'
								>
									¡Entendido, gracias!
								</button>
							</div>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
