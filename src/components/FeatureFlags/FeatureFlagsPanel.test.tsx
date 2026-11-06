import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FeatureFlagsPanel } from './FeatureFlagsPanel';

const settings = vi.hoisted(() => ({
	settings: {},
	isLoading: false,
	refreshSettings: vi.fn(),
}));
const saveSettings = vi.hoisted(() => vi.fn());
vi.mock('@/context/AppSettingsContext', () => ({ useAppSettings: () => settings }));
vi.mock('@clerk/nextjs', () => ({ useAuth: () => ({ getToken: vi.fn() }) }));
vi.mock('@/api/settings', () => ({ saveSettings }));

beforeEach(() => {
	settings.isLoading = false;
	vi.clearAllMocks();
});

describe('FeatureFlagsPanel closing', () => {
	it.each([false, true])('can close while settings loading is %s', (isLoading) => {
		settings.isLoading = isLoading;
		const onClose = vi.fn();
		render(<FeatureFlagsPanel onClose={onClose} />);
		fireEvent.click(screen.getByRole('button', { name: 'Cerrar módulos de emisión' }));
		expect(onClose).toHaveBeenCalledOnce();
		expect(saveSettings).not.toHaveBeenCalled();
	});

	it('omits the close control when embedded as a permanent section', () => {
		render(<FeatureFlagsPanel />);
		expect(screen.queryByRole('button', { name: 'Cerrar módulos de emisión' })).toBeNull();
	});
});
