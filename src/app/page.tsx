import { Landing } from '@/components/landing/Landing';
import { metadataBase, sharedDescription, sharedOpenGraphImage, sharedSiteName } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	metadataBase,
	title: 'VTuber con IA que conversa con tu chat | Sandy Studio',
	description:
		'Crea tu VTuber con IA para Twitch y Kick: lee tu chat, responde con su voz, se mueve en VTube Studio y modera tu canal. Gratis.',
	keywords: [
		'vtuber con IA',
		'vtuber inteligencia artificial',
		'vtuber twitch',
		'vtuber kick',
		'bot para twitch con IA',
		'chat bot twitch IA',
		'VTube Studio',
		'streamer',
		'IA',
	],
	alternates: {
		canonical: '/',
	},
	openGraph: {
		title: 'VTuber con IA que conversa con tu chat | Sandy Studio',
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
				alt: 'Sandy Studio',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		site: '@ElShandrew',
		creator: '@ElShandrew',
		title: 'VTuber con IA que conversa con tu chat | Sandy Studio',
		description:
			'Sandy Studio te ayuda a conectar Twitch, Kick, voz y avatar en una sola interfaz.',
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
									name: '¿Necesito experiencia técnica para usarlo?',
									acceptedAnswer: {
										'@type': 'Answer',
										text: 'No. Conectas tu canal de Twitch con OAuth, eliges el modelo de IA, la voz y el avatar desde el panel de Sandy Studio. Todo se configura con clics, sin tocar código.',
									},
								},
								{
									'@type': 'Question',
									name: '¿Qué modelos de IA usa Sandy Studio?',
									acceptedAnswer: {
										'@type': 'Answer',
										text: 'Tú decides cómo piensa: puedes usar Gemini o cualquier modelo de OpenRouter, desde opciones rápidas y económicas hasta los modelos más capaces del mercado.',
									},
								},
								{
									'@type': 'Question',
									name: '¿Cómo se mueve el avatar y hace lip sync?',
									acceptedAnswer: {
										'@type': 'Answer',
										text: 'Sandy Studio se conecta con VTube Studio: cada palabra que dice se convierte en movimiento de boca y expresiones en tiempo real, sincronizadas con su voz.',
									},
								},
								{
									'@type': 'Question',
									name: '¿Funciona con canales pequeños?',
									acceptedAnswer: {
										'@type': 'Answer',
										text: 'Sí. Sandy Studio reacciona a cada mensaje sin importar cuántos viewers tengas: cada saludo y cada donación recibe una respuesta en vivo.',
									},
								},
							],
						},
					],
				})}
			</script>
			<div className='min-h-screen bg-[#F6F3FC] dark:bg-[#0B0A12]'>
				<Landing />
			</div>
		</>
	);
}
