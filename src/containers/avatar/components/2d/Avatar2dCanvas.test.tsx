import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Avatar2dCanvas } from './Avatar2dCanvas';

vi.mock('@/hooks/useMediaQuery', () => ({ useMediaQuery: () => false }));

vi.mock('@/containers/avatar/components/2d/Live2dRenderer', () => ({
	Live2dRenderer: () => <div data-testid='live2d-renderer' />,
}));

vi.mock('@/containers/avatar/components/2d/PngTuberRenderer', () => ({
	PngTuberRenderer: () => <div data-testid='pngtuber-renderer' />,
}));

vi.mock('@/hooks/useServiceStatus', () => ({
	useServiceStatus: () => ({ serviceStatus: null, hasLoaded: true, hasError: false }),
}));

describe('Avatar2dCanvas expressions routing', () => {
	it('routes expressions tool to Live2dExpressionsPanel when in live2d mode', () => {
		render(<Avatar2dCanvas mode='live2d' />);

		fireEvent.keyDown(screen.getByRole('button', { name: 'Avatar' }), { key: 'ArrowDown' });
		fireEvent.click(screen.getByRole('menuitem', { name: /expresiones manuales/i }));

		// Live2D dedicated panel header must be visible
		expect(screen.getByText(/expresiones live2d/i)).toBeInTheDocument();

		// PNGTuber panel elements must NOT be visible
		expect(screen.queryByText(/expresiones y gestos 2d/i)).not.toBeInTheDocument();
	});

	it('routes expressions tool to Avatar2dExpressionsPanel when in pngtuber mode', () => {
		render(<Avatar2dCanvas mode='pngtuber' />);

		fireEvent.keyDown(screen.getByRole('button', { name: 'Avatar' }), { key: 'ArrowDown' });
		fireEvent.click(screen.getByRole('menuitem', { name: /expresiones manuales/i }));

		// PNGTuber panel header must be visible
		expect(screen.getByText(/expresiones y gestos 2d/i)).toBeInTheDocument();

		// Live2D panel elements must NOT be visible
		expect(screen.queryByText(/expresiones live2d/i)).not.toBeInTheDocument();
	});
});
