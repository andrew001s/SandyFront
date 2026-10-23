import { siteUrl } from '@/lib/seo';
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: '*',
				allow: '/',
				disallow: [
					'/home',
					'/conexiones',
					'/moderacion',
					'/avatar',
					'/settings',
					'/auth',
					'/account',
					'/sign-in',
					'/sign-up',
					'/api',
				],
			},
		],
		sitemap: `${siteUrl}/sitemap.xml`,
	};
}
