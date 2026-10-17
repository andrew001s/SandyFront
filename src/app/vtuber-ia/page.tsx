import {
	type ContentFaq,
	ContentPage,
	type ContentSection,
} from '@/components/content/ContentPage';
import { metadataBase, sharedOpenGraphImage, sharedSiteName } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	metadataBase,
	title: 'VTuber con IA: Qué es y Cómo Crear el Tuyo Gratis (2D y 3D)',
	description:
		'Aprende qué es un VTuber con IA y cómo crear el tuyo gratis en español: lee tu chat de Twitch y Kick, responde con voz y se mueve en VTube Studio (2D) y VSeeFace (3D VRM).',
	keywords: [
		'vtuber con ia',
		'vtuber inteligencia artificial',
		'como crear un vtuber con ia',
		'crear vtuber con ia gratis',
		'vtuber ia español',
		'vtuber twitch',
		'vtuber kick',
		'vtuber que habla con chat',
		'vtuber 3d ia',
		'vseeface ia',
		'vtube studio ia',
		'neuro sama español',
		'avatar ia streaming',
	],
	alternates: {
		canonical: '/vtuber-ia',
	},
	openGraph: {
		title: 'VTuber con IA: Qué es y Cómo Crear el Tuyo Gratis (2D y 3D)',
		description:
			'Crea tu VTuber con IA gratis: lee tu chat, responde con voz natural y sincroniza su boca y emociones en VTube Studio (2D) o VSeeFace (3D).',
		type: 'website',
		siteName: sharedSiteName,
		url: '/vtuber-ia',
		locale: 'es_ES',
		images: [
			{
				url: sharedOpenGraphImage,
				width: 1200,
				height: 630,
				alt: 'Sandy Studio - VTuber con IA',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		site: '@ElShandrew',
		creator: '@ElShandrew',
		title: 'VTuber con IA: Qué es y Cómo Crear el Tuyo Gratis (2D y 3D)',
		description:
			'Crea tu VTuber con IA gratis: chat de Twitch y Kick, voz natural, VTube Studio y VSeeFace.',
	},
};

const sections: ContentSection[] = [
	{
		id: 'que-es-un-vtuber-con-ia',
		title: 'Qué es un VTuber con IA',
		body: [
			'Un VTuber es un streamer que aparece en pantalla como un personaje o avatar animado en lugar de mostrar su cara real. Un VTuber con IA (Inteligencia Artificial) va un paso más allá: la IA controla el avatar para leer el chat en vivo, responder preguntas, reaccionar a donaciones y mantener la conversación en tu canal de forma autónoma mientras tú juegas o te enfocas en el contenido.',
			'A diferencia de un VTuber tradicional, no necesitas estar constantemente hablando ni improvisando qué decir: el modelo de IA interpreta los mensajes de tu audiencia y contesta con la personalidad, tono y expresiones que tú definas.',
		],
	},
	{
		id: 'como-funciona',
		title: 'Cómo funciona Sandy Studio',
		body: ['Sandy Studio conecta en un solo panel todas las piezas que necesita tu VTuber con IA:'],
		list: [
			'Chat multicanal: lee mensajes de Twitch, Kick y YouTube en tiempo real.',
			'Cerebro de IA: tú eliges el modelo (Gemini, OpenRouter con Claude/Llama/DeepSeek, o modelos locales en Ollama).',
			'Voz natural con TTS: síntesis de voz en español y otros idiomas con Edge TTS (gratuito) o Fish Audio.',
			'Avatar 2D y 3D: sincronización labial inmediata (lip-sync a 60 FPS) y emociones en VTube Studio (Live2D) y VSeeFace (VRM/VRoid 3D vía VMC/OSC).',
			'Micrófono inteligente: escucha tu voz para ejecutar órdenes en stream o mantener un diálogo interactivo en vivo.',
			'Moderación automática: filtra spam, modera lenguaje inapropiado y protege tu chat.',
		],
	},
	{
		id: 'ventajas',
		title: 'Ventajas de un VTuber con IA frente a uno tradicional',
		list: [
			'Interactividad 24/7: la IA responde sola manteniendo el chat activo y dinámico.',
			'Atención a cada espectador: saluda y conversa incluso en canales pequeños con pocos viewers.',
			'Soporte completo para 2D (Live2D) y 3D (VRM): utiliza tu modelo favorito sin limitaciones.',
			'Voz ultrarrealista con lip-sync en tiempo real con 0 ms de retraso acústico.',
			'Compatible con Twitch, Kick y YouTube simultáneamente.',
			'Sin costo de infraestructura: funciona en la nube o en tu PC sin requerir hardware extremo.',
		],
	},
	{
		id: 'requisitos',
		title: 'Qué necesitas para empezar gratis',
		list: [
			'Una cuenta de Twitch, Kick o YouTube.',
			'Una cuenta en Sandy Studio y conectar tu canal con OAuth en un clic.',
			'Tu avatar: un modelo Live2D en VTube Studio o un modelo 3D VRM en VSeeFace (ambos gratuitos).',
			'Opcional: un micrófono para que la IA también te escuche a ti.',
		],
	},
];

const faqs: ContentFaq[] = [
	{
		question: '¿Necesito saber programar para crear un VTuber con IA?',
		answer:
			'No. Toda la configuración se realiza desde el panel visual de Sandy Studio con clics: conectas tu canal, seleccionas el modelo de IA, la voz y el avatar (VTube Studio o VSeeFace). No requieres código ni conocimientos técnicos.',
	},
	{
		question: '¿Puedo usar mi propio modelo 3D VRM o Live2D?',
		answer:
			'Sí, absolutamente. Sandy Studio es compatible con VTube Studio para modelos Live2D 2D y con VSeeFace para avatares 3D en formato VRM (VRoid Studio, Blender, etc.) a través del protocolo estándar VMC.',
	},
	{
		question: '¿Qué modelos de IA puedo usar?',
		answer:
			'Puedes usar Gemini de Google, modelos en OpenRouter (Claude, GPT, Llama, Mistral) o modelos locales en tu propia máquina mediante Ollama o LM Studio.',
	},
	{
		question: '¿El avatar mueve la boca con sincronización labial (lip sync)?',
		answer:
			'Sí. Sandy Studio analiza los formantes de audio en tiempo real y mueve la boca del avatar con precisión fonética a 60 FPS tanto en modelos 2D como en blendshapes 3D.',
	},
];

const related = [
	{
		href: '/chat-bot-twitch-ia',
		title: 'Bot de chat con IA para Twitch',
		description: 'Automatiza tu chat de Twitch con un bot que responde y modera por ti.',
	},
	{
		href: '/vtuber-kick',
		title: 'VTuber para Kick con IA',
		description: 'Lleva tu VTuber con IA a Kick y automatiza tu chat y eventos.',
	},
];

export default function VtuberIaPage() {
	return (
		<>
			<script type='application/ld+json'>
				{JSON.stringify({
					'@context': 'https://schema.org',
					'@graph': [
						{
							'@type': 'Article',
							'@id': `${metadataBase.origin}/vtuber-ia#article`,
							headline: 'VTuber con IA: qué es y cómo crear el tuyo',
							description:
								'Descubre qué es un VTuber con IA y cómo crear el tuyo gratis con Sandy Studio.',
							url: `${metadataBase.origin}/vtuber-ia`,
							publisher: {
								'@type': 'Organization',
								name: sharedSiteName,
							},
						},
						{
							'@type': 'FAQPage',
							'@id': `${metadataBase.origin}/vtuber-ia#faq`,
							mainEntity: faqs.map((faq) => ({
								'@type': 'Question',
								name: faq.question,
								acceptedAnswer: {
									'@type': 'Answer',
									text: faq.answer,
								},
							})),
						},
					],
				})}
			</script>
			<ContentPage
				badge='VTuber con IA'
				title='VTuber con IA: qué es y cómo crear el tuyo'
				description='Un VTuber con IA es un avatar que lee tu chat, responde con su voz y se mueve con lip sync, todo automáticamente. Así funciona y cómo puedes crear el tuyo gratis con Sandy Studio.'
				sections={sections}
				faqs={faqs}
				related={related}
			/>
		</>
	);
}
