import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StudioDock } from './StudioDock';

describe('StudioDock', () => {
	it('StudioDock renders base dock container with common studio actions (expressions, lipsync, background, fullscreen, toggle HUD)', () => {
		render(
			<StudioDock
				mode='vrm'
				activeTool={null}
				onToggleTool={vi.fn()}
				isPlayingAudio={false}
				isFullscreen={false}
				onToggleFullscreen={vi.fn()}
				isHudVisible={true}
				onToggleHud={vi.fn()}
				hasCustomBackground={false}
			/>,
		);

		expect(screen.getByRole('button', { name: /expresiones/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /lip sync/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /fondo/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /pantalla completa/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /ocultar/i })).toBeInTheDocument();
	});

	it('StudioDock displays 3D-specific tools (camera and 3D model) when mode is vrm', () => {
		render(
			<StudioDock
				mode='vrm'
				activeTool={null}
				onToggleTool={vi.fn()}
				isPlayingAudio={false}
				isFullscreen={false}
				onToggleFullscreen={vi.fn()}
				isHudVisible={true}
				onToggleHud={vi.fn()}
				hasCustomBackground={false}
			/>,
		);

		expect(screen.getByRole('button', { name: /cámara/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /avatar vrm/i })).toBeInTheDocument();
	});

	it('StudioDock displays PNGTuber-specific tools (sprites and bounce settings) and camera when mode is pngtuber', () => {
		render(
			<StudioDock
				mode='pngtuber'
				activeTool={null}
				onToggleTool={vi.fn()}
				isPlayingAudio={false}
				isFullscreen={false}
				onToggleFullscreen={vi.fn()}
				isHudVisible={true}
				onToggleHud={vi.fn()}
				hasCustomBackground={false}
			/>,
		);

		expect(screen.getByRole('button', { name: /ajustes pngtuber/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /cámara/i })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /avatar vrm/i })).not.toBeInTheDocument();
	});

	it('StudioDock displays Live2D-specific tools (Live2D model and parameters) and camera when mode is live2d', () => {
		render(
			<StudioDock
				mode='live2d'
				activeTool={null}
				onToggleTool={vi.fn()}
				isPlayingAudio={false}
				isFullscreen={false}
				onToggleFullscreen={vi.fn()}
				isHudVisible={true}
				onToggleHud={vi.fn()}
				hasCustomBackground={false}
			/>,
		);

		expect(screen.getByRole('button', { name: /ajustes live2d/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /cámara/i })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /avatar vrm/i })).not.toBeInTheDocument();
	});

	it('StudioDock triggers onToggleTool with the clicked tool id and toggles off on re-click', () => {
		const onToggleTool = vi.fn();
		const { rerender } = render(
			<StudioDock
				mode='vrm'
				activeTool={null}
				onToggleTool={onToggleTool}
				isPlayingAudio={false}
				isFullscreen={false}
				onToggleFullscreen={vi.fn()}
				isHudVisible={true}
				onToggleHud={vi.fn()}
				hasCustomBackground={false}
			/>,
		);

		const expressionsBtn = screen.getByRole('button', { name: /expresiones/i });
		fireEvent.click(expressionsBtn);
		expect(onToggleTool).toHaveBeenCalledWith('expressions');

		// Re-render con activeTool activo
		rerender(
			<StudioDock
				mode='vrm'
				activeTool='expressions'
				onToggleTool={onToggleTool}
				isPlayingAudio={false}
				isFullscreen={false}
				onToggleFullscreen={vi.fn()}
				isHudVisible={true}
				onToggleHud={vi.fn()}
				hasCustomBackground={false}
			/>,
		);

		fireEvent.click(expressionsBtn);
		expect(onToggleTool).toHaveBeenCalledWith(null);
	});

	it('StudioDock renders only the discrete restore button when HUD is hidden and triggers onToggleHud on click', () => {
		const onToggleHud = vi.fn();
		render(
			<StudioDock
				mode='vrm'
				activeTool={null}
				onToggleTool={vi.fn()}
				isPlayingAudio={false}
				isFullscreen={false}
				onToggleFullscreen={vi.fn()}
				isHudVisible={false}
				onToggleHud={onToggleHud}
				hasCustomBackground={false}
			/>,
		);

		expect(screen.queryByRole('button', { name: /expresiones/i })).not.toBeInTheDocument();
		const restoreBtn = screen.getByRole('button', { name: /mostrar controles/i });
		expect(restoreBtn).toBeInTheDocument();

		fireEvent.click(restoreBtn);
		expect(onToggleHud).toHaveBeenCalledTimes(1);
	});
});
