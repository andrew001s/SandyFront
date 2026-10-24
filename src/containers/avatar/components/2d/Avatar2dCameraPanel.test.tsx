import { avatar2dManager } from '@/lib/avatar2d/avatar2dManager';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Avatar2dCameraPanel } from './Avatar2dCameraPanel';

describe('Avatar2dCameraPanel', () => {
	beforeEach(() => {
		avatar2dManager.setTransform({ x: 0, y: 0, scale: 1, rotation: 0 }, 'live2d', false);
		avatar2dManager.setTransform({ x: 0, y: 0, scale: 1, rotation: 0 }, 'pngtuber', false);
	});

	it('renders header, preset buttons (Completo, Busto, Rostro), zoom controls, and instructions', () => {
		render(<Avatar2dCameraPanel mode='live2d' onClose={vi.fn()} containerHeight={600} />);

		expect(screen.getByText('Cámara y Encuadre 2D')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /completo/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /busto/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /rostro/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /acercar/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /alejar/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /restablecer/i })).toBeInTheDocument();
	});

	it('applies full body (Completo) framing with scale 1 and x=0, y=0', () => {
		const setTransformSpy = vi.spyOn(avatar2dManager, 'setTransform');
		render(<Avatar2dCameraPanel mode='live2d' onClose={vi.fn()} containerHeight={600} />);

		fireEvent.click(screen.getByRole('button', { name: /completo/i }));

		expect(setTransformSpy).toHaveBeenCalledWith({ x: 0, y: 0, scale: 1, rotation: 0 }, 'live2d');
	});

	it('applies bust framing for Live2D with accurate scale and vertical offset preserving head headroom', () => {
		const setTransformSpy = vi.spyOn(avatar2dManager, 'setTransform');
		render(<Avatar2dCameraPanel mode='live2d' onClose={vi.fn()} containerHeight={600} />);

		fireEvent.click(screen.getByRole('button', { name: /busto/i }));

		expect(setTransformSpy).toHaveBeenCalledWith(
			{ x: 0, y: 180, scale: 1.6, rotation: 0 },
			'live2d',
		);
	});

	it('applies facial closeup (Rostro) framing for Live2D with eye-level positioning', () => {
		const setTransformSpy = vi.spyOn(avatar2dManager, 'setTransform');
		render(<Avatar2dCameraPanel mode='live2d' onClose={vi.fn()} containerHeight={600} />);

		fireEvent.click(screen.getByRole('button', { name: /rostro/i }));

		expect(setTransformSpy).toHaveBeenCalledWith(
			{ x: 0, y: 360, scale: 2.3, rotation: 0 },
			'live2d',
		);
	});

	it('applies bust and face framing for PNGTuber appropriately', () => {
		const setTransformSpy = vi.spyOn(avatar2dManager, 'setTransform');
		render(<Avatar2dCameraPanel mode='pngtuber' onClose={vi.fn()} containerHeight={600} />);

		fireEvent.click(screen.getByRole('button', { name: /busto/i }));
		expect(setTransformSpy).toHaveBeenCalledWith(
			{ x: 0, y: 96, scale: 1.4, rotation: 0 },
			'pngtuber',
		);

		fireEvent.click(screen.getByRole('button', { name: /rostro/i }));
		expect(setTransformSpy).toHaveBeenCalledWith(
			{ x: 0, y: 192, scale: 1.9, rotation: 0 },
			'pngtuber',
		);
	});

	it('allows stepping zoom up and down with +/- buttons and resetting', () => {
		const setTransformSpy = vi.spyOn(avatar2dManager, 'setTransform');
		render(<Avatar2dCameraPanel mode='live2d' onClose={vi.fn()} containerHeight={600} />);

		// Zoom in
		fireEvent.click(screen.getByRole('button', { name: /acercar/i }));
		expect(setTransformSpy).toHaveBeenCalledWith(
			expect.objectContaining({ scale: 1.15 }),
			'live2d',
		);

		// Zoom out
		fireEvent.click(screen.getByRole('button', { name: /alejar/i }));
		expect(setTransformSpy).toHaveBeenCalledWith(expect.objectContaining({ scale: 1 }), 'live2d');

		// Reset
		fireEvent.click(screen.getByRole('button', { name: /restablecer/i }));
		expect(setTransformSpy).toHaveBeenCalledWith({ x: 0, y: 0, scale: 1, rotation: 0 }, 'live2d');
	});

	it('calls onClose when close button is clicked', () => {
		const onClose = vi.fn();
		render(<Avatar2dCameraPanel mode='live2d' onClose={onClose} containerHeight={600} />);

		fireEvent.click(screen.getByRole('button', { name: /cerrar panel/i }));
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
