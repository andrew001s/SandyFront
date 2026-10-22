'use client';

import { Reveal } from '@/components/landing/Reveal';
import { MoonGlow, StarField } from '@/components/landing/StarField';
import { Bot, Mic, MonitorPlay, Radio, Star } from 'lucide-react';
import { motion } from 'motion/react';

const steps = [
	{
		number: '01',
		icon: <Radio size={18} />,
		title: 'Conecta tu canal',
		description:
			'Inicia sesión con OAuth y vincula tu canal de Twitch, Kick o YouTube con un solo clic para escuchar el chat.',
	},
	{
		number: '02',
		icon: <Bot size={18} />,
		title: 'Elige modelo y voz',
		description:
			'Configura tu clave de Gemini u OpenRouter (BYOK) y asigna tu voz personalizada en Fish Audio.',
	},
	{
		number: '03',
		icon: <Mic size={18} />,
		title: 'Vincula tu avatar',
		description:
			'Conecta tu modelo Live2D en VTube Studio o tu avatar VRM 3D en VNyan a través de WebSocket.',
	},
	{
		number: '04',
		icon: <MonitorPlay size={18} />,
		title: 'Transmite en directo',
		description:
			'Sandy responde en tiempo real con lip sync, reacciona a tu micrófono y entretiene al chat mientras juegas.',
	},
];

export function HowItWorks() {
	return (
		<section id='como-funciona' className='relative py-20 md:py-28'>
			<div className='-z-10 pointer-events-none absolute inset-0'>
				<StarField count={20} seed={9} className='absolute inset-0 opacity-25' />
				<motion.div
					animate={{ y: [0, -12, 0] }}
					transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY }}
					className='absolute top-16 right-[10%] hidden lg:block'
				>
					<MoonGlow flip />
				</motion.div>
			</div>

			<div className='mx-auto max-w-6xl px-4 md:px-6'>
				<Reveal className='mb-12 max-w-2xl'>
					<span className='mb-3 inline-flex items-center gap-2 font-mono text-primary text-xs uppercase tracking-wider'>
						Flujo de puesta en marcha
					</span>
					<h2 className='font-bold font-display text-3xl text-foreground tracking-tight sm:text-4xl md:text-5xl'>
						En 4 pasos tu VTuber está{' '}
						<span className='bg-gradient-to-r from-primary via-[#B8AAFF] to-[#F28BD8] bg-clip-text text-transparent'>
							en el aire
						</span>
						.
					</h2>
					<p className='mt-3 font-sans text-muted-foreground text-sm sm:text-base'>
						Sin scripts complicados en Python ni instalaciones en local: la plataforma opera desde
						tu navegador y se conecta a tus aplicaciones de streaming habituales.
					</p>
				</Reveal>

				<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
					{steps.map((step, i) => (
						<Reveal key={step.number} delay={i * 0.1}>
							<div className='group flex h-full flex-col justify-between rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-sm'>
								<div>
									<div className='mb-4 flex items-center justify-between'>
										<div className='relative flex size-10 items-center justify-center rounded-lg border border-border bg-background text-primary'>
											{step.icon}
											<span
												style={{ animationDelay: `${i * 0.7}s` }}
												className='-top-1 -right-1 absolute animate-[twinkle_3s_ease-in-out_infinite] text-amber-400'
											>
												<Star size={10} className='fill-amber-400' />
											</span>
										</div>
										<span className='font-bold font-mono text-primary/70 text-xs'>
											{step.number}
										</span>
									</div>
									<h3 className='font-display font-semibold text-base text-foreground'>
										{step.title}
									</h3>
									<p className='mt-2 font-sans text-muted-foreground text-xs leading-relaxed sm:text-sm'>
										{step.description}
									</p>
								</div>
							</div>
						</Reveal>
					))}
				</div>
			</div>
		</section>
	);
}
