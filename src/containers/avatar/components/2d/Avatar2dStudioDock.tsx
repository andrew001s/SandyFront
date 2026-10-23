'use client';

import { Button } from '@/components/ui/button';
import type { Avatar2dActiveTool } from '@/lib/avatar2d/types';
import { Eye, EyeOff, Maximize2, Mic, Minimize2, Paintbrush, Sliders, Smile } from 'lucide-react';

interface Props {
	activeTool: Avatar2dActiveTool;
	onToggleTool: (tool: Avatar2dActiveTool) => void;
	isPlayingAudio: boolean;
	isFullscreen: boolean;
	onToggleFullscreen: () => void;
	isHudVisible: boolean;
	onToggleHud: () => void;
	hasCustomBackground: boolean;
}

export function Avatar2dStudioDock({
	activeTool,
	onToggleTool,
	isPlayingAudio,
	isFullscreen,
	onToggleFullscreen,
	isHudVisible,
	onToggleHud,
	hasCustomBackground,
}: Props) {
	const handleToolClick = (tool: Avatar2dActiveTool) => {
		onToggleTool(activeTool === tool ? null : tool);
	};

	return (
		<div className='pointer-events-auto absolute top-4 left-4 z-30 flex select-none flex-col items-center gap-2'>
			{/* Dock Vertical Principal */}
			<div className='flex flex-col items-center gap-1.5 rounded-2xl border border-border/80 bg-background/85 p-1.5 shadow-2xl backdrop-blur-xl'>
				{/* 1. Panel de Expresiones y Estados */}
				<Button
					variant={activeTool === 'emotions' ? 'default' : 'ghost'}
					size='icon'
					onClick={() => handleToolClick('emotions')}
					className={`size-10 rounded-xl transition-all ${
						activeTool === 'emotions'
							? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
							: 'text-muted-foreground hover:bg-muted hover:text-foreground'
					}`}
					title='Expresiones y Emociones'
				>
					<Smile className='size-5' />
				</Button>

				{/* 2. Panel de Lip Sync y Prueba de Voz TTS */}
				<Button
					variant={activeTool === 'lipsync' ? 'default' : 'ghost'}
					size='icon'
					onClick={() => handleToolClick('lipsync')}
					className={`relative size-10 rounded-xl transition-all ${
						activeTool === 'lipsync'
							? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
							: 'text-muted-foreground hover:bg-muted hover:text-foreground'
					}`}
					title='Prueba de Lip Sync y Voz Edge TTS'
				>
					<Mic className='size-5' />
					{isPlayingAudio && (
						<span className='absolute top-1.5 right-1.5 size-2 animate-ping rounded-full bg-emerald-400' />
					)}
				</Button>

				{/* 3. Panel de Fondo (Croma Verde OBS / Imagen / Color) */}
				<Button
					variant={activeTool === 'background' ? 'default' : 'ghost'}
					size='icon'
					onClick={() => handleToolClick('background')}
					className={`relative size-10 rounded-xl transition-all ${
						activeTool === 'background'
							? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
							: 'text-muted-foreground hover:bg-muted hover:text-foreground'
					}`}
					title='Fondo del Estudio (Croma OBS, Transparente, Imagen)'
				>
					<Paintbrush className='size-5' />
					{hasCustomBackground && (
						<span className='absolute top-1.5 right-1.5 size-2 rounded-full bg-cyan-400' />
					)}
				</Button>

				{/* 4. Panel de Ajustes 2D / Física y Sprites */}
				<Button
					variant={activeTool === 'settings' ? 'default' : 'ghost'}
					size='icon'
					onClick={() => handleToolClick('settings')}
					className={`size-10 rounded-xl transition-all ${
						activeTool === 'settings'
							? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
							: 'text-muted-foreground hover:bg-muted hover:text-foreground'
					}`}
					title='Ajustes 2D (Modo PNGTuber/Live2D, Física de rebote, Sprites)'
				>
					<Sliders className='size-5' />
				</Button>

				<div className='my-0.5 h-px w-6 bg-border/60' />

				{/* 5. Pantalla Completa Nativa */}
				<Button
					variant='ghost'
					size='icon'
					onClick={onToggleFullscreen}
					className='size-10 rounded-xl text-muted-foreground transition-all hover:bg-muted hover:text-foreground'
					title={isFullscreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa'}
				>
					{isFullscreen ? <Minimize2 className='size-4.5' /> : <Maximize2 className='size-4.5' />}
				</Button>

				{/* 6. Ocultar / Mostrar Interfaz (Modo Limpio) */}
				<Button
					variant='ghost'
					size='icon'
					onClick={onToggleHud}
					className='size-10 rounded-xl text-muted-foreground transition-all hover:bg-muted hover:text-foreground'
					title={isHudVisible ? 'Ocultar controles (HUD)' : 'Mostrar controles (HUD)'}
				>
					{isHudVisible ? (
						<Eye className='size-4.5' />
					) : (
						<EyeOff className='size-4.5 text-primary' />
					)}
				</Button>
			</div>
		</div>
	);
}
