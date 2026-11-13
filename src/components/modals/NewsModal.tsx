'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { KOFI_URL } from '@/lib/links';
import { ArrowRight, Box, Coffee, ExternalLink, Settings, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export const SANDY_NEWS_STORAGE_KEY = 'sandy_news_last_seen_version';
export const CURRENT_NEWS_VERSION = '0.2.7';
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
			<DialogContent className='max-h-[92dvh] w-[92vw] max-w-[430px] gap-0 overflow-y-auto border-0 bg-transparent p-0 shadow-2xl sm:max-w-[460px] [&>button]:hidden'>
				<div className='relative flex flex-col overflow-hidden rounded-[32px] border border-indigo-400/20 bg-[#161233]'>
					<button
						type='button'
						onClick={handleClose}
						aria-label='Cerrar modal'
						className='absolute top-3 right-3 z-20 flex size-11 items-center justify-center rounded-full bg-[#0E1022] text-white transition-colors hover:bg-[#262A4D] focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2'
					>
						<X aria-hidden className='size-4' />
					</button>
					<div className='relative h-44 w-full overflow-hidden sm:h-56'>
						<Image
							src='/news/sandy-plus-release-0.2.7.webp'
							alt='Sandy con un café en su estudio nocturno, junto a pantallas de avatares conectadas entre nubes y estrellas'
							fill
							priority
							sizes='(max-width: 640px) 92vw, 460px'
							className='pointer-events-none select-none object-cover object-center'
						/>
						<span className='absolute top-4 left-4 rounded-full border border-white/20 bg-[#0E1022] px-3 py-1.5 font-mono text-white text-xs'>
							v{CURRENT_NEWS_VERSION}
						</span>
					</div>
					<div className='-mt-5 relative mx-3 mb-3 rounded-[26px] bg-[#fbfbff] p-5 text-slate-800 sm:p-6'>
						<div className='space-y-2 border-slate-200 border-b pb-4'>
							<DialogTitle className='font-bold font-display text-slate-900 text-xl leading-tight sm:text-2xl'>
								Sandy Plus llega al estudio
							</DialogTitle>
							<DialogDescription className='text-slate-600 text-sm'>
								Apoyo opcional, nuevas expresiones y mejoras para tus directos.
							</DialogDescription>
						</div>
						<ul className='my-4 space-y-4 text-slate-700 text-sm leading-relaxed'>
							<li>
								<p className='font-semibold text-slate-900'>Sandy Plus, en toda tu cuenta</p>
								<p>
									Un pago de US$3 retira la marca de apoyo en PNGTuber, Live2D, VRM y OBS. Abre
									«Apoyar Sandy» para obtener Plus o canjear tu código.
								</p>
							</li>
							<li>
								<p className='font-semibold text-slate-900'>Más control de tus expresiones</p>
								<p>
									Configura atajos con intensidad y reacciones automáticas para tus avatares. El
									estudio VRM también incorpora ajustes de animación en reposo.
								</p>
							</li>
							<li>
								<p className='font-semibold text-slate-900'>Una configuración más clara</p>
								<p>
									Mejoramos la bienvenida, la selección de avatar y los controles del estudio, con
									un panel dedicado a VTube Studio.
								</p>
							</li>
						</ul>
						<div className='flex flex-wrap gap-2'>
							<Button
								type='button'
								onClick={handleGoToAvatar}
								className='min-h-11 flex-1 gap-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 focus-visible:ring-violet-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white'
							>
								<Box aria-hidden className='size-4' />
								<span>Abrir estudio</span>
								<ArrowRight aria-hidden className='size-4' />
							</Button>
							<button
								type='button'
								onClick={handleGoToSettings}
								className='inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 font-semibold text-slate-700 text-sm hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-violet-600 focus-visible:outline-offset-2'
							>
								<Settings aria-hidden className='size-4' />
								<span>Ajustes</span>
							</button>
						</div>
						<div className='mt-4 border-slate-200 border-t pt-3 text-center'>
							<p className='text-slate-600 text-xs leading-relaxed'>
								Las funciones de Sandy siguen siendo gratuitas. Los aportes voluntarios no activan
								Sandy Plus.
							</p>
							<a
								href={KOFI_URL}
								target='_blank'
								rel='noopener noreferrer'
								className='mt-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 font-medium text-slate-700 text-sm underline underline-offset-4 hover:text-violet-700 focus-visible:outline-2 focus-visible:outline-violet-600 focus-visible:outline-offset-2'
							>
								<Coffee aria-hidden className='size-4' />
								Apoyar voluntariamente
								<ExternalLink aria-hidden className='size-3.5' />
							</a>
							<button
								type='button'
								onClick={handleClose}
								className='mt-1 min-h-11 w-full rounded-lg font-medium text-slate-600 text-sm hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-violet-600 focus-visible:outline-offset-2'
							>
								Entendido
							</button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
