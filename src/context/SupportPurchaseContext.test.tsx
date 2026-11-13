import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	SupportPurchaseProvider,
	useSupportPurchase,
	useWatermarkFree,
} from './SupportPurchaseContext';

const mocks = vi.hoisted(() => ({
	auth: {
		isLoaded: true,
		isSignedIn: true,
		userId: 'user-a',
		getToken: vi.fn(async () => 'session-a'),
	},
	status: vi.fn(),
	checkout: vi.fn(),
	key: vi.fn(),
}));
vi.mock('@clerk/nextjs', () => ({ useAuth: () => mocks.auth }));
vi.mock('@/api/support', () => ({
	getSupportStatus: mocks.status,
	startSupportCheckout: mocks.checkout,
	createSupportOverlayKey: mocks.key,
}));
const free = {
	available: true,
	amount_cents: 300,
	currency: 'USD',
	watermark_free: false,
	state: 'free',
};
const paid = { ...free, watermark_free: true, state: 'active' };
let purchase: NonNullable<ReturnType<typeof useSupportPurchase>>;
function Consumer() {
	const current = useSupportPurchase();
	if (!current) throw new Error('Missing purchase provider');
	purchase = current;
	return <output>{useWatermarkFree() ? 'paid' : 'free'}</output>;
}
const mount = () =>
	render(
		<SupportPurchaseProvider>
			<Consumer />
		</SupportPurchaseProvider>,
	);

describe('account purchase synchronization', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		sessionStorage.clear();
		mocks.auth.isSignedIn = true;
		mocks.auth.userId = 'user-a';
		mocks.status.mockResolvedValue(free);
		mocks.key.mockResolvedValue('readonly-key');
	});
	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	it('derives access from the server and removes it immediately on logout', async () => {
		mocks.status.mockResolvedValue(paid);
		const view = mount();
		await waitFor(() => expect(screen.getByText('paid')).toBeInTheDocument());
		mocks.auth.isSignedIn = false;
		view.rerender(
			<SupportPurchaseProvider>
				<Consumer />
			</SupportPurchaseProvider>,
		);
		expect(screen.getByText('free')).toBeInTheDocument();
	});

	it('ignores a previous account response arriving after an account switch', async () => {
		let finish!: (value: typeof paid) => void;
		mocks.status
			.mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						finish = resolve;
					}),
			)
			.mockResolvedValue(free);
		const view = mount();
		await waitFor(() => expect(mocks.status).toHaveBeenCalledOnce());
		mocks.auth.userId = 'user-b';
		view.rerender(
			<SupportPurchaseProvider>
				<Consumer />
			</SupportPurchaseProvider>,
		);
		await waitFor(() => expect(mocks.status).toHaveBeenCalledTimes(2));
		await act(async () => finish(paid));
		expect(screen.getByText('free')).toBeInTheDocument();
	});

	it('keeps the last verified permission during a temporary connection error', async () => {
		mocks.status.mockResolvedValueOnce(paid).mockRejectedValue(new Error('offline'));
		mount();
		await waitFor(() => expect(screen.getByText('paid')).toBeInTheDocument());
		await act(async () => {
			await purchase.refresh();
		});
		expect(screen.getByText('paid')).toBeInTheDocument();
		expect(purchase.error).toContain('conexión');
	});

	it('creates a limited OBS link before payment so it updates after purchase', async () => {
		mount();
		await waitFor(() => expect(purchase.status?.state).toBe('free'));
		const url = new URL(await purchase.createOverlayUrl('/overlay/avatar2d'));
		expect(url.pathname).toBe('/overlay/avatar2d');
		expect(url.hash).toBe('#support=readonly-key');
		expect(url.href).not.toContain('session-a');
		expect(mocks.key).toHaveBeenCalledWith('session-a');
	});

	it('polls a pending purchase and then observes a refund', async () => {
		vi.useFakeTimers();
		mocks.status
			.mockResolvedValueOnce({ ...free, state: 'pending' })
			.mockResolvedValueOnce(paid)
			.mockResolvedValue({ ...free, state: 'revoked' });
		mount();
		await act(async () => {
			await Promise.resolve();
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(3000);
		});
		expect(screen.getByText('paid')).toBeInTheDocument();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(15000);
		});
		expect(screen.getByText('free')).toBeInTheDocument();
	});

	it('rejects link creation if a read-only credential cannot be issued', async () => {
		mocks.key.mockRejectedValue(new Error('No se pudo verificar la credencial'));
		mount();
		await waitFor(() => expect(purchase.status?.state).toBe('free'));
		await act(async () => {
			await expect(purchase.createOverlayUrl('/overlay/avatar')).rejects.toThrow('verificar');
		});
		expect(mocks.key).toHaveBeenCalled();
	});
	it('issues a private OBS link even before billing is enabled', async () => {
		mocks.key.mockResolvedValue('readonly-key');
		mocks.status.mockResolvedValue({ ...free, available: false, state: 'unavailable' });
		mount();
		await waitFor(() => expect(purchase.status?.available).toBe(false));
		expect(new URL(await purchase.createOverlayUrl('/overlay/avatar')).hash).toBe(
			'#support=readonly-key',
		);
	});
	it('expires cached studio permissions after five minutes of repeated connection errors', async () => {
		vi.useFakeTimers();
		mocks.status.mockResolvedValueOnce(paid).mockRejectedValue(new Error('offline'));
		mount();
		await act(async () => {
			await Promise.resolve();
		});
		expect(screen.getByText('paid')).toBeInTheDocument();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(15000);
		});
		expect(screen.getByText('paid')).toBeInTheDocument();
		for (let i = 0; i < 20; i++) {
			await act(async () => {
				await vi.advanceTimersByTimeAsync(15000);
			});
		}
		expect(screen.getByText('free')).toBeInTheDocument();
		expect(mocks.status.mock.calls.length).toBeGreaterThan(10);
	});
});
