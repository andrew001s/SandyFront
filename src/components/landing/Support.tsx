'use client';

import { KoFiButton } from '@/components/landing/KoFi';
import { Reveal } from '@/components/landing/Reveal';
import { StarField } from '@/components/landing/StarField';
import { Coffee, Heart } from 'lucide-react';

export function Support() {
	return (
		<section id='apoya' className='relative py-24 md:py-32'>
			<div className='-z-10 pointer-events-none absolute inset-0'>
				<StarField count={30} seed={7} className='absolute inset-0 opacity-50' />
				<div className='-translate-x-1/2 absolute top-1/2 left-1/2 h-[420px] w-[720px] rounded-full bg-[#FF5E5B]/10 blur-[70px] md:blur-[140px]' />
			</div>

			<div className='mx-auto max-w-4xl px-5 md:px-8'>
				<Reveal>
					<div className='relative overflow-hidden rounded-3xl border border-[#1B1536]/10 bg-white/80 p-8 shadow-[0_20px_80px_rgba(109,91,208,0.12)] backdrop-blur-xl sm:p-12 dark:border-white/10 dark:bg-[#100F1B]/80'>
						<div className='-top-16 -right-16 absolute h-48 w-48 rounded-full bg-[#FF5E5B]/15 blur-3xl' />
						<div className='-bottom-16 -left-16 absolute h-48 w-48 rounded-full bg-[#8B5CF6]/15 blur-3xl' />

						<div className='relative flex flex-col items-center gap-8 text-center sm:flex-row sm:text-left'>
							<div className='flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#FF5E5B]/30 bg-[#FF5E5B]/10 text-[#FF5E5B]'>
								<Coffee size={28} />
							</div>

							<div className='flex-1'>
								<span className='mb-2 inline-flex items-center gap-2 font-semibold text-[#FF5E5B] text-xs uppercase tracking-[0.25em]'>
									<Heart size={12} className='fill-[#FF5E5B]' />
									Apoya el proyecto
								</span>
								<h2 className='font-bold text-2xl text-zinc-900 [font-family:var(--font-unbounded)] sm:text-3xl dark:text-zinc-50'>
									Si Sandy te hizo reír, invítale un café
								</h2>
								<p className='mt-3 text-zinc-600 dark:text-zinc-400'>
									Sandy Studio es gratis y se mantiene gracias a personas como tú. Un café en Ko-fi
									ayuda a pagar servidores, APIs y nuevas funciones para que siga creciendo.
								</p>
							</div>

							<div className='flex flex-col items-center gap-4'>
								<KoFiButton />
								<a
									href='https://www.producthunt.com/products/sandy-studio?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-sandy-studio'
									target='_blank'
									rel='noopener noreferrer'
									className='transition-opacity hover:opacity-90'
								>
									{/* biome-ignore lint/nursery/noImgElement: Product Hunt badge is a static SVG embed */}
									<img
										alt='Sandy Studio - VTuber con IA que habla con tu chat de Twitch | Product Hunt'
										width='250'
										height='54'
										className='block dark:hidden'
										src='https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1214052&theme=light&t=1785779991881'
									/>
									{/* biome-ignore lint/nursery/noImgElement: Product Hunt badge is a static SVG embed */}
									<img
										alt='Sandy Studio - VTuber con IA que habla con tu chat de Twitch | Product Hunt'
										width='250'
										height='54'
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
