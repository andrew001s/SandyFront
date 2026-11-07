import { DEFAULT_VRM_BACKGROUND_STATE } from '@/lib/avatar/vrmBackground';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AvatarOverlayPage from './avatar/page';
import Avatar2dOverlayPage from './avatar2d/page';

vi.mock('@/lib/avatar/vrmViewer', () => ({
	VrmViewer: class {
		resize = vi.fn();
		dispose = vi.fn();
	},
}));
vi.mock('@/lib/avatar/vrmManager', () => ({
	vrmManager: {
		getBackground: () => DEFAULT_VRM_BACKGROUND_STATE,
		registerViewer: () => () => undefined,
		subscribeBackground: () => () => undefined,
		requestSync: vi.fn(),
	},
}));
vi.mock('@/lib/avatar2d/live2dModel', () => ({ restoreSavedLive2dModel: vi.fn(async () => null) }));
vi.mock('@/containers/avatar/components/2d/Live2dRenderer', () => ({
	Live2dRenderer: () => <div>Modelo 2D</div>,
}));
vi.mock('@/containers/avatar/components/2d/PngTuberRenderer', () => ({
	PngTuberRenderer: () => <div>Modelo PNG</div>,
}));

describe('watermark in OBS sources', () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});
	it.each([
		['3D', AvatarOverlayPage],
		['PNG / Live2D', Avatar2dOverlayPage],
	] as const)(
		'includes the support animation in the %s source without studio controls',
		(_name, Page) => {
			render(<Page />);
			act(() => vi.advanceTimersByTime(30_000));
			expect(screen.getByRole('link', { name: /Apoya Sandy Studio/ })).toBeInTheDocument();
			expect(screen.queryByRole('button')).not.toBeInTheDocument();
		},
	);
});
