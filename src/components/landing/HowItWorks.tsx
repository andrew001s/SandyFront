'use client';

import { Reveal } from '@/components/landing/Reveal';
import { MoonGlow, StarField } from '@/components/landing/StarField';
import { ArrowDown, Plug, Sparkles, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { BsMoonStarsFill } from 'react-icons/bs';

const steps = [
	{
		number: '01',
		icon: <Plug size={20} />,
		title: 'Conecta tu canal',
		description:
			'Inicia sesión y conecta tu Twitch con OAuth. Sandy empieza a escuchar el chat al instante.',
	},
	{
		number: '02',
		icon: <Sparkles size={20} />,
		title: 'Elige su voz y cerebro',
		description:
			'Configura el modelo de IA (Gemini u OpenRouter), la voz de Fish Audio y el personaje de VTube Studio.',
	},
	{
		number: '03',
		icon: <BsMoonStarsFill size={22} />,
		title: 'Transmite y conversa',
		description:
			'Sandy responde por voz, mueve el avatar y reacciona a tu micrófono mientras haces stream.',
	},
];

export function HowItWorks() {
	return (
		<section id='como-funciona' className='relative py-24 md:py-32'>
			<div className='-z-10 pointer-events-none absolute inset-0'>
				<StarField count={24} seed={9} className='absolute inset-0 opacity-40' />
				<div className='absolute top-1/3 left-[-10%] h-[400px] w-[500px] rounded-full bg-[#8B5CF6]/10 blur-[130px]' />
				<motion.div
					animate={{ y: [0, -12, 0] }}
					transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY }}
					className='absolute top-16 right-[10%] hidden lg:block'
				>
					<MoonGlow flip />
				</motion.div>
			</div>

			<div className='mx-auto max-w-7xl px-5 md:px-8'>
				<Reveal className='mb-16 max-w-2xl'>
					<span className='mb-4 flex items-center gap-2 font-semibold text-violet-600 text-xs uppercase tracking-[0.25em] dark:text-[#A78BFA]'>
						Cómo funciona
					</span>
					<h2 className='font-bold text-3xl text-zinc-900 [font-family:var(--font-unbounded)] sm:text-4xl md:text-5xl dark:text-zinc-50'>
						En 3 pasos está{' '}
						<span className='bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent dark:from-[#A78BFA] dark:to-[#22D3EE]'>
							on air
						</span>
						.
					</h2>
				</Reveal>

				<div className='relative grid gap-10 md:grid-cols-3 md:gap-8'>
					<motion.div
						initial={{ scaleX: 0 }}
						whileInView={{ scaleX: 1 }}
						viewport={{ once: true, amount: 0.6 }}
						transition={{ duration: 1.1, ease: [0.21, 0.47, 0.32, 0.98] }}
						className='absolute top-7 right-[16%] left-[16%] hidden h-px origin-left bg-gradient-to-r from-[#8B5CF6]/60 via-[#22D3EE]/60 to-[#8B5CF6]/20 md:block'
					>
						{[{ left: '0%' }, { left: '50%' }, { left: '100%' }].map((dot, i) => (
							<span
								key={i}
								className='-top-[3px] absolute h-1.5 w-1.5 rounded-full bg-violet-500 dark:bg-[#A78BFA]'
								style={dot}
							/>
						))}
					</motion.div>

					{steps.map((step, i) => (
						<Reveal key={step.number} delay={i * 0.18} className='relative'>
							<div className='group hover:-translate-y-1 relative rounded-3xl border border-[#1B1536]/10 bg-white/80 p-7 transition-all duration-300 hover:border-[#8B5CF6]/40 dark:border-white/10 dark:bg-[#100F1B]/80'>
								<div className='mb-6 flex items-center justify-between'>
									<div className='relative flex h-14 w-14 items-center justify-center rounded-2xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-violet-600 transition-colors group-hover:bg-[#8B5CF6]/20 dark:text-[#A78BFA]'>
										{step.icon}
										<span
											style={{ animationDelay: `${i * 0.7}s` }}
											className='-top-1.5 -right-1.5 absolute animate-[twinkle_3s_ease-in-out_infinite] text-amber-500 dark:text-[#FDE68A]/90'
										>
											<Star size={10} className='fill-amber-400 dark:fill-[#FDE68A]' />
										</span>
									</div>
									<span className='font-extrabold text-4xl text-[#8B5CF6]/15 [font-family:var(--font-unbounded)] dark:text-white/10'>
										{step.number}
									</span>
								</div>
								<h3 className='mb-2 font-semibold text-xl text-zinc-900 [font-family:var(--font-unbounded)] dark:text-zinc-50'>
									{step.title}
								</h3>
								<p className='text-sm text-zinc-600 leading-relaxed dark:text-zinc-400'>
									{step.description}
								</p>
							</div>

							{i < steps.length - 1 && (
								<div className='mt-6 flex justify-center md:hidden'>
									<span className='flex h-9 w-9 items-center justify-center rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-violet-600 dark:text-[#A78BFA]'>
										<ArrowDown size={16} />
									</span>
								</div>
							)}
						</Reveal>
					))}
				</div>
			</div>
		</section>
	);
}
