import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Dictaphone from './Dictaphone.client';

const mocks = vi.hoisted(() => ({
	commands: [] as Array<{ callback: () => void }>,
	sendAvatarPayload: vi.fn(async () => true),
	addMessage: vi.fn(),
	decision: { reaction: true, emotion: 'surprised' } as {
		reaction: boolean;
		emotion: string | null;
	},
	responseText: 'Hola.' as string,
	streamError: null as Error | null,
	capture: vi.fn(),
}));

vi.mock('@/api/aiResponse', () => ({
	streamAiResponse: vi.fn(async function* (request: {
		onReaction?: (decision: { reaction: boolean; emotion: string | null }) => void;
	}) {
		if (mocks.streamError) throw mocks.streamError;
		request.onReaction?.(mocks.decision);
		yield mocks.responseText;
	}),
}));
vi.mock('@/components/Speech/VoiceSetupDialog', () => ({ VoiceSetupDialog: () => null }));
vi.mock('@/context/AppSettingsContext', () => ({
	useAppSettings: () => ({
		settings: {
			ai_provider: 'gemini',
			stt_provider: 'browser',
			feature_flags: { voice_replies: false },
			persona_profile: { name: 'Sandy' },
		},
		isLoading: false,
	}),
}));
vi.mock('@/context/MessagesContext', () => ({
	useMessages: () => ({ addMessage: mocks.addMessage }),
}));
vi.mock('@/hooks/useAvatar', () => ({
	useAvatar: () => ({ sendAvatarPayload: mocks.sendAvatarPayload }),
}));
vi.mock('@/hooks/useServiceStatus', () => ({
	useServiceStatus: () => ({
		isRunning: true,
		hasLoaded: false,
		hasError: false,
		refresh: vi.fn(async () => ({ running: true })),
	}),
}));
vi.mock('@/hooks/useVoiceErrorReporter', () => ({
	useVoiceErrorReporter: () => ({ report: vi.fn(), reset: vi.fn() }),
}));
vi.mock('react-speech-recognition', () => ({
	default: {
		startListening: vi.fn(),
		stopListening: vi.fn(),
		removePolyfill: vi.fn(),
		applyPolyfill: vi.fn(),
	},
	useSpeechRecognition: ({ commands }: { commands: Array<{ callback: () => void }> }) => {
		mocks.commands = commands;
		return {
			transcript: 'hola',
			resetTranscript: vi.fn(),
			browserSupportsSpeechRecognition: true,
			listening: false,
		};
	},
}));
vi.mock('posthog-js', () => ({ default: { capture: mocks.capture } }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() } }));
vi.mock('thinking-orbs', () => ({ ThinkingOrb: () => null }));

describe('Dictaphone avatar reactions', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.clearAllMocks();
		mocks.decision = { reaction: true, emotion: 'surprised' };
		mocks.responseText = 'Hola.';
		mocks.streamError = null;
		localStorage.removeItem('sandy_ai_provider');
	});
	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});
	it('tracks one successful microphone response after text generation completes', async () => {
		render(<Dictaphone variant='tile' />);
		act(() => mocks.commands[0]?.callback());
		await act(async () => vi.advanceTimersByTimeAsync(2000));
		expect(mocks.capture).toHaveBeenCalledWith(
			'ai_response_succeeded',
			expect.objectContaining({ provider: 'gemini', mode: 'text', interaction_type: 'microphone' }),
		);
	});
	it('does not track a successful response when generation fails', async () => {
		mocks.streamError = new Error('provider failed');
		render(<Dictaphone variant='tile' />);
		act(() => mocks.commands[0]?.callback());
		await act(async () => vi.advanceTimersByTimeAsync(2000));
		expect(mocks.capture).toHaveBeenCalledWith('ai_request_failed', expect.any(Object));
		expect(mocks.capture).not.toHaveBeenCalledWith('ai_response_succeeded', expect.anything());
	});
	it('does not track an empty response as successful', async () => {
		mocks.responseText = '  \n';
		render(<Dictaphone variant='tile' />);
		act(() => mocks.commands[0]?.callback());
		await act(async () => vi.advanceTimersByTimeAsync(2000));
		expect(mocks.capture).not.toHaveBeenCalledWith('ai_response_succeeded', expect.anything());
	});
	it('forwards the AI reaction to the shared avatar dispatcher', async () => {
		render(<Dictaphone variant='tile' />);

		act(() => mocks.commands[0]?.callback());
		await act(async () => {
			await vi.advanceTimersByTimeAsync(2000);
		});

		expect(mocks.sendAvatarPayload).toHaveBeenCalledWith({
			type: 'reaction',
			reaction: true,
			emotion: 'surprised',
		});

		vi.useRealTimers();
	});

	it('forwards a no-reaction decision so the dispatcher can restore the base expression', async () => {
		mocks.decision = { reaction: false, emotion: null };
		render(<Dictaphone variant='tile' />);

		act(() => mocks.commands[0]?.callback());
		await act(async () => {
			await vi.advanceTimersByTimeAsync(2000);
		});

		expect(mocks.sendAvatarPayload).toHaveBeenCalledWith({
			type: 'reaction',
			reaction: false,
			emotion: undefined,
		});

		vi.useRealTimers();
	});

	it('does not force an immediate reset when response generation ends', async () => {
		render(<Dictaphone variant='tile' />);

		act(() => mocks.commands[0]?.callback());
		await act(async () => {
			await vi.advanceTimersByTimeAsync(2000);
		});

		expect(mocks.sendAvatarPayload).toHaveBeenCalledOnce();

		vi.useRealTimers();
	});
});
