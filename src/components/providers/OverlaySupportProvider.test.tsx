import { useWatermarkFree } from '@/context/SupportPurchaseContext';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OverlaySupportProvider } from './OverlaySupportProvider';

const { check } = vi.hoisted(() => ({ check: vi.fn() }));
vi.mock('@/api/support', () => ({ getOverlaySupportStatus: check }));
function Consumer() {
	return <output>{useWatermarkFree() ? 'paid' : 'free'}</output>;
}
const mount = () =>
	render(
		<OverlaySupportProvider>
			<Consumer />
		</OverlaySupportProvider>,
	);
describe('read-only OBS purchase verification', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		sessionStorage.clear();
		localStorage.clear();
		history.replaceState(null, '', '/overlay/avatar#support=limited-key');
	});
	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});
	it('removes the capability from the address and verifies it with the server', async () => {
		check.mockResolvedValue({ watermark_free: true });
		mount();
		await waitFor(() => expect(screen.getByText('paid')).toBeInTheDocument());
		expect(location.hash).toBe('');
		expect(sessionStorage.getItem('sandy:obs-support-key:/overlay/avatar')).toBe('limited-key');
		expect(check).toHaveBeenCalledWith('limited-key', expect.any(AbortSignal));
	});
	it('does not grant access for a stored key if the server is unavailable', async () => {
		check.mockRejectedValue(new Error('offline'));
		mount();
		await waitFor(() => expect(check).toHaveBeenCalledOnce());
		expect(screen.getByText('free')).toBeInTheDocument();
	});
	it('observes revoked purchases on the next check', async () => {
		vi.useFakeTimers();
		check
			.mockResolvedValueOnce({ watermark_free: true })
			.mockResolvedValue({ watermark_free: false });
		mount();
		await act(async () => {
			await Promise.resolve();
		});
		expect(screen.getByText('paid')).toBeInTheDocument();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(15000);
		});
		expect(screen.getByText('free')).toBeInTheDocument();
	});
	it('clears previous permission immediately when the OBS credential changes', async () => {
		check
			.mockResolvedValueOnce({ watermark_free: true })
			.mockImplementation(() => new Promise(() => undefined));
		mount();
		await waitFor(() => expect(screen.getByText('paid')).toBeInTheDocument());
		await act(async () => {
			history.replaceState(null, '', '/overlay/avatar#support=other-key');
			window.dispatchEvent(new Event('hashchange'));
		});
		expect(screen.getByText('free')).toBeInTheDocument();
	});
	it('aborts outstanding verification when unmounted', async () => {
		check.mockImplementation(() => new Promise(() => undefined));
		const view = mount();
		await waitFor(() => expect(check).toHaveBeenCalledOnce());
		const signal = check.mock.calls[0][1];
		view.unmount();
		expect(signal.aborted).toBe(true);
	});

	it('updates an already open free source after activation without replacing its URL', async () => {
		vi.useFakeTimers();
		check
			.mockResolvedValueOnce({ watermark_free: false })
			.mockResolvedValue({ watermark_free: true });
		mount();
		await act(async () => {
			await Promise.resolve();
		});
		expect(screen.getByText('free')).toBeInTheDocument();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(15000);
		});
		expect(screen.getByText('paid')).toBeInTheDocument();
		expect(check.mock.calls.map((call) => call[0])).toEqual(['limited-key', 'limited-key']);
	});

	it('preserves verified Plus through transient errors, including a reload, then expires the cache', async () => {
		vi.useFakeTimers();
		check.mockResolvedValueOnce({ watermark_free: true }).mockRejectedValue(new Error('offline'));
		const first = mount();
		await act(async () => {
			await Promise.resolve();
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(15000);
		});
		expect(screen.getByText('paid')).toBeInTheDocument();
		first.unmount();
		mount();
		await act(async () => {
			await Promise.resolve();
		});
		expect(screen.getByText('paid')).toBeInTheDocument();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(5 * 60000);
		});
		expect(screen.getByText('free')).toBeInTheDocument();
	});

	it('checks again on reconnect even if OBS reports the document as hidden', async () => {
		check
			.mockResolvedValueOnce({ watermark_free: false })
			.mockResolvedValue({ watermark_free: true });
		mount();
		await waitFor(() => expect(check).toHaveBeenCalledOnce());
		vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
		await act(async () => {
			window.dispatchEvent(new Event('online'));
		});
		expect(screen.getByText('paid')).toBeInTheDocument();
		vi.restoreAllMocks();
	});

	it('rejects an invalidated credential immediately instead of treating it as a network failure', async () => {
		check
			.mockResolvedValueOnce({ watermark_free: true })
			.mockRejectedValue(Object.assign(new Error('invalid'), { status: 401 }));
		mount();
		await waitFor(() => expect(screen.getByText('paid')).toBeInTheDocument());
		await act(async () => {
			window.dispatchEvent(new Event('online'));
		});
		expect(screen.getByText('free')).toBeInTheDocument();
	});

	it('recovers old session credentials and keeps existing fragment parameters', async () => {
		history.replaceState(null, '', '/overlay/avatar#camera=front');
		sessionStorage.setItem('sandy:obs-support-key', 'original-key');
		check.mockResolvedValue({ watermark_free: true });
		mount();
		await waitFor(() => expect(screen.getByText('paid')).toBeInTheDocument());
		expect(check).toHaveBeenCalledWith('original-key', expect.any(AbortSignal));
		expect(location.hash).toBe('#camera=front');
	});

	it('binds an old bare URL from the existing shared browser context and pins its owner', async () => {
		history.replaceState(null, '', '/overlay/avatar2d');
		localStorage.setItem('sandy:obs-support-owner', 'legacy-owner-key');
		check.mockResolvedValue({ watermark_free: true });
		const first = mount();
		await waitFor(() => expect(screen.getByText('paid')).toBeInTheDocument());
		expect(location.href).not.toContain('support=');
		first.unmount();
		sessionStorage.clear();
		localStorage.setItem('sandy:obs-support-owner', 'different-account-key');
		mount();
		await waitFor(() =>
			expect(check).toHaveBeenLastCalledWith('legacy-owner-key', expect.any(AbortSignal)),
		);
	});
});
