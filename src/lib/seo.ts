import type { Metadata } from 'next';

const DEFAULT_SITE_URL = 'https://www.sandystudio.net';

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;
export const metadataBase = new URL(siteUrl);

export const sharedSiteName = 'Sandy Studio';
export const sharedDescription =
	'Sandy Studio es la plataforma para crear tu VTuber con IA gratis para Twitch, Kick y YouTube: conversa con tu chat en tiempo real, responde con voz natural y sincroniza tu avatar en 2D (VTube Studio) o 3D (VNyan).';

export const sharedKeywords = [
	'vtuber con ia',
	'vtuber inteligencia artificial',
	'crear vtuber con ia gratis',
	'vtuber con ia gratis',
	'como crear un vtuber con ia',
	'vtuber ia español',
	'vtuber ai',
	'vtuber 3d con ia',
	'vnyan ia',
	'vseeface ia',
	'vtube studio ia',
	'avatar con ia',
	'vtuber que habla con el chat',
	'bot para twitch con ia',
	'chat bot twitch ia',
	'vtuber kick con ia',
	'avatar streaming inteligencia artificial',
	'lip sync vtuber ia',
	'vrm avatar ia',
];

export const sharedOpenGraphImage = '/icons/og.png';

export const noIndexMetadata: Metadata = {
	robots: {
		index: false,
		follow: false,
		nocache: true,
	},
};
