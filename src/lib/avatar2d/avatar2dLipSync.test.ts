import { createWavBlob } from '@/lib/avatar/testAudioGenerator';
import { describe, expect, it, vi } from 'vitest';
import { computeSpeakingFrames, createAvatar2dLipSyncHandler } from './avatar2dLipSync';

describe('avatar2dLipSync', () => {
	it('modulates speaking state to true when audio energy exceeds threshold, and false during pauses', () => {
		const sampleRate = 1000;
		const fps = 10; // 100ms per frame
		const frameSamples = sampleRate / fps; // 100 samples per frame

		// Crear señal:
		// Frame 0-1 (200ms): sonido activo (amplitud 0.25)
		// Frame 2-3 (200ms): pausa de silencio (amplitud 0.0)
		// Frame 4-5 (200ms): sonido activo (amplitud 0.25)
		const totalFrames = 6;
		const samples = new Float32Array(totalFrames * frameSamples);

		// Frame 0 y 1 con energía
		for (let i = 0; i < 2 * frameSamples; i++) {
			samples[i] = 0.25 * Math.sin(i * 0.1);
		}
		// Frame 2 y 3 silencio (ya están en 0)
		// Frame 4 y 5 con energía
		for (let i = 4 * frameSamples; i < 6 * frameSamples; i++) {
			samples[i] = 0.25 * Math.sin(i * 0.1);
		}

		const frames = computeSpeakingFrames(samples, sampleRate, fps, 0.02);

		expect(frames).toHaveLength(6);
		// Con energía -> boca abierta (true)
		expect(frames[0]).toBe(true);
		expect(frames[1]).toBe(true);
		// En silencio -> boca cerrada (false)
		expect(frames[2]).toBe(false);
		expect(frames[3]).toBe(false);
		// Con energía -> boca abierta (true)
		expect(frames[4]).toBe(true);
		expect(frames[5]).toBe(true);
	});

	it('returns immediately to idle closed-mouth state when audio playback finishes or stops', async () => {
		const onSpeakingChange = vi.fn();
		const handler = createAvatar2dLipSyncHandler(onSpeakingChange, {
			fps: 10,
			threshold: 0.02,
		});

		// 300ms de audio con energía
		const sampleRate = 1000;
		const samples = new Float32Array(300);
		for (let i = 0; i < 300; i++) {
			samples[i] = 0.25 * Math.sin(i * 0.1);
		}
		const audioBlob = createWavBlob(samples, sampleRate);

		// 1. Probar parada manual anticipada con stop()
		let fakeClockTime = 0.05; // 50ms (dentro del audio)
		await handler.start(audioBlob, () => fakeClockTime);

		expect(onSpeakingChange).toHaveBeenCalledWith(true);

		// Detener manualmente
		handler.stop();
		expect(onSpeakingChange).toHaveBeenLastCalledWith(false);

		// 2. Probar finalización natural cuando el reloj supera la duración
		onSpeakingChange.mockClear();
		fakeClockTime = 0.05;
		await handler.start(audioBlob, () => fakeClockTime);
		expect(onSpeakingChange).toHaveBeenCalledWith(true);

		// Simular avance del reloj más allá del final del audio (400ms > 300ms)
		fakeClockTime = 0.4;
		handler.tick?.();
		expect(onSpeakingChange).toHaveBeenLastCalledWith(false);
	});
});
