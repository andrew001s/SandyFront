import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_HOSTS = new Set(['api.fish.audio', 'fish.audio', 'public-platform.r2.fish.audio']);
const ALLOWED_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function isAllowedImageUrl(src: string) {
	try {
		const url = new URL(src);
		return url.protocol === 'https:' && ALLOWED_HOSTS.has(url.hostname);
	} catch {
		return false;
	}
}

export async function GET(request: NextRequest) {
	const src = request.nextUrl.searchParams.get('src');

	if (!src) {
		return NextResponse.json({ error: 'Missing src' }, { status: 400 });
	}

	if (!isAllowedImageUrl(src)) {
		return NextResponse.json({ error: 'Unsupported image source' }, { status: 400 });
	}

	try {
		const response = await fetch(src, {
			redirect: 'error',
			headers: {
				Accept: 'image/*',
			},
		});

		if (!response.ok) {
			return NextResponse.json({ error: 'Image not found' }, { status: response.status });
		}

		const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
		if (!contentType || !ALLOWED_CONTENT_TYPES.has(contentType)) {
			return NextResponse.json({ error: 'Unsupported image type' }, { status: 415 });
		}

		const contentLength = Number(response.headers.get('content-length') ?? '0');
		if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
			return NextResponse.json({ error: 'Image too large' }, { status: 413 });
		}

		const body = await response.arrayBuffer();
		if (body.byteLength > MAX_IMAGE_BYTES) {
			return NextResponse.json({ error: 'Image too large' }, { status: 413 });
		}

		return new NextResponse(body, {
			status: 200,
			headers: {
				'Content-Type': contentType,
				'X-Content-Type-Options': 'nosniff',
				'Content-Security-Policy': "default-src 'none'; img-src 'self' data:; sandbox",
				'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
			},
		});
	} catch (error) {
		console.error('Error proxying Fish Audio cover image:', error);
		return NextResponse.json({ error: 'Failed to load image' }, { status: 502 });
	}
}
