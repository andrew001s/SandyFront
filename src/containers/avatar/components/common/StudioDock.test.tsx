import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StudioDock, type StudioDockProps } from './StudioDock';

vi.mock('@/hooks/useMediaQuery', () => ({ useMediaQuery: () => false }));

vi.mock('@/hooks/useServiceStatus', () => ({
	useServiceStatus: () => ({ serviceStatus: null, hasLoaded: true, hasError: false }),
}));

const props = (): StudioDockProps => ({
	mode: 'vrm',
	activeTool: null,
	onToggleTool: vi.fn(),
	isPlayingAudio: false,
	isFullscreen: false,
	onToggleFullscreen: vi.fn(),
	isHudVisible: true,
	onToggleHud: vi.fn(),
	hasCustomBackground: false,
});
const openGroup = (name: string) =>
	fireEvent.keyDown(screen.getByRole('button', { name }), { key: 'ArrowDown' });

describe('StudioDock', () => {
	it('shows eight top-level controls while keeping the emission actions reachable', () => {
		render(<StudioDock {...props()} />);
		expect(screen.getAllByRole('button')).toHaveLength(8);
		for (const name of [
			'Avatar',
			'Servicio de emisión',
			'Hablar con la VTuber',
			'Escenario',
			'Opciones avanzadas',
			'Reacciones automáticas',
			'Pantalla completa',
			'Ocultar interfaz gráfica',
		])
			expect(screen.getByRole('button', { name })).toBeInTheDocument();
	});
	it.each(['vrm', 'pngtuber', 'live2d'] as const)(
		'retains the avatar tools available for %s',
		(mode) => {
			const dock = props();
			render(<StudioDock {...dock} mode={mode} />);
			openGroup('Avatar');
			expect(screen.getByRole('menuitem', { name: 'Expresiones manuales' })).toBeInTheDocument();
			expect(
				screen.getByRole('menuitem', {
					name:
						mode === 'vrm'
							? 'Avatar VRM'
							: mode === 'pngtuber'
								? 'Ajustes PNGTuber'
								: 'Ajustes Live2D',
				}),
			).toBeInTheDocument();
			if (mode === 'vrm') {
				expect(screen.getByRole('menuitem', { name: 'Idle del avatar' })).toBeInTheDocument();
				expect(screen.getByRole('menuitem', { name: 'Nodos activables' })).toBeInTheDocument();
			}
			fireEvent.click(screen.getByRole('menuitem', { name: 'Expresiones manuales' }));
			expect(dock.onToggleTool).toHaveBeenCalledWith('expressions');
		},
	);
	it.each([
		['Opciones avanzadas', 'Prueba de lip sync y voz', 'lipsync'],
		['Escenario', 'Fondo y Escenario', 'background'],
		['Escenario', 'Cámara y Encuadre', 'camera'],
		['Opciones avanzadas', 'Funciones del dashboard', 'features'],
	])('opens %s and dispatches %s', (group, name, tool) => {
		const dock = props();
		render(<StudioDock {...dock} />);
		openGroup(group);
		fireEvent.click(screen.getByRole('menuitem', { name }));
		expect(dock.onToggleTool).toHaveBeenCalledWith(tool);
	});
	it('keeps emission and microphone as direct actions in every format', () => {
		const dock = props();
		render(<StudioDock {...dock} />);
		fireEvent.click(screen.getByRole('button', { name: 'Servicio de emisión' }));
		expect(dock.onToggleTool).toHaveBeenCalledWith('services');
		fireEvent.click(screen.getByRole('button', { name: 'Hablar con la VTuber' }));
		expect(dock.onToggleTool).toHaveBeenCalledWith('microphone');
	});
	it('toggles the active tool off from its group', () => {
		const dock = props();
		render(<StudioDock {...dock} activeTool='expressions' />);
		openGroup('Avatar');
		fireEvent.click(screen.getByRole('menuitem', { name: 'Expresiones manuales' }));
		expect(dock.onToggleTool).toHaveBeenCalledWith(null);
	});
	it('keeps automatic reactions and fullscreen as direct actions', () => {
		const dock = props();
		render(<StudioDock {...dock} />);
		fireEvent.click(screen.getByRole('button', { name: 'Reacciones automáticas' }));
		expect(dock.onToggleTool).toHaveBeenCalledWith('automaticReactions');
		fireEvent.click(screen.getByRole('button', { name: 'Pantalla completa' }));
		expect(dock.onToggleFullscreen).toHaveBeenCalledOnce();
	});
	it('restores the hidden HUD', () => {
		const dock = props();
		render(<StudioDock {...dock} isHudVisible={false} />);
		expect(screen.queryByRole('button', { name: 'Avatar' })).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Mostrar controles de estudio' }));
		expect(dock.onToggleHud).toHaveBeenCalledOnce();
	});
});
