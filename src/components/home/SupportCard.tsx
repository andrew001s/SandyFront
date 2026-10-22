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
		<div className='relative mt-4 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5'>
			{/* Botón para descartar */}
			<button
				type='button'
				onClick={handleDismiss}
				className='absolute top-3 right-3 flex size-6 items-center justify-center rounded-md border border-border/60 bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground'
				aria-label='Ocultar sugerencia'
				title='Ocultar'
			>
				<X className='size-3.5' />
			</button>

			<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
				<div className='flex items-start gap-3.5 pr-6 sm:pr-0'>
					<div className='flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-primary'>
						<Coffee className='size-5' />
					</div>
					<div>
						<div className='flex items-center gap-2'>
							<span className='font-medium font-mono text-[11px] text-primary uppercase tracking-wider'>
								Comunidad y novedades
							</span>
							<Heart className='size-3 fill-primary text-primary' />
						</div>
						<h3 className='font-display font-semibold text-foreground text-sm sm:text-base'>
							¿Sandy suma a tus transmisiones? Apoya su desarrollo
						</h3>
						<p className='mt-0.5 max-w-xl font-sans text-muted-foreground text-xs leading-relaxed'>
							Sandy Studio es gratuita e independiente. Tu aporte voluntario en Ko-fi ayuda a
							costear servidores y acelerar nuevas integraciones.
						</p>
					</div>
				</div>

				<div className='flex flex-wrap items-center gap-2 sm:shrink-0'>
					<Button
						type='button'
						variant='outline'
						size='sm'
						onClick={() => openNewsModal()}
						className='h-8 gap-1.5 rounded-lg border-border font-medium font-sans text-xs'
					>
						<Sparkles className='size-3.5 text-primary' />
						<span>Ver novedades</span>
					</Button>
					<a
						href={KOFI_URL}
						target='_blank'
						rel='noopener noreferrer'
						className='inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 font-medium font-sans text-primary text-xs hover:bg-primary/20'
					>
						<Coffee className='size-3.5' />
						<span>Donar en Ko-fi</span>
						<ExternalLink className='size-3 opacity-70' />
					</a>
				</div>
			</div>
		</div>
	);
}
