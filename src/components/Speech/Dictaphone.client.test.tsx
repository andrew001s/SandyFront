import { setAutomaticReactionMapping } from '@/lib/avatar/reactionMappings';
import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Dictaphone from './Dictaphone.client';

const mocks = vi.hoisted(() => ({
	commands: [] as Array<{ callback: () => void }>,
	setEmotion: vi.fn(async () => undefined),
	resetEmotions: vi.fn(async () => undefined),
	addMessage: vi.fn(),
	decision: { reaction: true, emotion: 'surprised' } as {
		reaction: boolean;
		emotion: string | null;
	},
}));

vi.mock('@/api/aiResponse', () => ({
	streamAiResponse: vi.fn(async function* (request: {
		onReaction?: (decision: { reaction: boolean; emotion: string | null }) => void;
	}) {
		request.onReaction?.(mocks.decision);
		yield 'Hola.';
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
	useAvatar: () => ({ setEmotion: mocks.setEmotion, resetEmotions: mocks.resetEmotions }),
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
vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() } }));
vi.mock('thinking-orbs', () => ({ ThinkingOrb: () => null }));

describe('Dictaphone avatar reactions', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		setAutomaticReactionMapping('surprised', null);
		vi.clearAllMocks();
		mocks.decision = { reaction: true, emotion: 'surprised' };
	});
	it('maps an AI reaction to the selected avatar expression', async () => {
		setAutomaticReactionMapping('surprised', 'custom_smile');
		render(<Dictaphone variant='tile' />);

		act(() => mocks.commands[0]?.callback());
		await act(async () => {
			await vi.advanceTimersByTimeAsync(2000);
		});

		expect(mocks.setEmotion).toHaveBeenCalledWith('custom_smile');

		vi.useRealTimers();
	});

	it('activates the emotion returned with an affirmative reaction', async () => {
		render(<Dictaphone variant='tile' />);

		act(() => mocks.commands[0]?.callback());
		await act(async () => {
			await vi.advanceTimersByTimeAsync(2000);
		});

		expect(mocks.setEmotion).toHaveBeenCalledWith('surprised');

		vi.useRealTimers();
	});

	it('does not activate an expression for a no-reaction response', async () => {
		mocks.decision = { reaction: false, emotion: null };
		render(<Dictaphone variant='tile' />);

		act(() => mocks.commands[0]?.callback());
		await act(async () => {
			await vi.advanceTimersByTimeAsync(2000);
		});

		expect(mocks.setEmotion).not.toHaveBeenCalled();

		vi.useRealTimers();
	});

	it('resets an activated expression when response delivery ends', async () => {
		render(<Dictaphone variant='tile' />);

		act(() => mocks.commands[0]?.callback());
		await act(async () => {
			await vi.advanceTimersByTimeAsync(2000);
		});

		expect(mocks.setEmotion).toHaveBeenCalledWith('surprised');
		expect(mocks.resetEmotions).toHaveBeenCalledOnce();

		vi.useRealTimers();
	});
});
