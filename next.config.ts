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
		remotePatterns: [
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
		],
	},
};

export default nextConfig;
