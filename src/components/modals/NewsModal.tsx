'use client';

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
import { Bot, Coffee, ExternalLink, Gift, Heart, Mic, Sparkles, Youtube } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

export const SANDY_NEWS_STORAGE_KEY = 'sandy_news_last_seen_version';
export const CURRENT_NEWS_VERSION = '0.1.8';
export const OPEN_NEWS_MODAL_EVENT = 'open-sandy-news-modal';

export const openNewsModal = () => {
	if (typeof window !== 'undefined') {
		window.dispatchEvent(new CustomEvent(OPEN_NEWS_MODAL_EVENT));
	}
};

const NEWS_ITEMS = [
	{
		title: 'Conexión instantánea con YouTube',
		category: 'Plataformas',
		icon: Youtube,
		iconColor: 'text-[#FF0000]',
		iconBg: 'bg-[#FF0000]/10 border-[#FF0000]/20',
		description:
			'Vincula tu canal de YouTube de forma fluida. Ahora tu avatar y perfil se cargan al instante al conectar, y la cancelación responde de inmediato.',
	},
	{
		title: 'Recompensas de canal en Twitch y Kick',
		category: 'Interacción',
		icon: Gift,
		iconColor: 'text-violet-500 dark:text-violet-400',
		iconBg: 'bg-violet-500/10 border-violet-500/20',
		description:
			'Gestiona y automatiza las recompensas de puntos de canal para interactuar con tu comunidad de forma divertida con respuestas inteligentes de IA.',
	},
	{
		title: 'Soporte para modelos de IA local',
		category: 'Inteligencia Artificial',
		icon: Bot,
		iconColor: 'text-cyan-500 dark:text-cyan-400',
		iconBg: 'bg-cyan-500/10 border-cyan-500/20',
		description:
			'Ejecuta inferencia local con Ollama o servidores LM Studio sin costo de tokens en la nube. Máxima privacidad y control.',
	},
	{
		title: 'Reconocimiento y síntesis de voz optimizada',
		category: 'Voz & VTuber',
		icon: Mic,
		iconColor: 'text-emerald-500 dark:text-emerald-400',
		iconBg: 'bg-emerald-500/10 border-emerald-500/20',
		description:
			'Mejor detección de voz, respuestas más ágiles y sincronización gestual para tu modelo en VTube Studio.',
	},
];

export function NewsModal() {
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
		<Dialog open={isOpen} onOpenChange={(open) => (open ? setIsOpen(true) : handleClose())}>
			<DialogContent className='max-h-[90vh] overflow-y-auto p-0 sm:max-w-2xl'>
				<div className='relative overflow-hidden rounded-2xl'>
					<div className='-top-12 -right-12 pointer-events-none absolute size-48 rounded-full bg-violet-600/15 blur-3xl' />
					<div className='-bottom-12 -left-12 pointer-events-none absolute size-48 rounded-full bg-cyan-600/15 blur-3xl' />

					<DialogHeader className='border-border/60 border-b p-6 pb-5'>
						<div className='flex items-center gap-2'>
							<Badge
								variant='outline'
								className='gap-1 border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-violet-500 text-xs dark:text-violet-400'
							>
								<Sparkles className='size-3' />
								Novedades
							</Badge>
							<Badge variant='secondary' className='font-mono text-xs'>
								v{CURRENT_NEWS_VERSION}
							</Badge>
						</div>
						<DialogTitle className='pt-2 font-bold text-2xl tracking-tight'>
							¿Qué hay de nuevo en Sandy Studio?
						</DialogTitle>
						<DialogDescription className='text-muted-foreground text-sm'>
							Hemos preparado nuevas herramientas y optimizaciones para que tu stream sea aún más
							interactivo.
						</DialogDescription>
					</DialogHeader>

					<div className='space-y-4 p-6'>
						<div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
							{NEWS_ITEMS.map((item) => (
								<div
									key={item.title}
									className='flex flex-col justify-between rounded-xl border border-border/70 bg-background/60 p-3.5 transition-all hover:border-border hover:bg-background/90'
								>
									<div className='flex items-start gap-3'>
										<div
											className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${item.iconBg} ${item.iconColor}`}
										>
											<item.icon className='size-4' />
										</div>
										<div className='min-w-0 flex-1'>
											<span className='font-medium text-[11px] text-muted-foreground uppercase tracking-wider'>
												{item.category}
											</span>
											<h4 className='font-semibold text-foreground text-sm leading-snug'>
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
											¿Te encanta Sandy Studio? Invítale un café
										</h4>
										<p className='text-muted-foreground text-xs leading-relaxed'>
											Sandy es gratis y de código abierto. Cada café en Ko-fi ayuda a costear
											servidores y mantener el proyecto en funcionamiento.
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

					<DialogFooter className='border-border/60 border-t bg-muted/20 px-6 py-4'>
						<Button
							type='button'
							onClick={handleClose}
							className='h-10 w-full rounded-xl bg-violet-600 font-medium text-white hover:bg-violet-700 sm:w-auto'
						>
							¡Entendido, explorar Sandy!
						</Button>
					</DialogFooter>
				</div>
			</DialogContent>
		</Dialog>
	);
}
