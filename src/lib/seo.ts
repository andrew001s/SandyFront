import type { Metadata } from 'next';

const DEFAULT_SITE_URL = 'https://www.sandystudio.net';

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;
export const metadataBase = new URL(siteUrl);

export const sharedSiteName = 'Sandy Studio';
export const sharedDescription =
	'Sandy Studio es una VTuber con IA para Twitch y Kick: conversa con tu chat, reacciona con voz, monitoriza servicios y se conecta con tu avatar.';

export const sharedOpenGraphImage = '/icons/sandyDark.png';

export const noIndexMetadata: Metadata = {
	robots: {
		index: false,
		follow: false,
		nocache: true,
	},
};

