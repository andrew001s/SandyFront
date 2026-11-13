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
	const tab = { opener: {}, closed: false, location: { replace: vi.fn() }, close: vi.fn() };
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.purchase.ownerId = 'account-a';
		mocks.purchase.status = { available: true, watermark_free: false, state: 'free' };
		mocks.purchase.checkout.mockResolvedValue({
			checkout_url: 'https://ko-fi.com/s/product001',
			checkout_email: 'verified@example.com',
		});
		vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);
		mocks.purchase.redeem.mockResolvedValue(undefined);
	});
	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
	});
	const open = () => fireEvent.click(screen.getByRole('button', { name: /Apoyar Sandy Studio/ }));

	it('presents Plus and voluntary support as separate choices', () => {
		render(<SupportPurchaseButton />);
		open();
		expect(screen.getByRole('button', { name: /Obtener Sandy Plus/ })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Apoyar voluntariamente/ })).toHaveAttribute(
			'href',
			'https://ko-fi.com/shandrew',
		);
	});

	it('keeps voluntary support available when checkout has not been enabled', () => {
		mocks.purchase.status.available = false;
		render(<SupportPurchaseButton />);
		open();
		expect(screen.getByRole('button', { name: /Obtener Sandy Plus/ })).toBeDisabled();
		expect(screen.getByRole('link', { name: /Apoyar voluntariamente/ })).toBeInTheDocument();
	});

	it('opens the focused code view without starting checkout', () => {
		render(<SupportPurchaseButton />);
		open();
		fireEvent.click(screen.getByRole('button', { name: 'Ya tengo un código' }));
		expect(screen.getByRole('heading', { name: 'Canjear código' })).toBeInTheDocument();
		expect(screen.getByLabelText('Código de Sandy Studio Plus')).toBeInTheDocument();
		expect(mocks.purchase.checkout).not.toHaveBeenCalled();
	});

	it('can redeem an entered test code without starting a purchase', async () => {
		render(<SupportPurchaseButton />);
		open();
		fireEvent.click(screen.getByRole('button', { name: 'Ya tengo un código' }));
		fireEvent.change(screen.getByLabelText('Código de Sandy Studio Plus'), {
			target: { value: 'SANDY-TEST-CODE-ONLY-1234' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Activar Sandy Plus' }));
		await waitFor(() =>
			expect(mocks.purchase.redeem).toHaveBeenCalledWith('SANDY-TEST-CODE-ONLY-1234'),
		);
		expect(mocks.purchase.checkout).not.toHaveBeenCalled();
	});

	it('starts checkout from the primary button and opens the returned product in a safe new tab', async () => {
		render(<SupportPurchaseButton />);
		open();
		fireEvent.click(screen.getByRole('button', { name: /Obtener Sandy Plus/ }));
		expect(window.open).toHaveBeenCalledWith('about:blank', '_blank');
		expect(tab.opener).toBeNull();
		await waitFor(() =>
			expect(screen.getByRole('link', { name: /Continuar en Ko-fi/ })).toHaveAttribute(
				'href',
				'https://ko-fi.com/s/product001',
			),
		);
		expect(mocks.purchase.checkout).toHaveBeenCalledTimes(1);
		expect(tab.location.replace).toHaveBeenCalledWith('https://ko-fi.com/s/product001');
		expect(screen.getByLabelText('Código de Sandy Studio Plus')).toHaveFocus();
	});

	it('keeps the primary label stable for pending purchases without the old warning', () => {
		mocks.purchase.status = { available: true, watermark_free: false, state: 'pending' };
		render(<SupportPurchaseButton />);
		open();
		expect(screen.queryByText(/Esperando la confirmación de Ko-fi/i)).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Obtener Sandy Plus/ })).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Ya tengo un código' }));
		expect(mocks.purchase.checkout).not.toHaveBeenCalled();
	});

	it('announces activation from the account status and respects a later revocation', async () => {
		mocks.purchase.redeem.mockImplementation(async () => {
			mocks.purchase.status = { available: true, watermark_free: true, state: 'active' };
		});
		const { rerender } = render(<SupportPurchaseButton />);
		open();
		fireEvent.click(screen.getByRole('button', { name: 'Ya tengo un código' }));
		fireEvent.change(screen.getByLabelText('Código de Sandy Studio Plus'), {
			target: { value: 'SANDY-TEST-CODE-ONLY-1234' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Activar Sandy Plus' }));
		await waitFor(() =>
			expect(screen.getByRole('status')).toHaveTextContent('Sandy Plus activado'),
		);
		mocks.purchase.status = { available: true, watermark_free: false, state: 'revoked' };
		rerender(<SupportPurchaseButton />);
		expect(screen.queryByRole('status')).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Obtener Sandy Plus/ })).toBeEnabled();
	});

	it('offers the product link if popups are blocked', async () => {
		vi.mocked(window.open).mockReturnValue(null);
		render(<SupportPurchaseButton />);
		open();
		fireEvent.click(screen.getByRole('button', { name: /Obtener Sandy Plus/ }));
		await waitFor(() =>
			expect(screen.getByRole('link', { name: /Continuar en Ko-fi/ })).toHaveAttribute(
				'href',
				'https://ko-fi.com/s/product001',
			),
		);
	});

	it('shows checkout failures in the main view and closes the reserved tab', async () => {
		mocks.purchase.checkout.mockRejectedValue(
			new Error('No se pudo abrir Ko-fi. Inténtalo de nuevo.'),
		);
		render(<SupportPurchaseButton />);
		open();
		fireEvent.click(screen.getByRole('button', { name: /Obtener Sandy Plus/ }));
		await waitFor(() =>
			expect(screen.getByRole('alert')).toHaveTextContent('No se pudo abrir Ko-fi'),
		);
		expect(tab.close).toHaveBeenCalled();
		expect(screen.getByRole('button', { name: /Obtener Sandy Plus/ })).toBeEnabled();
	});

	it('connects redemption errors to the input and restores keyboard focus when going back', async () => {
		mocks.purchase.redeem.mockRejectedValue({
			isAxiosError: true,
			response: { data: { detail: 'El código no existe o ya fue utilizado.' } },
		});
		render(<SupportPurchaseButton />);
		open();
		fireEvent.click(screen.getByRole('button', { name: 'Ya tengo un código' }));
		fireEvent.change(screen.getByLabelText('Código de Sandy Studio Plus'), {
			target: { value: 'sandy-test-code-only-1234' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Activar Sandy Plus' }));
		await waitFor(() =>
			expect(screen.getByRole('alert')).toHaveTextContent(
				'El código no existe o ya fue utilizado.',
			),
		);
		expect(screen.getByLabelText('Código de Sandy Studio Plus')).toHaveAttribute(
			'aria-invalid',
			'true',
		);
		expect(screen.getByLabelText('Código de Sandy Studio Plus')).toHaveValue(
			'SANDY-TEST-CODE-ONLY-1234',
		);
		fireEvent.click(screen.getByRole('button', { name: 'Volver' }));
		expect(screen.getByRole('button', { name: /Obtener Sandy Plus/ })).toHaveFocus();
	});

	it('discards checkout navigation if the modal is closed while waiting', async () => {
		let finish!: (value: unknown) => void;
		mocks.purchase.checkout.mockImplementation(
			() =>
				new Promise((resolve) => {
					finish = resolve;
				}),
		);
		render(<SupportPurchaseButton />);
		open();
		fireEvent.click(screen.getByRole('button', { name: /Obtener Sandy Plus/ }));
		fireEvent.click(screen.getByRole('button', { name: 'Close' }));
		finish({ checkout_url: 'https://ko-fi.com/s/product001' });
		await waitFor(() => expect(tab.close).toHaveBeenCalled());
		expect(tab.location.replace).not.toHaveBeenCalled();
	});
});
