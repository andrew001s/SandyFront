import {
	type ContentFaq,
	ContentPage,
	type ContentSection,
} from '@/components/content/ContentPage';
import { metadataBase, sharedSiteName } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	metadataBase,
	title: 'VTuber con IA: qué es y cómo crear el tuyo',
	description:
		'Descubre qué es un VTuber con IA, cómo funciona y cómo crear el tuyo gratis con Sandy Studio: lee tu chat de Twitch, responde con voz y se mueve en VTube Studio.',
	keywords: [
		'vtuber con IA',
		'vtuber inteligencia artificial',
		'como crear un vtuber',
		'vtuber twitch',
		'vtuber que habla con chat',
	],
	alternates: {
		canonical: '/vtuber-ia',
	},
	openGraph: {
		title: 'VTuber con IA: qué es y cómo crear el tuyo',
		description:
			'Crea tu VTuber con IA gratis: lee tu chat de Twitch, responde con su voz y se mueve en VTube Studio.',
		type: 'website',
		siteName: sharedSiteName,
		url: '/vtuber-ia',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'VTuber con IA: qué es y cómo crear el tuyo',
		description: 'Crea tu VTuber con IA gratis: chat de Twitch, voz y VTube Studio.',
	},
};

const sections: ContentSection[] = [
	{
		id: 'que-es-un-vtuber-con-ia',
		title: 'Qué es un VTuber con IA',
		body: [
			'Un VTuber es un streamer que aparece en pantalla como un personaje o avatar animado en lugar de mostrar su cara real. Un VTuber con IA va un paso más allá: no es solo un avatar, sino que una inteligencia artificial lo controla para leer el chat, responder preguntas, reaccionar a donaciones y mantener la conversación en tu canal mientras tú te centras en jugar o crear contenido.',
			'La diferencia con un VTuber tradicional es que no necesitas estar constantemente hablando ni pensar en qué decir: la IA interpreta los mensajes de tu audiencia y responde con la personalidad que tú configures.',
		],
	},
	{
		id: 'como-funciona',
		title: 'Cómo funciona Sandy Studio',
		body: ['Sandy Studio conecta en un solo panel las piezas que necesita tu VTuber con IA:'],
		list: [
			'Chat: lee los mensajes de Twitch y Kick en tiempo real.',
			'Cerebro: tú eliges el modelo de IA, desde Gemini hasta cientos de modelos en OpenRouter.',
			'Voz: responde con una voz de Fish Audio que tú configuras, con el tono y la personalidad que quieras.',
			'Avatar: cada palabra se convierte en movimiento de boca y expresiones en VTube Studio.',
			'Micrófono: entiende lo que dices en voz alta para dar órdenes o mantener el flujo del stream.',
			'El resultado es un co-animador que saluda a tu chat, agradece donaciones, responde comandos y modera tu canal de forma automática.',
		],
	},
	{
		id: 'ventajas',
		title: 'Ventajas frente a un VTuber tradicional',
		list: [
			'No dependes de apps externas de conversación: la IA responde sola con tu personalidad.',
			'Reacciona a cada mensaje, incluso en canales pequeños con pocos viewers.',
			'Modera tu chat automáticamente mientras transmites.',
			'Funciona sin una PC potente: la IA corre en la nube.',
			'Compatible con Twitch y Kick desde una misma plataforma.',
		],
	},
	{
		id: 'requisitos',
		title: 'Qué necesitas para empezar',
		list: [
			'Una cuenta de Twitch o Kick (gratis).',
			'Una cuenta en Sandy Studio y conectar tu canal con OAuth en un clic.',
			'Opcional: VTube Studio en tu PC para que el avatar se vea animado.',
			'Opcional: un micrófono si quieres que Sandy te escuche.',
		],
	},
];

const faqs: ContentFaq[] = [
	{
		question: '¿Necesito saber programar para tener un VTuber con IA?',
		answer:
			'No. Toda la configuración se hace desde el panel visual de Sandy Studio con clics: conectas tu canal, eliges el modelo de IA, la voz y el avatar. No hay código ni terminal.',
	},
	{
		question: '¿Qué modelo de IA puedo usar?',
		answer:
			'El que quieras. Sandy Studio no depende de un único cerebro: puedes usar Gemini o cualquier modelo de OpenRouter y cambiar cuando quieras.',
	},
	{
		question: '¿El avatar hace lip sync con la voz?',
		answer:
			'Sí. Sandy Studio se conecta con VTube Studio y cada palabra que dice se convierte en movimiento de boca y expresiones en tiempo real.',
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
