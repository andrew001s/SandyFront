'use client';

import { Reveal } from '@/components/landing/Reveal';
import { StarField } from '@/components/landing/StarField';
import {
	BrainCircuit,
	ChevronDown,
	MessageSquare,
	Mic,
	Sparkles,
	Star,
	Tv,
	User,
} from 'lucide-react';
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
		category: 'Configuración',
		icon: <User size={14} />,
		question: '¿Necesito experiencia técnica o programar para usarlo?',
		answer:
			'No. Conectas tu canal de Twitch, Kick o YouTube con OAuth, configuras tus claves de IA, la voz y el avatar desde la consola web. Todo se opera mediante interfaz visual, sin scripts en terminal ni código.',
		details: [
			'Conexión OAuth con Twitch, Kick o YouTube en un clic',
			'Panel gráfico para ajustar personalidad, voz y modelo',
			'No requiere instalaciones de Python ni servidores locales',
		],
	},
	{
		category: 'Modelo IA',
		icon: <BrainCircuit size={14} />,
		question: '¿Qué modelos de lenguaje soporta Sandy Studio?',
		answer:
			'Configura tu propia clave de Google Gemini u OpenRouter, o conecta un modelo local compatible. Elige el proveedor y el modelo desde Configuración.',
		details: [
			'Google Gemini con tu clave de API',
			'Modelos disponibles a través de OpenRouter',
			'IA local desde tu equipo',
		],
	},
	{
		category: 'Costos',
		icon: <BrainCircuit size={14} />,
		question: '¿Quién asume el costo de las APIs de IA?',
		answer:
			'Sandy Studio te proporciona la plataforma y las integraciones con los chats y protocolos de streaming. El consumo de IA y voz se gestiona directamente con tus propias claves de API, lo que te da control total sobre tu presupuesto sin márgenes ocultos.',
		details: [
			'Pagas únicamente lo que consumes a tus proveedores (Google, OpenRouter, Fish Audio)',
			'Sin cuotas mensuales obligatorias para la funcionalidad básica',
			'Límites de uso configurables en cada plataforma proveedora',
		],
	},
	{
		category: 'Avatar',
		icon: <Sparkles size={14} />,
		question: '¿Cómo funciona la sincronización de labios y movimiento?',
		answer:
			'Sandy Studio renderiza PNGTuber, Live2D y VRM en el navegador. La voz mueve la boca del avatar y puedes asociar sus expresiones a las emociones que permitas a la IA.',
		details: [
			'Sincronización labial en tiempo real',
			'Emociones automáticas que puedes activar, apagar y configurar',
			'Compatible con Live2D y VRM 3D estándar',
		],
	},
	{
		category: 'Requisitos',
		icon: <User size={14} />,
		question: '¿Qué necesito tener listo para empezar?',
		answer:
			'Una cuenta en Sandy Studio, tu proveedor de IA y una clave de Fish Audio para la voz. El avatar se carga en el estudio: imágenes PNG, un paquete Live2D o un archivo VRM. Copia el enlace del overlay para usarlo en OBS.',
		details: [
			'Canal en Twitch, Kick o YouTube activo',
			'Tu avatar PNGTuber, Live2D o VRM cargado en el navegador',
			'Micrófono si deseas que Sandy escuche lo que dices en vivo',
		],
	},
	{
		category: 'Voz',
		icon: <Mic size={14} />,
		question: '¿Puedo elegir o clonar la voz de mi VTuber?',
		answer:
			'Sí. La voz se procesa mediante Fish Audio. Puedes seleccionar cualquier ID de voz existente o crear tu propia clonación en Fish Audio y vincularla a Sandy pegando el Voice ID en tu configuración.',
	},
	{
		category: 'Audiencia',
		icon: <Tv size={14} />,
		question: '¿Es adecuado para canales pequeños o en crecimiento?',
		answer:
			'Completamente. En transmisiones con menos viewers, Sandy interactúa con cada mensaje del chat de manera personalizada, manteniendo la energía y la conversación fluida incluso en momentos donde estás concentrado en la partida.',
	},
	{
		category: 'Hardware',
		icon: <MessageSquare size={14} />,
		question: '¿Consume recursos de CPU o GPU en mi ordenador?',
		answer:
			'El navegador renderiza el avatar y consume recursos según el modelo y sus efectos. Si eliges un proveedor de IA o voz en la nube, ese procesamiento ocurre en sus servidores; un modelo de IA local también utiliza los recursos de tu equipo.',
	},
];

function FaqItem({ faq, index }: { faq: Faq; index: number }) {
	return (
		<Reveal delay={(index % 4) * 0.05}>
			<details className='group rounded-xl border border-border bg-card transition-all duration-200 open:border-primary/50'>
				<summary className='flex cursor-pointer select-none list-none items-center justify-between gap-4 p-4 font-medium font-sans text-foreground sm:p-5'>
					<div className='flex items-center gap-3'>
						<div className='flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-primary'>
							{faq.icon}
						</div>
						<span className='text-sm sm:text-base'>{faq.question}</span>
					</div>
					<div className='flex size-7 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background/50 text-muted-foreground transition-transform duration-200 group-open:rotate-180'>
						<ChevronDown size={14} />
					</div>
				</summary>
				<div className='px-5 pt-1 pb-5 font-sans text-muted-foreground text-xs leading-relaxed sm:text-sm'>
					<p>{faq.answer}</p>
					{faq.details && (
						<ul className='mt-3 space-y-1.5 border-border/60 border-t pt-3'>
							{faq.details.map((detail) => (
								<li key={detail} className='flex items-start gap-2 text-foreground/80'>
									<span className='mt-1.5 size-1 shrink-0 rounded-full bg-primary' />
									<span>{detail}</span>
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
		<section id='faq' className='relative py-20 md:py-28'>
			<div className='-z-10 pointer-events-none absolute inset-0'>
				<StarField count={20} seed={3} className='absolute inset-0 opacity-25' />
			</div>

			<div className='mx-auto max-w-3xl px-4 md:px-6'>
				<Reveal className='mb-12 text-center'>
					<span className='mb-3 inline-flex items-center gap-2 font-mono text-primary text-xs uppercase tracking-wider'>
						Centro de dudas
					</span>
					<h2 className='font-bold font-display text-3xl text-foreground tracking-tight sm:text-4xl md:text-5xl'>
						Preguntas frecuentes{' '}
						<span className='inline-block animate-[twinkle_3s_ease-in-out_infinite] text-amber-400'>
							<Star
								size={24}
								className='fill-amber-400 drop-shadow-[0_0_10px_rgba(253,230,138,0.7)]'
							/>
						</span>
					</h2>
					<p className='mt-3 font-sans text-muted-foreground text-sm sm:text-base'>
						Todo lo que necesitas conocer sobre compatibilidad, costes y configuración antes de
						salir en directo.
					</p>
				</Reveal>

				<div className='space-y-2.5'>
					{faqs.map((faq, i) => (
						<FaqItem key={faq.question} faq={faq} index={i} />
					))}
				</div>
			</div>
		</section>
	);
}
