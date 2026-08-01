'use client';

import { AuthAction } from '@/components/landing/AuthAction';
import { KoFiButton } from '@/components/landing/KoFi';
import { Reveal } from '@/components/landing/Reveal';
import { StarField } from '@/components/landing/StarField';
import { ArrowRight, Sparkle, Sparkles, Star } from 'lucide-react';

export function Cta() {
	return (
		<section className='relative overflow-hidden py-28 md:py-36'>
			<div className='-z-10 pointer-events-none absolute inset-0'>
				<StarField count={50} seed={13} className='absolute inset-0 opacity-70' />
				<StarField moon moonClassName='top-8 right-[12%]' />
				<div className='-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 h-[520px] w-[820px] rounded-full bg-[#8B5CF6]/20 blur-[150px]' />
				<div className='absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(139,92,246,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.14)_1px,transparent_1px)] [background-size:72px_72px] dark:opacity-[0.04] dark:[background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)]' />
			</div>

			<div className='relative mx-auto max-w-4xl px-5 text-center md:px-8'>
				<span
					style={{ animationDelay: '0.6s' }}
					className='absolute top-6 right-4 hidden animate-[twinkle_3s_ease-in-out_infinite] text-amber-400/80 md:block dark:text-[#FDE68A]/80'
				>
					<Star size={20} className='fill-amber-400/60 dark:fill-[#FDE68A]/60' />
				</span>
				<span
					style={{ animationDelay: '1.4s' }}
					className='absolute bottom-10 left-2 hidden animate-[twinkle_3.4s_ease-in-out_infinite] text-violet-500/70 md:block dark:text-[#A78BFA]/70'
				>
					<Sparkle size={18} className='fill-violet-500/40 dark:fill-[#A78BFA]/40' />
				</span>
				<Reveal>
					<div className='mb-8 inline-flex items-center gap-2 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-4 py-1.5 font-medium text-violet-700 text-xs dark:text-[#C4B5FD]'>
						<Sparkles size={14} />
						Tu chat ya te está esperando
					</div>
				</Reveal>

				<Reveal delay={0.1}>
					<h2 className='font-extrabold text-4xl text-zinc-900 leading-[1.05] [font-family:var(--font-unbounded)] sm:text-5xl md:text-6xl dark:text-zinc-50'>
						Empieza a transmitir
						<br />
						con tu nueva{' '}
						<span className='bg-gradient-to-r from-violet-600 via-violet-700 to-cyan-600 bg-clip-text text-transparent dark:from-[#A78BFA] dark:via-[#8B5CF6] dark:to-[#22D3EE]'>
							co-animadora
						</span>
						.
					</h2>
				</Reveal>

				<Reveal delay={0.2}>
					<p className='mx-auto mt-6 max-w-xl text-lg text-zinc-600 dark:text-zinc-400'>
						Crea tu cuenta, conecta tu canal y en minutos Sandy estará saludando a tu chat con su
						propia voz.
					</p>
				</Reveal>

				<Reveal delay={0.3}>
					<div className='mt-10 flex flex-wrap items-center justify-center gap-3'>
						<AuthAction
							action='signup'
							className='group rounded-full border border-[#8B5CF6]/40 bg-[#8B5CF6] px-8 text-base text-white shadow-[0_0_36px_rgba(139,92,246,0.45)] transition-all hover:bg-[#7C4DFF] hover:shadow-[0_0_48px_rgba(139,92,246,0.7)]'
						>
							Crear cuenta gratis
							<ArrowRight size={18} className='transition-transform group-hover:translate-x-1' />
						</AuthAction>
						<KoFiButton />
					</div>
				</Reveal>
			</div>
		</section>
	);
}
