import * as useAvatarModule from '@/hooks/useAvatar';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AvatarContainer } from './AvatarContainer';

vi.mock('@/containers/avatar/components/VrmCanvas', () => ({
	VrmCanvas: () => <div data-testid='vrm-canvas'>3D VRM Canvas</div>,
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
