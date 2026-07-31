import { Landing } from '@/components/landing/Landing';
import type { Metadata } from 'next';
import { Unbounded } from 'next/font/google';

const unbounded = Unbounded({
	variable: '--font-unbounded',
	subsets: ['latin'],
	weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
	title: 'Sandy Studio — Tu VTuber con IA que conversa con tu chat',
	description:
		'Sandy Studio es una VTuber impulsada por inteligencia artificial que lee tu chat de Twitch, responde con su voz, se mueve en VTube Studio y entiende lo que dices por micrófono.',
	keywords: [
		'VTuber',
		'IA',
		'Twitch',
		'VTube Studio',
		'streamer',
		'chat bot',
		'Azure Speech',
		'Fish Audio',
	],
	openGraph: {
		title: 'Sandy Studio — Tu VTuber con IA que conversa con tu chat',
		description:
			'Una VTuber con inteligencia artificial que lee tu chat, responde con su voz y se mueve en VTube Studio.',
		type: 'website',
		siteName: 'Sandy Studio',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Sandy Studio — Tu VTuber con IA',
		description: 'Tu chat conversa con Sandy. Conecta Twitch y VTube Studio en minutos.',
	},
};

export default function LandingPage() {
	return (
		<div className={`${unbounded.variable} min-h-screen bg-[#F6F3FC] dark:bg-[#0B0A12]`}>
			<Landing />
		</div>
	);
}
