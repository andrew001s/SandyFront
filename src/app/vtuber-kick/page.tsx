import {
	type ContentFaq,
	ContentPage,
	type ContentSection,
} from '@/components/content/ContentPage';
import { metadataBase, sharedSiteName } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	metadataBase,
	title: 'VTuber para Kick con IA',
	description:
		'Lleva tu VTuber con IA a Kick: Sandy Studio lee tu chat de Kick, responde con voz, reacciona a suscripciones y eventos y modera tu canal automáticamente.',
	keywords: [
		'vtuber kick',
		'vtuber para kick con IA',
		'bot kick con IA',
		'chat bot kick',
		'automatizar chat kick',
	],
	alternates: {
		canonical: '/vtuber-kick',
	},
	openGraph: {
		title: 'VTuber para Kick con IA',
		description:
			'Automatiza tu canal de Kick con un VTuber con IA que lee tu chat, responde con voz y modera.',
		type: 'website',
		siteName: sharedSiteName,
		url: '/vtuber-kick',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'VTuber para Kick con IA',
		description: 'Automatiza tu canal de Kick con un VTuber con IA.',
	},
};

const sections: ContentSection[] = [
	{
		id: 'kick-como-plataforma',
		title: 'Kick como plataforma de streaming',
		body: [
			'Kick ha crecido como alternativa para streamers que buscan más flexibilidad y una comunidad cercana. Muchos creadores usan Kick para transmitir en vivo mientras mantienen Twitch para otras audiencias. Sandy Studio funciona con ambos, para que tu VTuber con IA esté activa donde transmitas.',
		],
	},
	{
		id: 'como-funciona-sandy-en-kick',
		title: 'Cómo funciona Sandy Studio en Kick',
		body: [
			'Sandy Studio se conecta a tu canal de Kick para leer el chat y recibir sus eventos en tiempo real:',
		],
		list: [
			'Lee cada mensaje del chat de Kick y responde con la IA que elijas.',
			'Reacciona a suscripciones, seguidores y otros eventos de tu canal.',
			'Responde con su voz (Fish Audio) y mueve tu avatar en VTube Studio.',
			'Modera el chat automáticamente según tus reglas.',
			'Gestiona el inicio y la parada automática de la transmisión desde el panel.',
		],
	},
	{
		id: 'multiplataforma',
		title: 'Usa el mismo VTuber en Twitch y Kick',
		body: [
			'Como toda la configuración está centralizada en Sandy Studio, puedes tener la misma personalidad, la misma voz y las mismas reglas de moderación en Twitch y en Kick. No tienes que configurar todo dos veces: conectas cada canal y Sandy hace el resto.',
		],
	},
	{
		id: 'requisitos',
		title: 'Qué necesitas',
		list: [
			'Una cuenta de Kick (gratis).',
			'Una cuenta en Sandy Studio.',
			'Opcional: VTube Studio en tu PC para el avatar animado.',
			'Opcional: una clave de API para el modelo de IA y la voz que prefieras.',
		],
	},
];

const faqs: ContentFaq[] = [
	{
		question: '¿Sandy Studio funciona también con Twitch?',
		answer:
			'Sí. Puedes conectar tu canal de Twitch y tu canal de Kick a la misma cuenta y usar la misma IA, voz y configuración de moderación en ambos.',
	},
	{
		question: '¿Necesito una PC potente para usarlo en Kick?',
		answer:
			'No. La IA y el procesamiento corren en la nube. Solo necesitas un navegador y, si usas el avatar animado, VTube Studio funcionando con fluidez.',
	},
	{
		question: '¿Qué modelo de IA puedo usar?',
		answer:
			'El que prefieras: Gemini para empezar sin costo o cualquier modelo de OpenRouter. Cambias de modelo cuando quieras desde el panel.',
	},
];

const related = [
	{
		href: '/vtuber-ia',
		title: 'VTuber con IA',
		description: 'Qué es un VTuber con IA y cómo crear el tuyo.',
	},
	{
		href: '/chat-bot-twitch-ia',
		title: 'Bot de chat con IA para Twitch',
		description: 'Automatiza tu chat de Twitch con un bot con IA.',
	},
];

export default function VtuberKickPage() {
	return (
		<>
			<script type='application/ld+json'>
				{JSON.stringify({
					'@context': 'https://schema.org',
					'@graph': [
						{
							'@type': 'Article',
							'@id': `${metadataBase.origin}/vtuber-kick#article`,
							headline: 'VTuber para Kick con IA',
							description:
								'Automatiza tu canal de Kick con un VTuber con IA que lee tu chat, responde con voz y modera.',
							url: `${metadataBase.origin}/vtuber-kick`,
							publisher: {
								'@type': 'Organization',
								name: sharedSiteName,
							},
						},
						{
							'@type': 'FAQPage',
							'@id': `${metadataBase.origin}/vtuber-kick#faq`,
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
				badge='Kick'
				title='VTuber para Kick con IA'
				description='Lleva tu VTuber con IA a Kick: lee tu chat, responde con voz, reacciona a suscripciones y modera tu canal automáticamente, con la misma configuración que usas en Twitch.'
				sections={sections}
				faqs={faqs}
				related={related}
			/>
		</>
	);
}
