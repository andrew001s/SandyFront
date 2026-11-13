import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AvatarContainer } from './AvatarContainer';

const connection = vi.hoisted(() => ({
	connected: false,
	connecting: false,
	error: null,
	stats: null,
	models: [],
	currentModel: null as null | {
		modelLoaded: boolean;
		modelID: string;
		modelName: string;
		modelPosition: { positionX: number; positionY: number; rotation: number; size: number };
	},
	folderInfo: null,
	hotkeys: [],
	expressions: [],
	connect: vi.fn(async () => undefined),
	disconnect: vi.fn(async () => undefined),
	loadModel: vi.fn(),
	refreshModels: vi.fn(),
	moveModel: vi.fn(),
	triggerHotkey: vi.fn(),
	setExpressionActive: vi.fn(),
	injectParameters: vi.fn(),
	activateExpression: vi.fn(),
}));
vi.mock('@/hooks/useVTubeStudio', () => ({ useVTubeStudio: () => connection }));
vi.mock('@clerk/nextjs', () => ({ useAuth: () => ({ isLoaded: false }) }));
vi.mock('@/components/ui/sidebar', () => ({ SidebarTrigger: () => null }));
vi.mock('@/containers/dashboard/DashboardActions', () => ({ DashboardActions: () => null }));
vi.mock('@/context/ExpressionHotkeysContext', () => ({ useExpressionHotkeysContext: () => null }));
vi.mock('@/hooks/useExpressionHotkeys', () => ({ useExpressionHotkeys: vi.fn() }));
vi.mock('@/hooks/useVrmExpressions', () => ({ useVrmExpressions: () => [] }));
vi.mock('@/hooks/useModelPreviews', () => ({
	useModelPreviews: () => ({ status: 'unsupported', urls: {}, requestAccess: vi.fn() }),
}));
vi.mock('@/containers/avatar/components/2d/Avatar2dCanvas', () => ({
	Avatar2dCanvas: ({ externalContent }: { externalContent?: import('react').ReactNode }) =>
		externalContent ?? <div>Escenario del navegador</div>,
}));
vi.mock('@/containers/avatar/components/VrmCanvas', () => ({ VrmCanvas: () => null }));
vi.mock('@/containers/avatar/LipSyncTest', () => ({
	LipSyncTest: () => <div>Herramienta de prueba de lipsync</div>,
}));

describe('VTube Studio desktop panel in Live2D', () => {
	beforeEach(() => {
		localStorage.clear();
		localStorage.setItem('sandy_avatar_software', 'live2d');
		connection.connected = false;
		connection.currentModel = null;
		vi.clearAllMocks();
	});
	it('shows the real desktop state and port instead of the browser avatar state', () => {
		render(<AvatarContainer />);
		fireEvent.click(screen.getByRole('button', { name: 'Conectar VTube Studio' }));
		expect(screen.getByText('Desconectado')).toBeInTheDocument();
		expect(screen.getByRole('spinbutton', { name: 'Puerto API' })).toHaveValue(8001);
		expect(screen.queryByRole('button', { name: 'Desconectar' })).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Conectar a VTS' }));
		expect(connection.connect).toHaveBeenCalledWith(8001);
		expect(screen.queryByText('Herramienta de prueba de lipsync')).not.toBeInTheDocument();
	});

	it('disconnects the desktop client while Live2D remains the selected format', () => {
		connection.connected = true;
		render(<AvatarContainer />);
		fireEvent.click(screen.getByRole('button', { name: 'Desconectar' }));
		expect(connection.disconnect).toHaveBeenCalledOnce();
		expect(localStorage.getItem('sandy_avatar_software')).toBe('live2d');
	});

	it('keeps the voice test collapsed under advanced options when a model is loaded', () => {
		connection.connected = true;
		connection.currentModel = {
			modelLoaded: true,
			modelID: 'test',
			modelName: 'Modelo de prueba',
			modelPosition: { positionX: 0, positionY: 0, rotation: 0, size: 1 },
		};
		render(<AvatarContainer />);
		expect(screen.queryByText('Herramienta de prueba de lipsync')).not.toBeInTheDocument();
		const advanced = screen.getByRole('button', { name: /Opciones avanzadas/ });
		fireEvent.click(advanced);
		expect(advanced).toHaveAttribute('aria-expanded', 'true');
		expect(screen.getByText('Herramienta de prueba de lipsync')).toBeInTheDocument();
		fireEvent.click(advanced);
		expect(screen.queryByText('Herramienta de prueba de lipsync')).not.toBeInTheDocument();
	});

	it('replaces the local preview on connection and restores it after disconnecting', () => {
		const { rerender } = render(<AvatarContainer />);
		expect(screen.getByText('Escenario del navegador')).toBeInTheDocument();
		connection.connected = true;
		rerender(<AvatarContainer />);
		expect(screen.queryByText('Escenario del navegador')).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Desconectar' })).toBeInTheDocument();
		connection.connected = false;
		rerender(<AvatarContainer />);
		expect(screen.getByText('Escenario del navegador')).toBeInTheDocument();
		expect(localStorage.getItem('sandy_avatar_software')).toBe('live2d');
	});
});
