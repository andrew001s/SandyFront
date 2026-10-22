'use client';

import { AuthAction } from '@/components/landing/AuthAction';
import { KoFiButton } from '@/components/landing/KoFi';
import { Reveal } from '@/components/landing/Reveal';
import { StarField } from '@/components/landing/StarField';
import { useAuth } from '@clerk/nextjs';
import { ArrowRight, Sparkle, Sparkles, Star } from 'lucide-react';

export function Cta() {
	const { isSignedIn } = useAuth();

	return (
		<section className='relative overflow-hidden py-24 md:py-32'>
			<div className='-z-10 pointer-events-none absolute inset-0'>
				<StarField
					count={40}
					seed={13}
					moon
					moonClassName='top-8 right-[12%]'
					className='absolute inset-0 opacity-40'
				/>
				<div className='-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 h-[380px] w-[600px] rounded-full bg-primary/10 blur-[100px]' />
			</div>

			<div className='relative mx-auto max-w-3xl px-4 text-center md:px-6'>
				<span
					style={{ animationDelay: '0.6s' }}
					className='absolute top-6 right-4 hidden animate-[twinkle_3s_ease-in-out_infinite] text-amber-400/80 md:block'
				>
					<Star size={20} className='fill-amber-400/60' />
				</span>
				<span
					style={{ animationDelay: '1.4s' }}
					className='absolute bottom-10 left-2 hidden animate-[twinkle_3.4s_ease-in-out_infinite] text-primary/70 md:block'
				>
					<Sparkle size={18} className='fill-primary/40' />
				</span>

				<Reveal>
					<div className='mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3.5 py-1 font-mono text-primary text-xs'>
						<Sparkles size={13} />
						<span>STREAM ENGINE ACTIVO</span>
					</div>
				</Reveal>

				<Reveal delay={0.1}>
					<h2 className='font-bold font-display text-3xl text-foreground tracking-tight sm:text-4xl md:text-5xl'>
						Comienza a transmitir con tu{' '}
						<span className='bg-gradient-to-r from-primary via-[#B8AAFF] to-[#F28BD8] bg-clip-text text-transparent'>
							co-animadora IA
						</span>
						.
					</h2>
				</Reveal>

				<Reveal delay={0.2}>
					<p className='mx-auto mt-4 max-w-xl font-sans text-muted-foreground text-sm leading-relaxed sm:text-base'>
						Crea tu cuenta, vincula tu canal de streaming y en pocos minutos Sandy estará saludando
						y conversando con tu chat con su propia voz y animaciones.
					</p>
				</Reveal>

				<Reveal delay={0.3}>
					<div className='mt-8 flex flex-wrap items-center justify-center gap-3'>
						<AuthAction
							action={isSignedIn ? 'app' : 'signup'}
							className='group flex h-11 items-center gap-2 rounded-lg bg-primary px-6 font-sans font-semibold text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.2),0_4px_16px_rgba(140,124,255,0.25)] transition-all hover:bg-primary/90'
						>
							<span>{isSignedIn ? 'Ir a la consola' : 'Crear cuenta gratis'}</span>
							<ArrowRight size={16} className='transition-transform group-hover:translate-x-1' />
						</AuthAction>
						<KoFiButton />
					</div>
				</Reveal>
			</div>
		</section>
	);
}
