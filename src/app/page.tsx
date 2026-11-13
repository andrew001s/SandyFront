import { Landing } from '@/components/landing/Landing';
import { metadataBase, sharedDescription, sharedOpenGraphImage, sharedSiteName } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	metadataBase,
	title: 'VTuber con IA gratis para Twitch, Kick y YouTube | Sandy Studio',
	description:
		'Crea tu VTuber con IA gratis: avatar inteligente que habla con tu chat, responde con voz natural, lip sync en tiempo real para PNGTuber, Live2D y VRM en el navegador y modera tu stream en vivo.',
	keywords: [
		'vtuber con ia',
		'vtuber inteligencia artificial',
		'crear vtuber con ia gratis',
		'como crear un vtuber con ia',
		'vtuber ia español',
		'vtuber ai',
		'vtuber 3d con ia',
		'vtube studio ia',
		'avatar con ia',
		'vtuber que habla con chat',
		'bot para twitch con ia',
		'chat bot twitch ia',
		'vtuber kick con ia',
		'avatar streaming inteligencia artificial',
		'lip sync vtuber ia',
		'vrm avatar ia',
		'neuro sama español',
	],
	alternates: {
		canonical: '/',
	},
	openGraph: {
		title: 'VTuber con IA gratis para Twitch, Kick y YouTube | Sandy Studio',
		description: sharedDescription,
		type: 'website',
		siteName: sharedSiteName,
		url: '/',
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
		title: 'VTuber con IA gratis para Twitch, Kick y YouTube | Sandy Studio',
		description:
			'Crea tu propio VTuber con IA: lee tu chat, responde con voz y se mueve en PNGTuber, Live2D o VRM en el navegador.',
		images: [sharedOpenGraphImage],
	},
};

export default function LandingPage() {
	return (
		<>
			<script type='application/ld+json'>
				{JSON.stringify({
					'@context': 'https://schema.org',
					'@graph': [
						{
							'@type': 'Organization',
							'@id': `${metadataBase.origin}/#organization`,
							name: sharedSiteName,
							url: metadataBase.origin,
							logo: {
								'@type': 'ImageObject',
								url: `${metadataBase.origin}/icons/icon.png`,
							},
							sameAs: [
								'https://github.com/andrew001s',
								'https://x.com/ElShandrew',
								'https://www.twitch.tv/elshandrew',
								'https://www.youtube.com/@Shandrew',
								'https://www.instagram.com/elshandrew/',
								'https://discord.com/invite/KtCBAfneRy',
								'https://www.facebook.com/Shandrewvt',
							],
						},
						{
							'@type': 'WebSite',
							'@id': `${metadataBase.origin}/#website`,
							url: metadataBase.origin,
							name: sharedSiteName,
						},
						{
							'@type': 'SoftwareApplication',
							'@id': `${metadataBase.origin}/#software`,
							name: sharedSiteName,
							url: metadataBase.origin,
							description: sharedDescription,
							applicationCategory: 'MultimediaApplication',
							operatingSystem: 'Web',
							featureList: [
								'VTuber con IA para Twitch, Kick y YouTube',
								'Sincronización labial en tiempo real (Lip Sync 60 FPS)',
								'Estudio integrado para PNGTuber, Live2D y VRM',
								'Síntesis de voz natural y texto a voz (TTS)',
								'Moderación automática de chat con Inteligencia Artificial',
								'Interacción por micrófono en vivo',
							],
							offers: {
								'@type': 'Offer',
								price: '0',
								priceCurrency: 'USD',
							},
						},
						{
							'@type': 'FAQPage',
							'@id': `${metadataBase.origin}/#faq`,
							mainEntity: [
								{
									'@type': 'Question',
									name: '¿Cómo funciona un VTuber con IA?',
									acceptedAnswer: {
										'@type': 'Answer',
										text: 'Un VTuber con IA lee los mensajes del chat en plataformas como Twitch, Kick y YouTube en tiempo real, genera respuestas inteligentes con modelos de IA avanzados y mueve la boca de tu avatar 2D o 3D con sincronización labial y voz natural.',
									},
								},
								{
									'@type': 'Question',
									name: '¿Necesito experiencia técnica para usarlo?',
									acceptedAnswer: {
										'@type': 'Answer',
										text: 'No. Conectas tu canal de Twitch, Kick o YouTube con OAuth, eliges el modelo de IA, la voz y el avatar desde el panel visual de Sandy Studio con clics, sin necesidad de programar.',
									},
								},
								{
									'@type': 'Question',
									name: '¿Es compatible con avatares 2D y 3D?',
									acceptedAnswer: {
										'@type': 'Answer',
										text: 'Sí. Sandy Studio es compatible con avatares PNGTuber, Live2D y VRM directamente en el navegador.',
									},
								},
								{
									'@type': 'Question',
									name: '¿Cómo se mueve el avatar y hace lip sync?',
									acceptedAnswer: {
										'@type': 'Answer',
										text: 'Sandy Studio sincroniza la boca del avatar con su voz en PNGTuber, Live2D y VRM. Puedes elegir las emociones permitidas y configurar las expresiones del modelo para cada una.',
									},
								},
								{
									'@type': 'Question',
									name: '¿Qué modelos de IA puedo utilizar?',
									acceptedAnswer: {
										'@type': 'Answer',
										text: 'Puedes utilizar Gemini de Google o cualquier modelo disponible a través de OpenRouter o modelos locales (Ollama / vLLM), configurando la personalidad que desees para tu streamer virtual.',
									},
								},
							],
						},
					],
				})}
			</script>
			<div className='min-h-screen bg-background text-foreground'>
				<Landing />
			</div>
		</>
	);
}
