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
		expect(sessionStorage.getItem('sandy:obs-support-key')).toBe('limited-key');
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
			await vi.advanceTimersByTimeAsync(60000);
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
});
