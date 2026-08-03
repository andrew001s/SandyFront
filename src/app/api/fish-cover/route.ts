import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
	const src = request.nextUrl.searchParams.get('src');

	if (!src) {
		return NextResponse.json({ error: 'Missing src' }, { status: 400 });
	}

	try {
		const response = await fetch(src, {
			headers: {
				Accept: 'image/*',
			},
		});

		if (!response.ok) {
			return NextResponse.json({ error: 'Image not found' }, { status: response.status });
		}

		const contentType = response.headers.get('content-type') ?? 'image/jpeg';
		const body = await response.arrayBuffer();

		return new NextResponse(body, {
			status: 200,
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
			},
		});
	} catch (error) {
		console.error('Error proxying Fish Audio cover image:', error);
		return NextResponse.json({ error: 'Failed to load image' }, { status: 502 });
	}
}
