import {
	type ContentFaq,
	ContentPage,
	type ContentSection,
} from '@/components/content/ContentPage';
import { metadataBase, sharedSiteName } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	metadataBase,
	title: 'Bot de chat con IA para Twitch',
	description:
		'Un bot de chat con IA para Twitch que responde a tu chat con su propia voz, modera tu canal y reacciona a donaciones y eventos. Conéctalo con OAuth en 1 clic con Sandy Studio.',
	keywords: [
		'bot para twitch con IA',
		'chat bot twitch',
		'bot twitch inteligencia artificial',
		'bot que responde en twitch',
		'automatizar chat twitch',
	],
	alternates: {
		canonical: '/chat-bot-twitch-ia',
	},
	openGraph: {
		title: 'Bot de chat con IA para Twitch',
		description:
			'Automatiza tu chat de Twitch con un bot con IA que responde con voz, modera y reacciona a tu audiencia.',
		type: 'website',
		siteName: sharedSiteName,
		url: '/chat-bot-twitch-ia',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Bot de chat con IA para Twitch',
		description: 'Automatiza tu chat de Twitch con un bot con IA.',
	},
};

const sections: ContentSection[] = [
	{
		id: 'que-hace-un-bot-ia',
		title: 'Qué hace un bot de chat con IA',
		body: [
			'Un bot de chat con IA para Twitch no se limita a repetir comandos: entiende el contexto de la conversación, responde a cada mensaje con naturalidad y reacciona a los eventos de tu canal en tiempo real. Es como tener un co-mod que además mantiene vivo tu chat cuando no puedes responder.',
		],
		list: [
			'Responde a cada mensaje del chat con texto y voz.',
			'Reacciona a suscripciones, donaciones, raids y recompensas.',
			'Modera tu canal: detecta spam, palabras bloqueadas y enlaces no deseados.',
			'Atiende comandos personalizados con la información que tú definas.',
			'Habla en español, inglés o el idioma que le indiques.',
		],
	},
	{
		id: 'como-conectarlo',
		title: 'Cómo conectarlo a tu canal en 1 clic',
		body: [
			'Con Sandy Studio no necesitas crear un bot en dev.twitch.tv ni gestionar tokens manualmente. La conexión usa OAuth oficial de Twitch:',
		],
		list: [
			'Crea tu cuenta en Sandy Studio.',
			'Conecta tu canal de Twitch con OAuth en un clic.',
			'Elige el modelo de IA (Gemini o OpenRouter) y la voz de Fish Audio.',
			'Define la personalidad y las reglas de moderación en el panel.',
		],
	},
	{
		id: 'moderacion',
		title: 'Moderación automática',
		body: [
			'La IA puede actuar como moderador de tu chat las 24 horas: filtra mensajes que incumplan tus reglas, responde de forma amable cuando un usuario pide ayuda y mantiene el canal ordenado mientras tú te concentras en el contenido.',
		],
	},
	{
		id: 'requisitos',
		title: 'Qué necesitas',
		list: [
			'Una cuenta de Twitch (gratis).',
			'Una cuenta en Sandy Studio.',
			'Opcional: una clave de API para los modelos de IA que prefieras (Gemini es gratuito para empezar).',
			'Opcional: VTube Studio si además quieres que un avatar anime tu stream.',
		],
	},
];

const faqs: ContentFaq[] = [
	{
		question: '¿Necesito experiencia técnica para configurar el bot?',
		answer:
			'No. Todo se configura desde el panel visual de Sandy Studio. La conexión con Twitch usa OAuth oficial y no tienes que tocar código ni servidores.',
	},
	{
		question: '¿El bot puede moderar mi chat?',
		answer:
			'Sí. Puedes configurar palabras bloqueadas, enlaces y reglas de moderación, y la IA los aplica automáticamente en tu canal.',
	},
	{
		question: '¿Cuánto cuesta?',
		answer:
			'La plataforma de Sandy Studio es gratuita. Tú pagas únicamente el uso de los modelos de IA con tus propias claves de API, controlando cuánto gastas.',
	},
];

const related = [
	{
		href: '/vtuber-ia',
		title: 'VTuber con IA',
		description: 'Convierte tu bot en un VTuber con avatar animado y lip sync.',
	},
	{
		href: '/vtuber-kick',
		title: 'VTuber para Kick con IA',
		description: 'El mismo bot con IA, ahora para tu canal de Kick.',
	},
];

export default function ChatBotTwitchIaPage() {
	return (
		<>
			<script type='application/ld+json'>
				{JSON.stringify({
					'@context': 'https://schema.org',
					'@graph': [
						{
							'@type': 'Article',
							'@id': `${metadataBase.origin}/chat-bot-twitch-ia#article`,
							headline: 'Bot de chat con IA para Twitch',
							description:
								'Automatiza tu chat de Twitch con un bot con IA que responde con voz, modera y reacciona a tu audiencia.',
							url: `${metadataBase.origin}/chat-bot-twitch-ia`,
							publisher: {
								'@type': 'Organization',
								name: sharedSiteName,
							},
						},
						{
							'@type': 'FAQPage',
							'@id': `${metadataBase.origin}/chat-bot-twitch-ia#faq`,
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
				badge='Bot Twitch con IA'
				title='Bot de chat con IA para Twitch'
				description='Automatiza tu chat de Twitch con un bot que entiende la conversación, responde con su propia voz y modera tu canal. Conéctalo en 1 clic con OAuth y sin tocar código.'
				sections={sections}
				faqs={faqs}
				related={related}
			/>
		</>
	);
}
