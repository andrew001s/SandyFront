import {
	ExpressionHotkey,
	ExpressionHotkeyStatus,
} from '@/containers/avatar/components/common/ExpressionHotkey';
import { useExpressionHotkeys } from '@/hooks/useExpressionHotkeys';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExpressionHotkeysProvider } from './ExpressionHotkeysContext';

const mocks = vi.hoisted(() => ({
	get: vi.fn(),
	save: vi.fn(),
	token: vi.fn(async () => 'token-a'),
	toggle: vi.fn(),
	account: 'account-a',
}));
vi.mock('@/api/settings', () => ({ getSettings: mocks.get, saveSettings: mocks.save }));
vi.mock('@clerk/nextjs', () => ({
	useAuth: () => ({
		userId: mocks.account,
		isLoaded: true,
		isSignedIn: true,
		getToken: mocks.token,
	}),
}));
function Controls({ scope = 'vrm' }: { scope?: string }) {
	useExpressionHotkeys(scope, [{ id: 'happy' }, { id: 'sad' }], mocks.toggle);
	return (
		<>
			<ExpressionHotkey scope={scope} id='happy' label='Alegría' />
			<ExpressionHotkey scope={scope} id='sad' label='Tristeza' />
			<input aria-label='Mensaje' />
			<ExpressionHotkeyStatus />
		</>
	);
}
const view = (scope = 'vrm') => (
	<ExpressionHotkeysProvider>
		<Controls scope={scope} />
	</ExpressionHotkeysProvider>
);
const record = (label: string, key: string, code: string) => {
	const button = screen.getByRole('button', { name: `Atajo de ${label}` });
	fireEvent.click(button);
	fireEvent.keyDown(button, { key, code });
};
describe('expression hotkeys', () => {
	beforeEach(() => {
		mocks.account = 'account-a';
		vi.clearAllMocks();
		mocks.get.mockResolvedValue({ settings: { expression_hotkeys: {} } });
		mocks.save.mockResolvedValue({ settings: {} });
	});
	it('saves and reloads a binding, then triggers it only outside text fields and without key repeats', async () => {
		const bindings: Record<string, string> = {};
		mocks.get.mockImplementation(async () => ({
			settings: { expression_hotkeys: { ...bindings } },
		}));
		mocks.save.mockImplementation(async (payload) => {
			Object.assign(bindings, payload.expression_hotkeys);
			return { settings: { expression_hotkeys: { ...bindings } } };
		});
		const first = render(view());
		await screen.findByText('Atajos guardados en tu cuenta.');
		record('Alegría', 'h', 'KeyH');
		await waitFor(() =>
			expect(mocks.save).toHaveBeenCalledWith(
				{ expression_hotkeys: { 'vrm:happy': 'KeyH' } },
				{ token: 'token-a' },
			),
		);
		first.unmount();
		render(view());
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Atajo de Alegría' })).toHaveTextContent('H'),
		);
		fireEvent.keyDown(screen.getByRole('button', { name: 'Atajo de Alegría' }), {
			key: 'h',
			code: 'KeyH',
		});
		expect(mocks.toggle).toHaveBeenCalledWith('happy');
		fireEvent.keyDown(screen.getByRole('textbox', { name: 'Mensaje' }), { key: 'h', code: 'KeyH' });
		fireEvent.keyDown(window, { key: 'h', code: 'KeyH', repeat: true });
		expect(mocks.toggle).toHaveBeenCalledTimes(1);
	});
	it('discards a late response from the previous account', async () => {
		let finishOldRead: (value: {
			settings: { expression_hotkeys: Record<string, string> };
		}) => void = () => undefined;
		mocks.get
			.mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						finishOldRead = resolve;
					}),
			)
			.mockResolvedValue({ settings: { expression_hotkeys: { 'vrm:happy': 'KeyN' } } });
		const current = render(view());
		await waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(1));
		mocks.account = 'account-b';
		current.rerender(view());
		await act(async () =>
			finishOldRead({ settings: { expression_hotkeys: { 'vrm:happy': 'KeyH' } } }),
		);
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Atajo de Alegría' })).toHaveTextContent('N'),
		);
		fireEvent.keyDown(window, { key: 'h', code: 'KeyH' });
		expect(mocks.toggle).not.toHaveBeenCalled();
		fireEvent.keyDown(window, { key: 'n', code: 'KeyN' });
		expect(mocks.toggle).toHaveBeenCalledWith('happy');
	});
	it('rejects duplicates, removes a binding and keeps the other format intact', async () => {
		mocks.get.mockResolvedValue({
			settings: { expression_hotkeys: { 'vrm:happy': 'KeyH', 'live2d:happy': 'KeyH' } },
		});
		render(view());
		await screen.findByText('Atajos guardados en tu cuenta.');
		record('Tristeza', 'h', 'KeyH');
		expect(screen.getByRole('alert')).toHaveTextContent('ya está asignada');
		expect(mocks.save).not.toHaveBeenCalled();
		record('Alegría', 'Delete', 'Delete');
		await waitFor(() =>
			expect(mocks.save).toHaveBeenCalledWith(
				{ expression_hotkeys: { 'live2d:happy': 'KeyH' } },
				{ token: 'token-a' },
			),
		);
	});
	it('serializes rapid changes and retries a failed write without losing the draft', async () => {
		let finish: () => void = () => undefined;
		const blocked = new Promise<void>((resolve) => {
			finish = resolve;
		});
		mocks.save
			.mockImplementationOnce(async () => {
				await blocked;
				return { settings: {} };
			})
			.mockRejectedValueOnce(new Error('offline'))
			.mockResolvedValue({ settings: {} });
		render(view());
		await screen.findByText('Atajos guardados en tu cuenta.');
		record('Alegría', 'h', 'KeyH');
		record('Tristeza', 's', 'KeyS');
		await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1));
		await act(async () => finish());
		await screen.findByRole('button', { name: 'Reintentar' });
		fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
		await screen.findByText('Atajos guardados en tu cuenta.');
		expect(mocks.save).toHaveBeenLastCalledWith(
			{ expression_hotkeys: { 'vrm:happy': 'KeyH', 'vrm:sad': 'KeyS' } },
			{ token: 'token-a' },
		);
	});
});
