import { live2dStore } from '@/lib/avatar2d/live2dStore';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Live2dExpressionsPanel } from './Live2dExpressionsPanel';

describe('Live2dExpressionsPanel', () => {
	beforeEach(() => {
		live2dStore.setPackage(null);
	});

	it('renders Live2D expressions panel with dedicated header and empty state when no model is loaded', () => {
		const onClose = vi.fn();
		const onOpenModelSelect = vi.fn();

		render(<Live2dExpressionsPanel onClose={onClose} onOpenModelSelect={onOpenModelSelect} />);

		// Header dedicated to Live2D
		expect(screen.getByText(/expresiones live2d/i)).toBeInTheDocument();

		// Empty state is displayed when no package is loaded
		expect(screen.getByText(/sin modelo live2d/i)).toBeInTheDocument();
		expect(screen.getByText(/carga un modelo/i)).toBeInTheDocument();

		// Quick action button to open model selector if provided
		const loadModelBtn = screen.getByRole('button', { name: /cargar modelo/i });
		expect(loadModelBtn).toBeInTheDocument();
		fireEvent.click(loadModelBtn);
		expect(onOpenModelSelect).toHaveBeenCalledTimes(1);

		// Close button works
		const closeBtn = screen.getByRole('button', { name: /cerrar|close/i });
		fireEvent.click(closeBtn);
		expect(onClose).toHaveBeenCalledTimes(1);

		// Does NOT contain PNGTuber specific options
		expect(screen.queryByText(/nueva expresión/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/probar boca abierta/i)).not.toBeInTheDocument();
	});
});
