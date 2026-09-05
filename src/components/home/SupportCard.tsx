'use client';

import { openNewsModal } from '@/components/modals/NewsModal';
import { Button } from '@/components/ui/button';
import { KOFI_URL } from '@/lib/links';
import { Coffee, ExternalLink, Heart, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const SUPPORT_CARD_DISMISSED_KEY = 'sandy_kofi_card_dismissed';

export function SupportCard() {
	const [isDismissed, setIsDismissed] = useState(true);

	useEffect(() => {
		try {
			const dismissed = window.localStorage.getItem(SUPPORT_CARD_DISMISSED_KEY);
			if (!dismissed) {
				setIsDismissed(false);
			}
		} catch {
			setIsDismissed(false);
		}
	}, []);

	const handleDismiss = () => {
		setIsDismissed(true);
		try {
			window.localStorage.setItem(SUPPORT_CARD_DISMISSED_KEY, 'true');
		} catch (e) {
			console.error('Error guardando descarte de tarjeta de soporte:', e);
		}
	};

	if (isDismissed) {
		return null;
	}

	return (
		<div className='relative mt-4 overflow-hidden rounded-2xl border border-[#FF5E5B]/30 bg-gradient-to-r from-[#FF5E5B]/10 via-background/80 to-violet-500/10 p-5 shadow-sm backdrop-blur-md transition-all sm:p-6'>
			{/* Efectos de resplandor de fondo */}
			<div className='-top-12 -right-12 pointer-events-none absolute size-36 rounded-full bg-[#FF5E5B]/15 blur-2xl' />
			<div className='-bottom-10 -left-10 pointer-events-none absolute size-32 rounded-full bg-violet-600/15 blur-2xl' />

			{/* Botón para descartar */}
			<button
				type='button'
				onClick={handleDismiss}
				className='absolute top-3.5 right-3.5 flex size-7 items-center justify-center rounded-full text-muted-foreground/80 transition-colors hover:bg-muted hover:text-foreground'
				aria-label='Ocultar sugerencia'
				title='Ocultar'
			>
				<X className='size-4' />
			</button>

			<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
				<div className='flex items-start gap-4'>
					<div className='flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[#FF5E5B]/40 bg-[#FF5E5B]/15 text-[#FF5E5B] shadow-xs'>
						<Coffee className='size-6' />
					</div>
					<div className='space-y-1 pr-6 sm:pr-0'>
						<div className='flex items-center gap-2'>
							<span className='font-semibold text-[#FF5E5B] text-xs uppercase tracking-wider'>
								Apoya el proyecto
							</span>
							<span className='flex size-2 animate-pulse rounded-full bg-[#FF5E5B]' />
							<Heart className='size-3.5 fill-[#FF5E5B] text-[#FF5E5B]' />
						</div>
						<h3 className='font-bold text-base text-foreground sm:text-lg'>
							Si Sandy alegra tus transmisiones, ¡invítale un café!
						</h3>
						<p className='max-w-2xl text-muted-foreground text-xs leading-relaxed sm:text-sm'>
							Sandy Studio es gratuita y de código abierto. Un aporte voluntario en Ko-fi nos
							permite costear servidores y mantener el proyecto en funcionamiento.
						</p>
					</div>
				</div>

				<div className='flex flex-wrap items-center gap-2 pt-1 sm:shrink-0 sm:pt-0'>
					<Button
						type='button'
						variant='outline'
						size='sm'
						onClick={() => openNewsModal()}
						className='h-9 gap-1.5 rounded-xl border-border/80 font-medium text-xs'
					>
						<Sparkles className='size-3.5 text-violet-500' />
						<span>Ver novedades</span>
					</Button>
					<a
						href={KOFI_URL}
						target='_blank'
						rel='noopener noreferrer'
						className='inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#FF5E5B] px-4 font-semibold text-white text-xs shadow-xs transition-all hover:scale-[1.02] hover:bg-[#e04e4b] hover:shadow-md active:scale-[0.98]'
					>
						<Coffee className='size-4' />
						<span>Donar en Ko-fi</span>
						<ExternalLink className='size-3 opacity-70' />
					</a>
				</div>
			</div>
		</div>
	);
}
