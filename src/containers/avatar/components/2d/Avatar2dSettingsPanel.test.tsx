import { avatar2dManager } from '@/lib/avatar2d/avatar2dManager';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Avatar2dSettingsPanel } from './Avatar2dSettingsPanel';

describe('Avatar2dSettingsPanel', () => {
	beforeEach(() => {
		avatar2dManager.setMode('live2d');
	});

	it('renders active live2d controls without inactive lip sync switch', () => {
		render(<Avatar2dSettingsPanel mode='live2d' onClose={vi.fn()} />);

		// 1. Debe incluir el control activo de seguimiento con el cursor
		expect(screen.getByText('Seguimiento con el cursor')).toBeInTheDocument();
		expect(screen.getByRole('switch')).toBeInTheDocument();

		// 2. NO debe existir la opción redundante e inactiva de reactividad de voz
		expect(screen.queryByText(/reactividad de voz/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/lip sync/i)).not.toBeInTheDocument();
	});
});
