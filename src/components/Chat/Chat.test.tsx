import { act, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StreamChat from './Chat';

const mocks = vi.hoisted(() => ({
	addMessage: vi.fn(),
	getToken: vi.fn(async () => 'clerk-token'),
	toastError: vi.fn(),
}));

vi.mock('@/api/streamToken', () => ({
	fetchStreamToken: vi.fn(async () => ({ token: 'stream-token' })),
}));
vi.mock('@/context/AppSettingsContext', () => ({ useAppSettings: () => ({ settings: {} }) }));
vi.mock('@/context/MessagesContext', () => ({
	useMessages: () => ({ addMessage: mocks.addMessage }),
}));
vi.mock('@/hooks/useAvatar', () => ({
	useAvatar: () => ({
		sendAvatarPayload: vi.fn(),
		connect: vi.fn(),
		connected: false,
		connecting: false,
	}),
}));
vi.mock('@/hooks/useVoiceErrorReporter', () => ({
	useVoiceErrorReporter: () => ({ report: vi.fn(), reset: vi.fn() }),
}));
vi.mock('@/lib/avatar/vrmManager', () => ({ vrmManager: { handleAvatarTrigger: vi.fn() } }));
vi.mock('@/lib/speechPipeline', () => ({
	singleChunkStream: vi.fn(),
	speakTextStream: vi.fn(),
	speechDeduplicator: { isDuplicateOrRecent: vi.fn() },
}));
vi.mock('@clerk/nextjs', () => ({
	useAuth: () => ({ getToken: mocks.getToken, isLoaded: true, isSignedIn: true }),
}));
vi.mock('sonner', () => ({ toast: { error: mocks.toastError } }));

class FakeEventSource {
	static instance: FakeEventSource;
	listeners = new Map<string, (event: MessageEvent<string>) => void>();
	onopen: (() => void) | null = null;
	onerror: (() => void) | null = null;

	constructor(_url: string) {
		FakeEventSource.instance = this;
	}

	addEventListener(name: string, listener: (event: MessageEvent<string>) => void) {
		this.listeners.set(name, listener);
	}

	close = vi.fn();

	emit(name: string, data: unknown) {
		this.listeners.get(name)?.(new MessageEvent(name, { data: JSON.stringify(data) }));
	}
}

describe('StreamChat AI errors', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal('EventSource', FakeEventSource);
	});

	afterEach(() => vi.unstubAllGlobals());

	it('notifies the user of a provider error while leaving ordinary system events as messages', async () => {
		render(<StreamChat />);
		await waitFor(() => expect(FakeEventSource.instance?.listeners.has('system')).toBe(true));

		act(() => {
			FakeEventSource.instance.emit('system', {
				id: 'ai-error-1',
				type: 'system',
				message: 'Generic backend message',
				metadata: {
					source: 'ai_error',
					error: { code: 'error.insufficient-credits', provider: 'openrouter' },
				},
			});
			FakeEventSource.instance.emit('system', {
				id: 'system-1',
				type: 'system',
				message: 'Chat conectado',
			});
		});

		expect(mocks.toastError).toHaveBeenCalledTimes(1);
		expect(mocks.toastError).toHaveBeenCalledWith(
			expect.stringMatching(/OpenRouter.*créditos.*límite/),
			expect.any(Object),
		);
		expect(mocks.addMessage).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'system', content: expect.stringContaining('OpenRouter') }),
		);
		expect(mocks.addMessage).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'system', content: 'Chat conectado' }),
		);
	});
});
