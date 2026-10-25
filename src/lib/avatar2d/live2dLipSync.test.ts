import { createWavBlob } from '@/lib/avatar/testAudioGenerator';
import { describe, expect, it, vi } from 'vitest';
import { computeLive2dMouthFrames, createLive2dLipSyncHandler } from './live2dLipSync';

describe('live2dLipSync', () => {
	it('calculates vertical mouth open and horizontal mouth form based on speech energy and vowel profile', () => {
		const sampleRate = 16000;
		const fps = 10; // 100ms per frame
		const frameSamples = sampleRate / fps; // 1600 samples per frame

		// Frame 0: Silencio
		// Frame 1: Sonido anterior/ensanchado (I/E: 2200 Hz, amplitud 0.3)
		// Frame 2: Sonido posterior/redondeado (O/U: 400 Hz, amplitud 0.3)
		const totalFrames = 3;
		const samples = new Float32Array(totalFrames * frameSamples);

		// Frame 0: Silencio (ya en 0)

		// Frame 1: 2200 Hz (vocal anterior ensanchada I/E)
		for (let i = 0; i < frameSamples; i++) {
			const idx = frameSamples + i;
			samples[idx] = 0.3 * Math.sin(2 * Math.PI * 2200 * (i / sampleRate));
		}

		// Frame 2: 400 Hz (vocal posterior redondeada O/U)
		for (let i = 0; i < frameSamples; i++) {
			const idx = 2 * frameSamples + i;
			samples[idx] = 0.3 * Math.sin(2 * Math.PI * 400 * (i / sampleRate));
		}

		const frames = computeLive2dMouthFrames(samples, sampleRate, fps);

		expect(frames).toHaveLength(3);

		// Frame 0 (silencio): boca cerrada y neutral
		expect(frames[0].mouthOpenY).toBe(0);
		expect(frames[0].mouthForm).toBe(0);

		// Frame 1 (I/E): boca abierta y ensanchada (mouthForm > 0)
		expect(frames[1].mouthOpenY).toBeGreaterThan(0.2);
		expect(frames[1].mouthForm).toBeGreaterThan(0.1);

		// Frame 2 (O/U): boca abierta y redondeada/estrecha (mouthForm < 0)
		expect(frames[2].mouthOpenY).toBeGreaterThan(0.2);
		expect(frames[2].mouthForm).toBeLessThan(-0.1);
	});

	it('resets mouthOpenY and mouthForm cleanly to 0 on stop or when audio playback finishes', async () => {
		const onMouthFrame = vi.fn();
		const handler = createLive2dLipSyncHandler(onMouthFrame, {
			fps: 10,
			threshold: 0.02,
		});

		// 300ms de audio activo
		const sampleRate = 16000;
		const samples = new Float32Array(4800);
		for (let i = 0; i < 4800; i++) {
			samples[i] = 0.3 * Math.sin(2 * Math.PI * 2200 * (i / sampleRate));
		}
		const audioBlob = createWavBlob(samples, sampleRate);

		// 1. Iniciar reproducción
		let fakeClockTime = 0.05; // 50ms
		await handler.start(audioBlob, () => fakeClockTime);

		expect(onMouthFrame).toHaveBeenCalledWith(
			expect.objectContaining({
				mouthOpenY: expect.any(Number),
				mouthForm: expect.any(Number),
			}),
		);
		const initialCall = onMouthFrame.mock.calls[0][0];
		expect(initialCall.mouthOpenY).toBeGreaterThan(0.2);

		// 2. Parada manual (stop)
		handler.stop();
		expect(onMouthFrame).toHaveBeenLastCalledWith({ mouthOpenY: 0, mouthForm: 0 });

		// 3. Finalización natural cuando el reloj excede la duración
		onMouthFrame.mockClear();
		fakeClockTime = 0.05;
		await handler.start(audioBlob, () => fakeClockTime);
		expect(onMouthFrame).toHaveBeenCalled();

		fakeClockTime = 0.5; // 500ms > 300ms
		handler.tick?.();
		expect(onMouthFrame).toHaveBeenLastCalledWith({ mouthOpenY: 0, mouthForm: 0 });
	});
});
