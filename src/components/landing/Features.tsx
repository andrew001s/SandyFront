'use client';

import { Reveal } from '@/components/landing/Reveal';
import { StarField } from '@/components/landing/StarField';
import { Mic, Radio, Sparkles, Star } from 'lucide-react';
import type { ReactNode } from 'react';
import { BsMoonStarsFill } from 'react-icons/bs';

type Feature = {
	icon: ReactNode;
	title: string;
	description: string;
	accent: string;
};

const features: Array<Feature & { span: string }> = [
	{
		icon: <Sparkles size={22} />,
		title: 'Chat en vivo con IA',
		description:
			'Sandy lee el chat de Twitch en tiempo real y responde con contexto: saluda, sigue comandos y mantiene la conversación encendida mientras tú juegas.',
		accent: 'from-[#8B5CF6]/20 to-transparent text-violet-600 dark:text-[#A78BFA]',
		span: 'lg:col-span-4',
	},
	{
		icon: <BsMoonStarsFill size={24} />,
		title: 'Lip sync en VTube Studio',
		description: 'El avatar mueve la boca sincronizado con cada palabra que dice Sandy.',
		accent: 'from-[#22D3EE]/20 to-transparent text-cyan-600 dark:text-[#67E8F9]',
		span: 'lg:col-span-2',
	},
	{
		icon: <Mic size={22} />,
		title: 'Entiende tu voz',
		description:
			'Reconocimiento de voz con Azure Speech: habla por el micrófono y Sandy lo convierte en acción.',
		accent: 'from-[#8B5CF6]/20 to-transparent text-violet-600 dark:text-[#A78BFA]',
		span: 'lg:col-span-2',
	},
	{
		icon: <Star size={22} />,
		title: 'Voz natural',
		description:
			'Síntesis de voz con Fish Audio para que Sandy suene real, con personalidad y tono propio.',
		accent: 'from-[#22D3EE]/20 to-transparent text-cyan-600 dark:text-[#67E8F9]',
		span: 'lg:col-span-2',
	},
	{
		icon: <Radio size={22} />,
		title: 'Conexión a Twitch',
		description:
			'Conecta tu canal con OAuth, escucha los mensajes y reacciona al instante sin tocar tu setup.',
		accent: 'from-[#8B5CF6]/20 to-transparent text-violet-600 dark:text-[#A78BFA]',
		span: 'lg:col-span-2',
	},
	{
		icon: <BsMoonStarsFill size={24} />,
		title: 'El modelo que tú elijas',
		description:
			'Usa Gemini u OpenRouter para decidir cómo piensa Sandy: desde respuestas rápidas hasta el modelo de IA más capaz del mercado.',
		accent: 'from-[#8B5CF6]/20 to-transparent text-violet-600 dark:text-[#A78BFA]',
		span: 'lg:col-span-6',
	},
];

function FeatureCard({ feature, index }: { feature: Feature & { span: string }; index: number }) {
	return (
		<Reveal delay={(index % 3) * 0.12} className={`${feature.span} col-span-6`}>
			<div className='group hover:-translate-y-1 relative h-full overflow-hidden rounded-3xl border border-[#1B1536]/10 bg-white p-7 transition-all duration-300 hover:border-[#8B5CF6]/40 hover:shadow-[0_0_40px_rgba(139,92,246,0.15)] dark:border-white/10 dark:bg-[#100F1B]'>
				<div
					className={`-top-16 -right-16 pointer-events-none absolute h-40 w-40 rounded-full bg-gradient-to-br opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100 ${feature.accent}`}
				/>
				<span
					style={{ animationDelay: `${(index % 3) * 0.6}s` }}
					className='absolute top-6 right-6 animate-[twinkle_3s_ease-in-out_infinite] text-violet-500/70 dark:text-[#A78BFA]/70'
				>
					<Star size={14} className='fill-violet-500/30 dark:fill-[#A78BFA]/30' />
				</span>
				<div className='relative mb-5 h-12 w-12'>
					<span className='absolute inset-0 animate-ping rounded-2xl bg-[#8B5CF6]/20' />
					<span
						className={`relative flex h-12 w-12 items-center justify-center rounded-2xl border border-[#1B1536]/10 bg-gradient-to-br dark:border-white/10 ${feature.accent}`}
					>
						{feature.icon}
					</span>
				</div>
				<h3 className='mb-2 font-semibold text-lg text-zinc-900 [font-family:var(--font-unbounded)] dark:text-zinc-50'>
					{feature.title}
				</h3>
				<p className='max-w-xl text-sm text-zinc-600 leading-relaxed dark:text-zinc-400'>
					{feature.description}
				</p>
			</div>
		</Reveal>
	);
}

export function Features() {
	return (
		<section id='features' className='relative py-24 md:py-32'>
			<div className='-z-10 pointer-events-none absolute inset-0'>
				<StarField count={30} seed={5} className='absolute inset-0 opacity-40' />
			</div>
			<div className='mx-auto max-w-7xl px-5 md:px-8'>
				<Reveal className='mb-14 max-w-2xl'>
					<span className='mb-4 flex items-center gap-2 font-semibold text-violet-600 text-xs uppercase tracking-[0.25em] dark:text-[#A78BFA]'>
						Funciones
					</span>
					<h2 className='font-bold text-3xl text-zinc-900 [font-family:var(--font-unbounded)] sm:text-4xl md:text-5xl dark:text-zinc-50'>
						No es un bot más.
						<br />
						<span className='bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent dark:from-[#A78BFA] dark:to-[#22D3EE]'>
							Es tu co-animadora.
						</span>
					</h2>
				</Reveal>

				<div className='grid grid-cols-6 gap-5'>
					{features.map((feature, i) => (
						<FeatureCard key={feature.title} feature={feature} index={i} />
					))}
				</div>
			</div>
		</section>
	);
}
