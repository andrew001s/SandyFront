import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SupportPurchaseButton } from './SupportPurchaseButton';

const mocks = vi.hoisted(() => ({
	purchase: {
		ownerId: 'account-a',
		loading: false,
		error: null,
		status: { available: true, watermark_free: false, state: 'free' },
		checkout: vi.fn(),
		redeem: vi.fn(),
		refresh: vi.fn(),
		rotateOverlayKey: vi.fn(),
	},
}));
vi.mock('@/context/SupportPurchaseContext', () => ({ useSupportPurchase: () => mocks.purchase }));

describe('support purchase dialog', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.purchase.ownerId = 'account-a';
		mocks.purchase.status = { available: true, watermark_free: false, state: 'free' };
		mocks.purchase.checkout.mockResolvedValue({
			checkout_url: 'https://ko-fi.com/s/product001',
			checkout_email: 'verified@example.com',
		});
	});
	afterEach(cleanup);
	const open = () => fireEvent.click(screen.getByRole('button', { name: /Apoyar Sandy Studio/ }));

	it('shows the fixed price and code input before leaving for payment', async () => {
		render(<SupportPurchaseButton />);
		open();
		fireEvent.click(screen.getByRole('button', { name: 'Preparar compra de US$3' }));
		await waitFor(() =>
			expect(screen.getByRole('link', { name: /Pagar US\$3 en Ko-fi/ })).toBeInTheDocument(),
		);
		expect(screen.getByRole('link', { name: /Pagar US\$3/ })).toHaveAttribute(
			'href',
			'https://ko-fi.com/s/product001',
		);
		expect(screen.getByLabelText('Código de Sandy Studio Plus')).toBeInTheDocument();
		expect(screen.queryByText('Beneficio sin marca activo')).not.toBeInTheDocument();
	});

	it('keeps voluntary support available when checkout has not been enabled', () => {
		mocks.purchase.status.available = false;
		render(<SupportPurchaseButton />);
		open();
		expect(
			screen.queryByRole('button', { name: 'Preparar compra de US$3' }),
		).not.toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Aportar voluntariamente/ })).toBeInTheDocument();
	});

	it('shows no receipt recovery form', async () => {
		render(<SupportPurchaseButton />);
		open();
		fireEvent.click(screen.getByRole('button', { name: 'Preparar compra de US$3' }));
		await waitFor(() =>
			expect(screen.queryByText(/Identificador de transacción/i)).not.toBeInTheDocument(),
		);
	});

	it('explains that the purchase is confirmed automatically by Ko-fi', async () => {
		mocks.purchase.status = { available: true, watermark_free: false, state: 'pending' };
		render(<SupportPurchaseButton />);
		open();
		expect(screen.getByText(/Esperando la confirmación de Ko-fi/i)).toBeInTheDocument();
	});
});
