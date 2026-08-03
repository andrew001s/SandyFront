import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: 'Sandy Studio',
		short_name: 'Sandy Studio',
		description:
			'VTuber con IA para Twitch y Kick: conversa con tu chat, responde con voz y modera tu canal.',
		start_url: '/',
		display: 'standalone',
		background_color: '#0B0A12',
		theme_color: '#8B5CF6',
		lang: 'es',
		icons: [
			{
				src: '/favicon-32x32.png',
				sizes: '32x32',
				type: 'image/png',
			},
			{
				src: '/icons/icon-192.png',
				sizes: '192x192',
				type: 'image/png',
			},
			{
				src: '/icons/icon-512.png',
				sizes: '512x512',
				type: 'image/png',
			},
			{
				src: '/favicon.svg',
				sizes: 'any',
				type: 'image/svg+xml',
			},
		],
	};
}
