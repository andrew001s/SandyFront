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

	it('renders speaking sprite when speaking, and handles blink during speech', () => {
		render(<PngTuberRenderer config={mockConfig} />);

		// 1. En reposo (sin hablar ni parpadear), muestra el sprite idle de la emoción activa
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
		expect(img.src).toContain('happy_closed_blink.png');

		// 4. Finaliza el parpadeo (160ms después)
		act(() => {
			vi.advanceTimersByTime(160);
		});
		// Sigue en la variante de habla
		expect(img.src).toContain('happy_speaking.png');
	});

	it('switches to speaking sprite on speech and blink sprite on blink when expression variants are omitted, and returns to expression on idle', () => {
		const customConfig: PngTuberConfig = {
			...mockConfig,
			activeEmotion: 'custom_cool',
			emotions: [
				{
					id: 'custom_cool',
					label: 'Cool',
					idle: 'https://example.com/custom_avatar_idle.png',
				},
			],
		};

		render(<PngTuberRenderer config={customConfig} />);
		const img = screen.getByAltText('Avatar 2D PNGTuber') as HTMLImageElement;
		// 1. En reposo muestra la imagen de la expresión personalizada
		expect(img.src).toContain('custom_avatar_idle.png');

		// 2. Al hablar abre la boca cambiando al sprite de habla
		act(() => {
			avatar2dManager.setSpeaking(true, false);
		});
		expect(img.src).toContain('speaking.png');

		// 3. Al detener el habla regresa a la imagen de la expresión personalizada
		act(() => {
			avatar2dManager.setSpeaking(false, false);
		});
		expect(img.src).toContain('custom_avatar_idle.png');

		// 4. Al ocurrir parpadeo cambia al sprite de parpadeo
		act(() => {
			vi.advanceTimersByTime(500);
		});
		expect(img.src).toContain('blink.png');

		// 5. Al terminar el parpadeo vuelve a la expresión personalizada
		act(() => {
			vi.advanceTimersByTime(160);
		});
		expect(img.src).toContain('custom_avatar_idle.png');
	});

	it('uses custom speaking and blinking sprites when provided for the expression', () => {
		const fullCustomConfig: PngTuberConfig = {
			...mockConfig,
			activeEmotion: 'custom_expressive',
			emotions: [
				{
					id: 'custom_expressive',
					label: 'Expresiva',
					idle: 'https://example.com/custom_idle.png',
					speaking: 'https://example.com/custom_speaking.png',
					blink: 'https://example.com/custom_blink.png',
				},
			],
		};

		render(<PngTuberRenderer config={fullCustomConfig} />);
		const img = screen.getByAltText('Avatar 2D PNGTuber') as HTMLImageElement;
		expect(img.src).toContain('custom_idle.png');

		// Al hablar usa la variante speaking de la expresión
		act(() => {
			avatar2dManager.setSpeaking(true, false);
		});
		expect(img.src).toContain('custom_speaking.png');

		act(() => {
			avatar2dManager.setSpeaking(false, false);
		});
		expect(img.src).toContain('custom_idle.png');

		// Al parpadear usa la variante blink de la expresión
		act(() => {
			vi.advanceTimersByTime(500);
		});
		expect(img.src).toContain('custom_blink.png');
	});

	it('switches visible sprite immediately when a new custom expression is created and activated in manager', () => {
		const created = avatar2dManager.addCustomEmotion(
			'Pensativo',
			'data:image/png;base64,custom_pensativo_idle',
		);
		avatar2dManager.setEmotion(created.id);

		const { rerender } = render(<PngTuberRenderer config={avatar2dManager.getState().pngtuber} />);
		const img = screen.getByAltText('Avatar 2D PNGTuber') as HTMLImageElement;
		expect(img.src).toContain('custom_pensativo_idle');

		// Switch back to neutral
		act(() => {
			avatar2dManager.setEmotion('neutral');
		});
		rerender(<PngTuberRenderer config={avatar2dManager.getState().pngtuber} />);
		expect(img.src).not.toContain('custom_pensativo_idle');
	});

	it('immediately updates visible avatar sprite when the active custom expression image is edited', () => {
		const created = avatar2dManager.addCustomEmotion(
			'Divertido Original',
			'data:image/png;base64,divertido_v1_idle',
		);
		avatar2dManager.setEmotion(created.id);

		const { rerender } = render(<PngTuberRenderer config={avatar2dManager.getState().pngtuber} />);
		const img = screen.getByAltText('Avatar 2D PNGTuber') as HTMLImageElement;
		expect(img.src).toContain('divertido_v1_idle');

		// Edit the custom emotion's idle sprite
		act(() => {
			avatar2dManager.updateCustomEmotion(created.id, {
				idle: 'data:image/png;base64,divertido_v2_updated_idle',
			});
		});

		rerender(<PngTuberRenderer config={avatar2dManager.getState().pngtuber} />);
		expect(img.src).toContain('divertido_v2_updated_idle');
		expect(img.src).not.toContain('divertido_v1_idle');
	});

	it('immediately switches visible avatar sprite to fallback emotion when the active expression is deleted', () => {
		const created = avatar2dManager.addCustomEmotion(
			'Temporal Visible',
			'data:image/png;base64,temporal_visible_idle',
		);
		avatar2dManager.setEmotion(created.id);

		const { rerender } = render(<PngTuberRenderer config={avatar2dManager.getState().pngtuber} />);
		const img = screen.getByAltText('Avatar 2D PNGTuber') as HTMLImageElement;
		expect(img.src).toContain('temporal_visible_idle');

		// Delete the active emotion
		act(() => {
			avatar2dManager.deleteEmotion(created.id);
		});

		rerender(<PngTuberRenderer config={avatar2dManager.getState().pngtuber} />);
		expect(img.src).not.toContain('temporal_visible_idle');
	});
});
