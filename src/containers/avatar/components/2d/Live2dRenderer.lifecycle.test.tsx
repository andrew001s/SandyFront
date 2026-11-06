import { avatar2dManager } from '@/lib/avatar2d/avatar2dManager';
import { live2dStore } from '@/lib/avatar2d/live2dStore';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Live2dRenderer } from './Live2dRenderer';

const runtime = vi.hoisted(() => ({
	stop: vi.fn(),
	destroy: vi.fn(),
	destroyModel: vi.fn(),
	from: vi.fn(),
	addChild: vi.fn(),
	off: vi.fn(),
	cancelFrame: vi.fn(),
	disconnectObserver: vi.fn(),
}));
vi.mock('pixi.js', () => ({
	Ticker: {},
	Application: class {
		screen = { width: 800, height: 600 };
		stage = { addChild: runtime.addChild };
		stop = runtime.stop;
		destroy = runtime.destroy;
	},
}));
vi.mock('pixi-live2d-display/cubism4', () => ({
	Cubism4ExpressionManager: null,
	Live2DModel: { registerTicker: vi.fn(), from: runtime.from },
	Live2DFactory: { findRuntime: () => ({ createModelSettings: () => ({}) }) },
}));

describe('Live2D render resource lifecycle', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal('Live2DCubismCore', {});
		vi.stubGlobal('requestAnimationFrame', () => 1);
		vi.stubGlobal('cancelAnimationFrame', runtime.cancelFrame);
		vi.stubGlobal(
			'ResizeObserver',
			class {
				observe = vi.fn();
				disconnect = runtime.disconnectObserver;
			},
		);
		live2dStore.setPackage({
			modelSettingsJson: {},
			fileMap: {},
			modelName: 'Prueba',
			blobUrls: [],
		});
		runtime.from.mockResolvedValue({
			destroy: runtime.destroyModel,
			scale: { set: vi.fn() },
			internalModel: { on: vi.fn(), off: runtime.off },
		});
	});
	afterEach(() => {
		cleanup();
		live2dStore.setPackage(null);
		vi.unstubAllGlobals();
	});

	it('stops Pixi and destroys GPU resources and observers when the preview unmounts', async () => {
		const { unmount } = render(<Live2dRenderer config={avatar2dManager.getState().live2d} />);
		await waitFor(() => expect(runtime.addChild).toHaveBeenCalledOnce());
		unmount();
		expect(runtime.stop).toHaveBeenCalledOnce();
		expect(runtime.destroy).toHaveBeenCalledWith(false, {
			children: true,
			texture: true,
			baseTexture: true,
		});
		expect(runtime.off).toHaveBeenCalledWith('beforeModelUpdate');
		expect(runtime.cancelFrame).toHaveBeenCalled();
		expect(runtime.disconnectObserver).toHaveBeenCalledOnce();
		expect(live2dStore.getPackage()?.modelName).toBe('Prueba');
	});

	it('disposes a model that finishes loading after unmounting', async () => {
		let resolveModel!: (value: unknown) => void;
		runtime.from.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					resolveModel = resolve;
				}),
		);
		const { unmount } = render(<Live2dRenderer config={avatar2dManager.getState().live2d} />);
		await waitFor(() => expect(runtime.from).toHaveBeenCalledOnce());
		unmount();
		await act(async () => resolveModel({ destroy: runtime.destroyModel }));
		expect(runtime.destroyModel).toHaveBeenCalledWith({
			children: true,
			texture: true,
			baseTexture: true,
		});
		expect(runtime.addChild).not.toHaveBeenCalled();
	});
});
