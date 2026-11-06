import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sdk = vi.hoisted(() => ({
	clients: [] as Array<{
		emit: (name: string) => void;
		disconnect: ReturnType<typeof vi.fn<() => Promise<void>>>;
		parameterCreation: ReturnType<typeof vi.fn<() => Promise<unknown>>>;
		availableModels: ReturnType<typeof vi.fn<() => Promise<unknown>>>;
	}>,
	apiState: null as null | (() => Promise<unknown>),
	parameterCreation: null as null | (() => Promise<unknown>),
}));

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));
vi.mock('@/lib/audioQueueSingleton', () => ({
	AudioQueueManager: { getInstance: () => ({ setLipSyncHandler: vi.fn() }) },
}));
vi.mock('@/lib/vtsLipSync', () => ({ createVtsLipSyncHandler: vi.fn(), stopVtsLipSync: vi.fn() }));
vi.mock('vtubestudio', () => ({
	VTubeStudioError: class extends Error {},
	ApiClient: class {
		constructor(options: unknown) {
			const listeners = new Map<string, () => void>();
			const client = {
				options,
				on: (name: string, fn: () => void) => listeners.set(name, fn),
				emit: (name: string) => listeners.get(name)?.(),
				disconnect: vi.fn(async () => undefined),
				apiState: vi.fn(
					sdk.apiState ?? (async () => ({ active: true, currentSessionAuthenticated: true })),
				),
				parameterCreation: vi.fn(sdk.parameterCreation ?? (async () => ({}))),
				statistics: vi.fn(async () => ({ framerate: 60 })),
				availableModels: vi.fn(async () => ({ availableModels: [{ modelID: 'preview' }] })),
				currentModel: vi.fn(async () => ({ modelLoaded: true, modelID: 'preview' })),
				hotkeysInCurrentModel: vi.fn(async () => ({ availableHotkeys: [{ hotkeyID: 'smile' }] })),
				expressionState: vi.fn(async () => ({ expressions: [{ name: 'smile' }] })),
				vtsFolderInfo: vi.fn(async () => ({ models: 'models' })),
				events: { modelLoaded: { subscribe: vi.fn(async () => undefined) } },
			};
			sdk.clients.push(client);
			Object.assign(this, client);
		}
	},
}));

const deferred = () => {
	let resolve!: (value: unknown) => void;
	const promise = new Promise((done) => {
		resolve = done;
	});
	return { promise, resolve };
};

describe('VTube Studio connection lifecycle', () => {
	beforeEach(() => {
		vi.resetModules();
		localStorage.clear();
		sdk.clients = [];
		sdk.apiState = null;
		sdk.parameterCreation = null;
	});
	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	it('stays disconnected and disposes the client when VTS cannot be reached', async () => {
		sdk.apiState = async () => {
			throw new Error('VTube Studio no está disponible');
		};
		const { useVTubeStudio } = await import('./useVTubeStudio');
		const { result } = renderHook(useVTubeStudio);
		const other = renderHook(useVTubeStudio);
		await act(() => Promise.all([result.current.connect(), other.result.current.connect()]));
		expect(result.current.connected).toBe(false);
		expect(result.current.connecting).toBe(false);
		expect(result.current.error).toContain('no está disponible');
		expect(other.result.current.error).toContain('no está disponible');
		expect(sdk.clients[0].disconnect).toHaveBeenCalledOnce();
	});

	it('cancels an in-flight connection without a late response reconnecting it', async () => {
		const pending = deferred();
		sdk.apiState = () => pending.promise;
		const { useVTubeStudio } = await import('./useVTubeStudio');
		const { result } = renderHook(useVTubeStudio);
		let connecting!: Promise<void>;
		act(() => {
			connecting = result.current.connect();
		});
		expect(result.current.connecting).toBe(true);
		await act(() => result.current.disconnect());
		expect(result.current.connecting).toBe(false);
		await act(async () => {
			pending.resolve({ active: true, currentSessionAuthenticated: true });
			await connecting;
			sdk.clients[0].emit('connect');
		});
		expect(result.current.connected).toBe(false);
		expect(result.current.error).toBeNull();
		expect(sdk.clients[0].parameterCreation).not.toHaveBeenCalled();
	});

	it('waits for lip sync parameters before declaring the connection ready', async () => {
		const pending = deferred();
		sdk.parameterCreation = () => pending.promise;
		const { useVTubeStudio } = await import('./useVTubeStudio');
		const { result } = renderHook(useVTubeStudio);
		let connecting!: Promise<void>;
		await act(async () => {
			connecting = result.current.connect();
		});
		act(() => sdk.clients[0].emit('connect'));
		expect(result.current.connected).toBe(false);
		await act(() => result.current.disconnect());
		await act(async () => {
			pending.resolve({});
			await connecting;
		});
		expect(result.current.connected).toBe(false);
	});

	it('clears model data in every consumer even if socket teardown fails', async () => {
		const { useVTubeStudio } = await import('./useVTubeStudio');
		const { result } = renderHook(() => [useVTubeStudio(), useVTubeStudio()]);
		await act(() => result.current[0].connect());
		expect(result.current[1].models).toHaveLength(1);
		sdk.clients[0].disconnect.mockRejectedValueOnce(new Error('Already closed'));
		await act(() => result.current[0].disconnect());
		for (const connection of result.current) {
			expect(connection.connected).toBe(false);
			expect(connection.models).toEqual([]);
			expect(connection.expressions).toEqual([]);
			expect(connection.hotkeys).toEqual([]);
			expect(connection.currentModel).toBeNull();
		}
	});

	it('ignores events from an old socket after connecting again', async () => {
		const pending = deferred();
		sdk.apiState = () => pending.promise;
		const { useVTubeStudio } = await import('./useVTubeStudio');
		const { result } = renderHook(useVTubeStudio);
		let oldAttempt!: Promise<void>;
		act(() => {
			oldAttempt = result.current.connect();
		});
		await act(() => result.current.disconnect());
		sdk.apiState = null;
		await act(() => result.current.connect(8002));
		await act(async () => {
			pending.resolve({ active: true, currentSessionAuthenticated: true });
			await oldAttempt;
			sdk.clients[0].emit('disconnect');
		});
		expect(result.current.connected).toBe(true);
		expect(result.current.currentModel?.modelID).toBe('preview');
		await act(() => result.current.disconnect());
	});

	it('discards a model refresh that finishes after disconnecting', async () => {
		const { useVTubeStudio } = await import('./useVTubeStudio');
		const { result } = renderHook(useVTubeStudio);
		await act(() => result.current.connect());
		const pending = deferred();
		sdk.clients[0].availableModels.mockImplementationOnce(() => pending.promise);
		let refresh!: Promise<void>;
		act(() => {
			refresh = result.current.refreshModels();
		});
		await act(() => result.current.disconnect());
		await act(async () => {
			pending.resolve({ availableModels: [{ modelID: 'stale' }] });
			await refresh;
		});
		expect(result.current.models).toEqual([]);
		expect(result.current.currentModel).toBeNull();
	});

	it('cancels automatic retries and does not reconnect when another consumer mounts', async () => {
		vi.useFakeTimers();
		const { useVTubeStudio } = await import('./useVTubeStudio');
		const first = renderHook(useVTubeStudio);
		await act(() => first.result.current.connect(8002));
		localStorage.setItem('vts_auth_token', 'test-token');
		act(() => sdk.clients[0].emit('disconnect'));
		await act(() => first.result.current.disconnect());
		renderHook(useVTubeStudio);
		await act(() => vi.advanceTimersByTimeAsync(31000));
		expect(sdk.clients).toHaveLength(1);
	});
});
