import { Landing } from '@/components/landing/Landing';
import type { Metadata } from 'next';
import { metadataBase, sharedDescription, sharedOpenGraphImage, sharedSiteName } from '@/lib/seo';

export const metadata: Metadata = {
	metadataBase,
	title: 'Sandy Studio | VTuber con IA para Twitch y VTube Studio',
	description:
		'Sandy Studio es una VTuber impulsada por inteligencia artificial que lee tu chat de Twitch, responde con su voz, se mueve en VTube Studio y entiende lo que dices por micrófono.',
	keywords: [
		'VTuber',
		'IA',
		'Twitch',
		'VTube Studio',
		'streamer',
		'chat bot',
	],
	alternates: {
		canonical: '/',
	},
	openGraph: {
		title: sharedSiteName,
		description: sharedDescription,
		type: 'website',
		siteName: sharedSiteName,
		url: '/',
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
		title: sharedSiteName,
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
							sameAs: [],
						},
						{
							'@type': 'WebSite',
							'@id': `${metadataBase.origin}/#website`,
							url: metadataBase.origin,
							name: sharedSiteName,
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
