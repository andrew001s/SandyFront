import { siteUrl } from '@/lib/seo';
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
	const now = new Date();

	return [
		{
			url: siteUrl,
			lastModified: now,
			changeFrequency: 'weekly',
			priority: 1,
		},
		{
			url: `${siteUrl}/privacy-policy`,
			lastModified: now,
			changeFrequency: 'monthly',
			priority: 0.5,
		},
		{
			url: `${siteUrl}/terms-of-service`,
			lastModified: now,
			changeFrequency: 'monthly',
			priority: 0.5,
		},
	];
}
