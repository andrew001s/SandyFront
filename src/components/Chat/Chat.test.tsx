import { act, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StreamChat from './Chat';

const mocks = vi.hoisted(() => ({
	addMessage: vi.fn(),
	getToken: vi.fn(async () => 'clerk-token'),
	toastError: vi.fn(),
	capturePosthog: vi.fn(),
}));

vi.mock('@/api/streamToken', () => ({
	fetchStreamToken: vi.fn(async () => ({ token: 'stream-token' })),
}));
vi.mock('@/context/AppSettingsContext', () => ({
	useAppSettings: () => ({ settings: { ai_provider: 'gemini' } }),
}));
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
	speakTextStream: vi.fn(
		async (
			_stream: AsyncIterable<string>,
			options: { onSynthesisDuration?: (durationMs: number) => void },
		) => {
			options.onSynthesisDuration?.(42);
			return 'respuesta privada';
		},
	),
	speechDeduplicator: { isDuplicateOrRecent: vi.fn() },
}));
vi.mock('@clerk/nextjs', () => ({
	useAuth: () => ({ getToken: mocks.getToken, isLoaded: true, isSignedIn: true }),
}));
vi.mock('sonner', () => ({ toast: { error: mocks.toastError } }));
vi.mock('posthog-js', () => ({ default: { capture: mocks.capturePosthog } }));

class FakeEventSource {
	static instance: FakeEventSource;
	listeners = new Map<string, (event: MessageEvent<string>) => void>();
	onopen: (() => void) | null = null;
	onerror: (() => void) | null = null;

	constructor() {
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
		localStorage.removeItem('sandy_ai_provider');
		vi.stubGlobal('EventSource', FakeEventSource);
	});

	afterEach(() => vi.unstubAllGlobals());

	it('notifies the user of a provider error while leaving ordinary system events as messages', async () => {
		const { container } = render(<StreamChat />);
		expect(container).toBeEmptyDOMElement();
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
		expect(mocks.capturePosthog).toHaveBeenCalledWith(
			'ai_request_failed',
			expect.objectContaining({ code: 'error.insufficient-credits', provider: 'openrouter' }),
		);
	});

	it('tracks an AI speech response once without including its text or prompt', async () => {
		render(<StreamChat />);
		await waitFor(() => expect(FakeEventSource.instance?.listeners.has('speech')).toBe(true));

		const speech = {
			id: 'speech-1',
			type: 'speech',
			text: 'respuesta privada',
			metadata: {
				source: 'eventsub',
				eventKind: 'speech',
				message: 'prompt privado',
				response: 'respuesta privada',
			},
		};
		act(() => {
			FakeEventSource.instance.emit('speech', speech);
			FakeEventSource.instance.emit('speech', speech);
		});
		await waitFor(() => expect(mocks.capturePosthog).toHaveBeenCalledOnce());
		expect(mocks.capturePosthog).toHaveBeenCalledWith(
			'ai_response_succeeded',
			expect.objectContaining({
				provider: 'gemini',
				mode: 'voice',
				interaction_type: 'chat',
				tts_generation_ms: 42,
				tts_provider: 'edge_tts',
			}),
		);
		expect(JSON.stringify(mocks.capturePosthog.mock.calls)).not.toContain('prompt privado');
		expect(JSON.stringify(mocks.capturePosthog.mock.calls)).not.toContain('respuesta privada');
	});
});
