import { synthesizeEdgeSpeech } from '@/lib/server/edgeTts';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { text, voice, rate, pitch } = body;

		if (!text || typeof text !== 'string') {
			return new NextResponse('Texto no proporcionado', { status: 400 });
		}

		const audioBuffer = await synthesizeEdgeSpeech({
			text,
			voice: typeof voice === 'string' && voice.trim() ? voice.trim() : undefined,
			rate: typeof rate === 'string' && rate.trim() ? rate.trim() : undefined,
			pitch: typeof pitch === 'string' && pitch.trim() ? pitch.trim() : undefined,
		});

		return new NextResponse(audioBuffer, {
			status: 200,
			headers: {
				'Content-Type': 'audio/mpeg',
				'Content-Length': audioBuffer.length.toString(),
				'Cache-Control': 'no-store, max-age=0',
			},
		});
	} catch (error) {
		console.error('[API Edge TTS] Error en síntesis:', error);
		return new NextResponse(
			JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } },
		);
	}
}
