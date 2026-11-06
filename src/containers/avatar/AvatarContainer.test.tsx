import * as useAvatarModule from '@/hooks/useAvatar';
import { setAutomaticReactionMapping } from '@/lib/avatar/reactionMappings';
import { avatar2dManager } from '@/lib/avatar2d/avatar2dManager';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AvatarContainer } from './AvatarContainer';

const { getSettingsMock, saveSettingsMock, useAuthMock } = vi.hoisted(() => ({
	getSettingsMock: vi.fn(),
	saveSettingsMock: vi.fn(),
	useAuthMock: vi.fn(),
}));
let resolveNextAccountSettings = (_value: {
	settings: { automatic_reaction_mappings: Record<string, string> };
}) => {
	void _value;
};

vi.mock('@/components/ui/sidebar', () => ({
	SidebarTrigger: () => <button type='button'>Menú</button>,
}));
vi.mock('@/containers/dashboard/DashboardActions', () => ({ DashboardActions: () => null }));

vi.mock('@/api/settings', () => ({
	getSettings: getSettingsMock,
	saveSettings: saveSettingsMock,
}));

vi.mock('@clerk/nextjs', () => ({
	useAuth: useAuthMock,
}));

vi.mock('@/containers/avatar/components/VrmCanvas', () => ({
	VrmCanvas: ({
		automaticReactions,
	}: {
		automaticReactions?: {
			mappings: Record<string, string>;
			onMappingChange: (
				reaction: string,
				config: { expressions: string[]; intensity: number } | null,
			) => void;
		};
	}) => (
		<div data-testid='vrm-canvas'>
			<output aria-label='Alegría'>{automaticReactions?.mappings.happy ?? ''}</output>
			<button
				type='button'
				onClick={() =>
					automaticReactions?.onMappingChange('happy', {
						expressions: ['smile'],
						intensity: 1,
					})
				}
			>
				Guardar alegría
			</button>
		</div>
	),
}));

vi.mock('@/containers/avatar/components/2d/Avatar2dCanvas', () => ({
	Avatar2dCanvas: ({ mode }: { mode?: string }) => (
		<div data-testid={`avatar-2d-${mode || 'default'}`}>Workspace: {mode || 'unspecified'}</div>
	),
}));

vi.mock('@/containers/avatar/components/AvatarHeader', () => ({
	AvatarHeader: () => <div data-testid='avatar-header'>Header</div>,
}));

describe('AvatarContainer', () => {
	const defaultMockAvatar = {
		activeSoftware: 'pngtuber' as const,
		setSoftware: vi.fn(),
		activeConfig: { port: 8001, host: 'localhost' },
		updateConfig: vi.fn(),
		is3D: false,
		connecting: false,
		connected: true,
		error: null,
		stats: { packetsSent: 0, lastPingMs: null, connectedAt: '' },
		connect: vi.fn(),
		disconnect: vi.fn(),
		setEmotion: vi.fn(),
		resetEmotions: vi.fn(),
		vts: {
			connected: false,
			connecting: false,
			error: null,
			models: [],
			currentModel: null,
			folderInfo: null,
			expressions: [],
			hotkeys: [],
			refreshModels: vi.fn(),
			loadModel: vi.fn(),
			setExpressionActive: vi.fn(),
			triggerHotkey: vi.fn(),
			moveModel: vi.fn(),
		},
	};

	beforeEach(() => {
		vi.restoreAllMocks();
		getSettingsMock.mockReset();
		saveSettingsMock.mockReset();
		useAuthMock.mockReturnValue({
			getToken: vi.fn().mockResolvedValue('account-token'),
			isLoaded: true,
			isSignedIn: true,
			userId: 'account-a',
		});
		getSettingsMock.mockResolvedValue({ settings: null });
		setAutomaticReactionMapping('surprised', null);
	});

	it('keeps the latest format when an earlier format save finishes late', async () => {
		let software = 'vrm';
		const server = { automatic_reaction_scope: 'pngtuber' };
		let finishOldWrite: () => void = () => undefined;
		const oldWrite = new Promise<void>((resolve) => {
			finishOldWrite = resolve;
		});
		getSettingsMock.mockImplementation(async () => ({ settings: { ...server } }));
		saveSettingsMock.mockImplementation(async (payload) => {
			if (payload.automatic_reaction_scope === 'vrm') await oldWrite;
			Object.assign(server, payload);
			return { settings: { ...server } };
		});
		vi.spyOn(useAvatarModule, 'useAvatar').mockImplementation(
			() =>
				({
					...defaultMockAvatar,
					activeSoftware: software,
				}) as unknown as ReturnType<typeof useAvatarModule.useAvatar>,
		);
		const { rerender } = render(<AvatarContainer />);
		await waitFor(() => expect(saveSettingsMock).toHaveBeenCalledTimes(1));
		software = 'pngtuber';
		rerender(<AvatarContainer />);
		await act(async () => {
			finishOldWrite();
			await oldWrite;
		});
		await waitFor(() => expect(getSettingsMock).toHaveBeenCalledTimes(2));
		await waitFor(() => expect(server.automatic_reaction_scope).toBe('pngtuber'));
	});

	it('restores the saved automatic reaction mappings for the signed-in account', async () => {
		getSettingsMock.mockResolvedValue({
			settings: { automatic_reaction_mappings: { happy: 'smile' } },
		});
		vi.spyOn(useAvatarModule, 'useAvatar').mockReturnValue({
			...defaultMockAvatar,
			activeSoftware: 'vrm',
		} as unknown as ReturnType<typeof useAvatarModule.useAvatar>);

		render(<AvatarContainer />);

		await waitFor(() => expect(screen.getByLabelText('Alegría')).toHaveTextContent('smile'));
		expect(getSettingsMock).toHaveBeenCalledWith({ token: 'account-token' });
	});

	it('applies the saved Live2D base expression after account mappings load', async () => {
		getSettingsMock.mockResolvedValue({
			settings: { automatic_reaction_mappings: { 'live2d:neutral': 'base-smile' } },
		});
		vi.spyOn(useAvatarModule, 'useAvatar').mockReturnValue({
			...defaultMockAvatar,
			activeSoftware: 'live2d',
		} as unknown as ReturnType<typeof useAvatarModule.useAvatar>);

		render(<AvatarContainer />);

		await waitFor(() =>
			expect(avatar2dManager.getState().live2d.activeExpressions).toEqual(['base-smile']),
		);
		avatar2dManager.setLive2dExpressions([]);
	});

	it('saves changed automatic reaction mappings to the signed-in account', async () => {
		vi.spyOn(useAvatarModule, 'useAvatar').mockReturnValue({
			...defaultMockAvatar,
			activeSoftware: 'vrm',
		} as unknown as ReturnType<typeof useAvatarModule.useAvatar>);

		render(<AvatarContainer />);
		await waitFor(() => expect(getSettingsMock).toHaveBeenCalled());
		fireEvent.click(screen.getByRole('button', { name: 'Guardar alegría' }));

		await waitFor(() =>
			expect(saveSettingsMock).toHaveBeenCalledWith(
				{ automatic_reaction_mappings: { 'vrm:happy': 'smile' }, automatic_reaction_scope: 'vrm' },
				{ token: 'account-token' },
			),
		);
	});

	it('does not show one account’s reaction mappings after switching accounts', async () => {
		getSettingsMock
			.mockResolvedValueOnce({ settings: { automatic_reaction_mappings: { happy: 'smile' } } })
			.mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						resolveNextAccountSettings = resolve;
					}),
			);
		vi.spyOn(useAvatarModule, 'useAvatar').mockReturnValue({
			...defaultMockAvatar,
			activeSoftware: 'vrm',
		} as unknown as ReturnType<typeof useAvatarModule.useAvatar>);

		const { rerender } = render(<AvatarContainer />);
		const expressionSelector = await screen.findByLabelText('Alegría');
		await waitFor(() => expect(expressionSelector).toHaveTextContent('smile'));

		useAuthMock.mockReturnValue({
			getToken: vi.fn().mockResolvedValue('account-b-token'),
			isLoaded: true,
			isSignedIn: true,
			userId: 'account-b',
		});
		rerender(<AvatarContainer />);
		await waitFor(() => expect(getSettingsMock).toHaveBeenCalledTimes(2));
		expect(expressionSelector).toHaveTextContent('');

		resolveNextAccountSettings({ settings: { automatic_reaction_mappings: { happy: 'frown' } } });
		await waitFor(() => expect(expressionSelector).toHaveTextContent('frown'));
	});

	it('AvatarContainer keeps automatic reaction selectors inside the studio dock', () => {
		vi.spyOn(useAvatarModule, 'useAvatar').mockReturnValue({
			...defaultMockAvatar,
			activeSoftware: 'pngtuber',
		} as unknown as ReturnType<typeof useAvatarModule.useAvatar>);

		render(<AvatarContainer />);

		expect(screen.queryByRole('combobox', { name: 'Sorpresa' })).not.toBeInTheDocument();
	});

	it('AvatarContainer renders dedicated PNGTuber workspace and isolates it from Live2D', () => {
		vi.spyOn(useAvatarModule, 'useAvatar').mockReturnValue({
			...defaultMockAvatar,
			activeSoftware: 'pngtuber',
		} as unknown as ReturnType<typeof useAvatarModule.useAvatar>);

		render(<AvatarContainer />);

		expect(screen.getByTestId('avatar-2d-pngtuber')).toBeInTheDocument();
		expect(screen.queryByTestId('avatar-2d-live2d')).not.toBeInTheDocument();
		expect(screen.queryByTestId('vrm-canvas')).not.toBeInTheDocument();
	});

	it('AvatarContainer renders dedicated Live2D workspace and isolates it from PNGTuber', () => {
		vi.spyOn(useAvatarModule, 'useAvatar').mockReturnValue({
			...defaultMockAvatar,
			activeSoftware: 'live2d',
		} as unknown as ReturnType<typeof useAvatarModule.useAvatar>);

		render(<AvatarContainer />);

		expect(screen.getByTestId('avatar-2d-live2d')).toBeInTheDocument();
		expect(screen.queryByTestId('avatar-2d-pngtuber')).not.toBeInTheDocument();
		expect(screen.queryByTestId('vrm-canvas')).not.toBeInTheDocument();
	});
});
