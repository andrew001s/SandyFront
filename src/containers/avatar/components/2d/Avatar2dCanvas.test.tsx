import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Avatar2dCanvas } from './Avatar2dCanvas';

beforeEach(() => {
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe = vi.fn();
			unobserve = vi.fn();
			disconnect = vi.fn();
		},
	);
});
afterEach(() => vi.unstubAllGlobals());

vi.mock('@/hooks/useMediaQuery', () => ({ useMediaQuery: () => false }));
vi.mock('@clerk/nextjs', () => ({ useAuth: () => ({ getToken: vi.fn() }) }));

vi.mock('@/context/AppSettingsContext', () => ({
	useAppSettings: () => ({ settings: {}, isLoading: false, refreshSettings: vi.fn() }),
}));

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
	it('unmounts the local renderer in external mode and keeps service and microphone controls', () => {
		const { rerender } = render(<Avatar2dCanvas mode='live2d' />);
		expect(screen.getByTestId('live2d-renderer')).toBeInTheDocument();
		rerender(<Avatar2dCanvas mode='live2d' externalContent={<div>Conexión externa</div>} />);
		expect(screen.queryByTestId('live2d-renderer')).not.toBeInTheDocument();
		expect(screen.getByText('Conexión externa')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Servicio de emisión' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Hablar con la VTuber' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Avatar' })).not.toBeInTheDocument();
		rerender(<Avatar2dCanvas mode='live2d' />);
		expect(screen.getByTestId('live2d-renderer')).toBeInTheDocument();
	});
	it.each(['live2d', 'pngtuber'] as const)('closes the modules panel in %s mode', async (mode) => {
		render(<Avatar2dCanvas mode={mode} />);
		fireEvent.keyDown(screen.getByRole('button', { name: 'Opciones avanzadas' }), {
			key: 'ArrowDown',
		});
		fireEvent.click(screen.getByRole('menuitem', { name: 'Funciones del dashboard' }));
		fireEvent.click(screen.getByRole('button', { name: 'Cerrar módulos de emisión' }));
		await waitFor(() => expect(screen.queryByText('Módulos de Emisión')).not.toBeInTheDocument());
	});

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
