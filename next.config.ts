import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	async rewrites() {
		return [
			{
				source: '/fish-api/:path*',
				destination: 'https://api.fish.audio/:path*',
			},
		];
	},
	images: {
		// Las miniaturas de terceros se sirven ya optimizadas y con el tamaño en
		// que se muestran; pasarlas por el optimizador gasta una transformación
		// por cada combinación de URL y ancho sin ganar nada. Donde no se puede
		// evitar, el caché largo impide volver a transformar lo mismo.
		minimumCacheTTL: 60 * 60 * 24 * 31,
		// Sin recortar, Next genera una variante por cada ancho de esta lista que
		// encaje con el `sizes` del componente: menos anchos, menos gasto.
		deviceSizes: [640, 828, 1200, 1920],
		imageSizes: [48, 96, 256],
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'openrouter.ai',
				pathname: '/images/**',
			},
			{
				protocol: 'https',
				hostname: 'api.fish.audio',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'fish.audio',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'public-platform.r2.fish.audio',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'yt3.ggpht.com',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'api.producthunt.com',
				pathname: '/**',
			},
		],
	},
};

export default nextConfig;
