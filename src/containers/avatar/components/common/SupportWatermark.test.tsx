import { WatermarkPermissionContext } from '@/context/SupportPurchaseContext';
import { KOFI_URL } from '@/lib/links';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SupportWatermark, SUPPORT_WATERMARK_TIMING as timing } from './SupportWatermark';

describe('periodic support watermark', () => {
	it('removes the notice and its timers when purchase permission becomes active', () => {
		const view = render(
			<WatermarkPermissionContext.Provider value={false}>
				<SupportWatermark />
			</WatermarkPermissionContext.Provider>,
		);
		act(() => vi.advanceTimersByTime(timing.firstAppearanceMs));
		expect(screen.getByRole('link')).toBeInTheDocument();
		view.rerender(
			<WatermarkPermissionContext.Provider value>
				<SupportWatermark />
			</WatermarkPermissionContext.Provider>,
		);
		expect(screen.queryByRole('link')).not.toBeInTheDocument();
		expect(vi.getTimerCount()).toBe(0);
	});
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	it('appears after the initial delay, retires and returns at the next interval', () => {
		render(<SupportWatermark />);
		expect(screen.queryByRole('link')).not.toBeInTheDocument();
		act(() => vi.advanceTimersByTime(timing.firstAppearanceMs));
		expect(screen.getByRole('link')).toHaveAttribute('href', KOFI_URL);
		expect(screen.getByText('¿Me invitas un café?')).toBeInTheDocument();
		expect(document.querySelector('img')).toHaveAttribute('src', '/support/sandy-coffee.gif');
		act(() => vi.advanceTimersByTime(timing.visibleMs));
		expect(screen.queryByRole('link')).not.toBeInTheDocument();
		act(() => vi.advanceTimersByTime(timing.intervalMs - timing.visibleMs));
		expect(screen.getByRole('link')).toBeInTheDocument();
	});

	it('does not disappear when studio controls are hidden and has no dismiss action', () => {
		const { rerender } = render(<SupportWatermark dockVisible />);
		act(() => vi.advanceTimersByTime(timing.firstAppearanceMs));
		rerender(<SupportWatermark dockVisible={false} />);
		expect(screen.getByRole('link')).toBeInTheDocument();
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
		expect(document.querySelector('source')).toHaveAttribute(
			'media',
			'(prefers-reduced-motion: reduce)',
		);
	});

	it('lets keyboard users finish interacting before removing the link', () => {
		render(<SupportWatermark />);
		act(() => vi.advanceTimersByTime(timing.firstAppearanceMs));
		const link = screen.getByRole('link');
		act(() => link.focus());
		act(() => vi.advanceTimersByTime(timing.visibleMs));
		expect(link).toHaveFocus();
		fireEvent.blur(link);
		expect(screen.queryByRole('link')).not.toBeInTheDocument();
	});

	it('removes its scheduled work on unmount', () => {
		const { unmount } = render(<SupportWatermark />);
		act(() => vi.advanceTimersByTime(timing.firstAppearanceMs));
		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});
	it('restores the notice immediately when a verified Plus permission is revoked', () => {
		const view = render(
			<WatermarkPermissionContext.Provider value>
				<SupportWatermark />
			</WatermarkPermissionContext.Provider>,
		);
		expect(screen.queryByRole('link')).not.toBeInTheDocument();
		view.rerender(
			<WatermarkPermissionContext.Provider value={false}>
				<SupportWatermark />
			</WatermarkPermissionContext.Provider>,
		);
		expect(screen.getByRole('link')).toBeInTheDocument();
	});
});
