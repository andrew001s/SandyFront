'use client';

import { KoFiButton } from '@/components/landing/KoFi';
import { Reveal } from '@/components/landing/Reveal';
import { StarField } from '@/components/landing/StarField';
import { Coffee, Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export function Support() {
	return (
		<section id='apoya' className='relative py-16 md:py-24'>
			<div className='-z-10 pointer-events-none absolute inset-0'>
				<StarField count={20} seed={7} className='absolute inset-0 opacity-25' />
			</div>

			<div className='mx-auto max-w-4xl px-4 md:px-6'>
				<Reveal>
					<div className='relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm backdrop-blur-sm sm:p-8'>
						<div className='relative flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left'>
							<div className='flex size-14 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-primary shadow-sm'>
								<Coffee size={24} />
							</div>

							<div className='flex-1'>
								<span className='mb-2 inline-flex items-center gap-1.5 font-mono text-primary text-xs uppercase tracking-wider'>
									<Heart size={12} className='fill-primary' />
									Proyecto independiente
								</span>
								<h2 className='font-bold font-display text-2xl text-foreground sm:text-3xl'>
									Si Sandy sumó a tu stream, apoya su desarrollo
								</h2>
								<p className='mt-2 font-sans text-muted-foreground text-xs leading-relaxed sm:text-sm'>
									Sandy Studio mantiene sus funciones gratuitas. Cuando esté disponible, Sandy Plus
									quita el aviso de apoyo de tus avatares y overlays de OBS por un pago único de USD
									$3. También puedes apoyar voluntariamente el desarrollo; ese aporte es
									independiente y no activa Plus.
								</p>
								<Link
									href='/sign-in?redirect_url=%2Fhome'
									className='mt-3 inline-flex min-h-10 items-center rounded-md border border-border bg-background px-4 font-semibold text-foreground text-sm transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2'
								>
									Ver Sandy Plus · US$3
								</Link>
							</div>

							<div className='flex flex-col items-center gap-3 sm:items-end'>
								<KoFiButton />
								<a
									href='https://www.producthunt.com/products/sandy-studio?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-sandy-studio'
									target='_blank'
									rel='noopener noreferrer'
									className='transition-opacity hover:opacity-90'
								>
									<Image
										alt='Sandy Studio en Product Hunt'
										width={220}
										height={48}
										unoptimized
										className='block dark:hidden'
										src='https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1214052&theme=light&t=1785779991881'
									/>
									<Image
										alt='Sandy Studio en Product Hunt'
										width={220}
										height={48}
										unoptimized
										className='hidden dark:block'
										src='https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1214052&theme=dark&t=1785779991881'
									/>
								</a>
							</div>
						</div>
					</div>
				</Reveal>
			</div>
		</section>
	);
}
