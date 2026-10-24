import { avatar2dManager } from '@/lib/avatar2d/avatar2dManager';
import type { PngTuberConfig } from '@/lib/avatar2d/types';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PngTuberRenderer } from './PngTuberRenderer';

describe('PngTuberRenderer', () => {
	const mockConfig: PngTuberConfig = {
		sprites: {
			idle: 'https://example.com/idle.png',
			speaking: 'https://example.com/speaking.png',
			blink: 'https://example.com/blink.png',
			speakingBlink: 'https://example.com/speakingBlink.png',
		},
		activeEmotion: 'happy',
		emotions: [
			{
				id: 'happy',
				label: 'Feliz',
				idle: 'https://example.com/happy_idle.png',
				speaking: 'https://example.com/happy_speaking.png',
				blink: 'https://example.com/happy_closed_blink.png',
			},
		],
		physics: {
			bounceAmount: 14,
			bounceSpeed: 180,
			breathing: false,
			blinkInterval: 500,
		},
		transform: { x: 0, y: 0, scale: 1, rotation: 0 },
	};

	beforeEach(() => {
		vi.useFakeTimers();
		avatar2dManager.setSpeaking(false, false);
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	it('renders speakingBlink sprite when speaking and blinking coincide, and returns to speaking sprite when blink ends', () => {
		render(<PngTuberRenderer config={mockConfig} />);

		// 1. En reposo (sin hablar ni parpadear), muestra el sprite idle
		const img = screen.getByAltText('Avatar 2D PNGTuber') as HTMLImageElement;
		expect(img.src).toContain('happy_idle.png');

		// 2. Comienza a hablar (isSpeaking = true)
		act(() => {
			avatar2dManager.setSpeaking(true, false);
		});
		expect(img.src).toContain('happy_speaking.png');

		// 3. Ocurre parpadeo mientras habla (coinciden habla y parpadeo)
		act(() => {
			vi.advanceTimersByTime(500); // Activa blinkInterval
		});
		// Debe mostrar speakingBlink (boca abierta con ojos cerrados)
		expect(img.src).toContain('speakingBlink.png');

		// 4. Finaliza el parpadeo (160ms después)
		act(() => {
			vi.advanceTimersByTime(160);
		});
		// Vuelve a la variante de habla normal
		expect(img.src).toContain('happy_speaking.png');
	});
});
