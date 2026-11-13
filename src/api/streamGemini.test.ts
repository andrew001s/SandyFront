import { beforeEach, describe, expect, it, vi } from 'vitest';
import { streamResponseGemini } from './streamGemini';

const frameStream = (frames: string[]) =>
	new ReadableStream<Uint8Array>({
		start(controller) {
			const encoder = new TextEncoder();
			for (const frame of frames) controller.enqueue(encoder.encode(frame));
			controller.close();
		},
	});

describe('streamResponseGemini reaction metadata', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
	});

	it('forwards the done event reaction and emotion without adding them to streamed text', async () => {
		vi.mocked(fetch).mockResolvedValue(
			new Response(
				frameStream([
					'event: delta\ndata: {"text":"Hola."}\n\n',
					'event: done\ndata: {"message":"Hola.","reaction":true,"emotion":"surprised"}\n\n',
				]),
				{ status: 200 },
			),
		);
		const onReaction = vi.fn();
		const text: string[] = [];

		for await (const delta of streamResponseGemini('hola', undefined, onReaction)) {
			text.push(delta);
		}

		expect(text).toEqual(['Hola.']);
		expect(onReaction).toHaveBeenCalledWith({ reaction: true, emotion: 'surprised' });
	});
});
