'use client';

import { Reveal } from '@/components/landing/Reveal';
import { StarField } from '@/components/landing/StarField';
import { BrainCircuit, MessageSquare, Mic, Sparkles, Star, Tv, User } from 'lucide-react';
import type { ReactNode } from 'react';

type Faq = {
	category: string;
	icon: ReactNode;
	question: string;
	answer: string;
	details?: Array<string>;
};

const faqs: Array<Faq> = [
	{
		category: 'Cuenta',
		icon: <User size={14} />,
		question: '¿Necesito experiencia técnica para usarlo?',
		answer:
			'No. Conectas tu canal de Twitch con OAuth, eliges el modelo de IA, la voz y el avatar desde el panel de Sandy Studio. Todo se configura con clics, sin tocar código ni abrir una terminal.',
		details: [
			'Conexión de Twitch en 1 clic con OAuth',
			'Panel visual para configurar IA, voz y avatar',
			'No necesitas instalar nada más que VTube Studio (opcional)',
		],
	},
	{
		category: 'Modelo IA',
		icon: <BrainCircuit size={14} />,
		question: '¿Qué modelos de IA usa Sandy Studio?',
		answer:
			'Sandy Studio no depende de un único cerebro: tú decides cómo piensa. Puedes usar Gemini o cualquier modelo de OpenRouter, desde opciones rápidas y económicas hasta los modelos más capaces del mercado.',
		details: [
			'Gemini: rápido y sin costo para empezar',
			'OpenRouter: cientos de modelos disponibles',
			'Cambia de modelo cuando quieras desde el panel',
		],
	},
	{
		category: 'Modelo IA',
		icon: <BrainCircuit size={14} />,
		question: '¿Quién paga los servicios de IA?',
		answer:
			'Sandy Studio actúa como intermediario: te ofrece la plataforma y la integración con Twitch, VTube Studio y el chat, pero los costos de los servicios de IA los asume cada usuario con sus propias claves de API.',
		details: [
			'Pegas tus propias claves de API (BYOK)',
			'Tú controlas cuánto gastas según el modelo y el uso',
			'La plataforma en sí es gratuita',
		],
	},
	{
		category: 'Avatar',
		icon: <Sparkles size={14} />,
		question: '¿Cómo se mueve el avatar y hace lip sync?',
		answer:
			'Sandy Studio se conecta con VTube Studio, que es como el motor del avatar. Cada palabra que dice se convierte en movimiento de boca y expresiones en tiempo real, sincronizadas con su voz.',
		details: [
			'Lip sync automático con la voz de Sandy Studio',
			'Expresiones y reacciones en vivo',
			'Funciona con tu propio modelo de VTube Studio',
		],
	},
	{
		category: 'Cuenta',
		icon: <User size={14} />,
		question: '¿Qué necesito para empezar?',
		answer:
			'Mínimo, una cuenta de Twitch. Creas tu cuenta en Sandy Studio, conectas tu canal y Sandy Studio empieza a leer el chat. Si quieres que el avatar se vea animado, instala VTube Studio en tu PC.',
		details: [
			'Una cuenta de Twitch (gratis)',
			'VTube Studio en tu PC para el avatar animado',
			'Micrófono si quieres que Sandy te escuche',
		],
	},
	{
		category: 'Voz',
		icon: <Mic size={14} />,
		question: '¿Puedo elegir la voz de Sandy Studio?',
		answer:
			'Sí. La voz se configura con Fish Audio: pegas tu clave de API y el ID de voz que prefieras. Así Sandy Studio suena con la personalidad y el tono que elijas, no con una voz genérica.',
		details: [
			'Soporta tu propia clave de Fish Audio',
			'Cambia de voz en cualquier momento',
			'El ID de voz lo eliges tú',
		],
	},
	{
		category: 'Twitch',
		icon: <Tv size={14} />,
		question: '¿Funciona con canales pequeños?',
		answer:
			'Sí. Sandy Studio reacciona a cada mensaje sin importar cuántos viewers tengas. En canales pequeños la conexión es aún más directa: cada saludo y cada donación recibe una respuesta en vivo.',
	},
	{
		category: 'Modelo IA',
		icon: <BrainCircuit size={14} />,
		question: '¿Puede Sandy Studio hablar en otros idiomas?',
		answer:
			'Sí. Como el cerebro lo eliges tú, Sandy Studio puede responder en el idioma que le indiques: español, inglés y muchos más. El chat y los comandos se adaptan a tu audiencia.',
	},
	{
		category: 'General',
		icon: <MessageSquare size={14} />,
		question: '¿Necesito una PC potente para usarla?',
		answer:
			'No. La IA y el procesamiento corren en la nube, así que tu PC no sufre. Solo necesitas una máquina capaz de abrir el navegador y, si usas el avatar, correr VTube Studio con fluidez.',
	},
];

function FaqItem({ faq, index }: { faq: Faq; index: number }) {
	return (
		<Reveal delay={(index % 4) * 0.07}>
			<details className='group overflow-hidden rounded-2xl border border-[#1B1536]/10 bg-white/80 transition-colors open:border-[#8B5CF6]/40 open:shadow-[0_12px_40px_rgba(139,92,246,0.08)] dark:border-white/10 dark:bg-[#100F1B]/80'>
				<summary className='flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 [&::-webkit-details-marker]:hidden'>
					<div className='flex items-center gap-3'>
						<span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-violet-600 dark:text-[#A78BFA]'>
							{faq.icon}
						</span>
						<span className='font-medium text-zinc-800 dark:text-zinc-100'>{faq.question}</span>
					</div>
					<span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-violet-600 transition-transform duration-300 group-open:rotate-180 dark:text-[#A78BFA]'>
						<Star
							size={15}
							className='fill-transparent transition-colors duration-300 group-open:fill-violet-600/30 dark:group-open:fill-[#A78BFA]/40'
						/>
					</span>
				</summary>
				<div className='px-6 pb-6'>
					<p className='text-sm text-zinc-600 leading-relaxed dark:text-zinc-400'>{faq.answer}</p>
					{faq.details && (
						<ul className='mt-4 space-y-2'>
							{faq.details.map((detail) => (
								<li
									key={detail}
									className='flex items-start gap-2.5 text-sm text-zinc-500 dark:text-zinc-400'
								>
									<Star
										size={12}
										className='mt-1 shrink-0 fill-amber-400/70 text-amber-500 dark:fill-[#FDE68A]/60 dark:text-[#FDE68A]'
									/>
									{detail}
								</li>
							))}
						</ul>
					)}
				</div>
			</details>
		</Reveal>
	);
}

export function Faq() {
	return (
		<section id='faq' className='relative py-24 md:py-32'>
			<div className='-z-10 pointer-events-none absolute inset-0'>
				<StarField count={22} seed={3} className='absolute inset-0 opacity-40' />
				<div className='-translate-x-1/2 absolute top-1/4 left-1/2 h-[420px] w-[760px] rounded-full bg-[#8B5CF6]/10 blur-[70px] md:blur-[140px]' />
			</div>

			<div className='mx-auto max-w-3xl px-5 md:px-8'>
				<Reveal className='mx-auto mb-14 max-w-2xl text-center'>
					<span className='mb-4 flex items-center justify-center gap-2 font-semibold text-violet-600 text-xs uppercase tracking-[0.25em] dark:text-[#A78BFA]'>
						Preguntas frecuentes
					</span>
					<h2 className='font-bold text-3xl text-zinc-900 [font-family:var(--font-unbounded)] sm:text-4xl md:text-5xl dark:text-zinc-50'>
						Todo lo que quieres{' '}
						<span className='bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent dark:from-[#A78BFA] dark:to-[#22D3EE]'>
							saber
						</span>{' '}
						<span className='inline-block animate-[twinkle_3s_ease-in-out_infinite] text-amber-400 dark:text-[#FDE68A]'>
							<Star size={24} className='fill-amber-400 dark:fill-[#FDE68A]' />
						</span>
					</h2>
					<p className='mt-4 text-base text-zinc-600 dark:text-zinc-400'>
						Lo más común que preguntan los streamers antes de dar el salto. Si tu duda no está aquí,
						abre la app y configúrala con calma.
					</p>
				</Reveal>

				<div className='space-y-3'>
					{faqs.map((faq, i) => (
						<FaqItem key={faq.question} faq={faq} index={i} />
					))}
				</div>
			</div>
		</section>
	);
}
