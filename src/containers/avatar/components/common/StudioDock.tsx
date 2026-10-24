'use client';

import { Box, Camera, Eye, EyeOff, Maximize2, Mic, Minimize2, Palette, Smile } from 'lucide-react';

export type StudioAvatarMode = 'vrm' | 'pngtuber' | 'live2d';

export type StudioActiveTool =
	| 'expressions'
	| 'emotions'
	| 'lipsync'
	| 'background'
	| 'camera'
	| 'model'
	| 'settings'
	| null;

export interface StudioDockProps {
	mode: StudioAvatarMode;
	activeTool: string | null;
	onToggleTool: (tool: StudioActiveTool) => void;
	isPlayingAudio: boolean;
	isFullscreen: boolean;
	onToggleFullscreen: () => void;
	isHudVisible: boolean;
	onToggleHud: () => void;
	hasCustomBackground: boolean;
	position?: 'left' | 'right';
	className?: string;
}

export function StudioDock({
	mode,
	activeTool,
	onToggleTool,
	isPlayingAudio,
	isFullscreen,
	onToggleFullscreen,
	isHudVisible,
	onToggleHud,
	hasCustomBackground,
	position = 'right',
	className = '',
}: StudioDockProps) {
	const posClass = position === 'left' ? 'top-4 left-4' : 'top-4 right-4';

	if (!isHudVisible) {
		return (
			<div className={`pointer-events-auto absolute ${posClass} z-30 ${className}`}>
				<button
					type='button'
					onClick={onToggleHud}
					className='flex size-9.5 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground shadow-lg backdrop-blur-md transition-all hover:bg-card hover:text-foreground sm:size-10'
					title='Mostrar controles de estudio'
					aria-label='Mostrar controles de estudio'
				>
					<Eye className='size-4' />
				</button>
			</div>
		);
	}

	return (
		<div
			className={`pointer-events-auto absolute ${posClass} z-30 flex select-none flex-col items-center gap-2 ${className}`}
		>
			<div className='flex flex-col items-center gap-1.5 rounded-2xl border border-border/80 bg-background/85 p-1.5 shadow-2xl backdrop-blur-xl'>
				{/* 1. Expresiones */}
				<button
					type='button'
					onClick={() =>
						onToggleTool(
							activeTool === 'expressions' || activeTool === 'emotions' ? null : 'expressions',
						)
					}
					className={`relative flex size-9.5 items-center justify-center rounded-xl border transition-all sm:size-10 ${
						activeTool === 'expressions' || activeTool === 'emotions'
							? 'scale-105 border-secondary/50 bg-secondary/20 text-secondary shadow-md ring-1 ring-border/50'
							: 'border-transparent text-muted-foreground hover:border-border/60 hover:bg-card/70 hover:text-foreground'
					}`}
					title='Expresiones'
					aria-label='Expresiones'
				>
					<Smile className='size-4.5' />
				</button>

				{/* 2. Lip Sync & Voz */}
				<button
					type='button'
					onClick={() => onToggleTool(activeTool === 'lipsync' ? null : 'lipsync')}
					className={`relative flex size-9.5 items-center justify-center rounded-xl border transition-all sm:size-10 ${
						activeTool === 'lipsync'
							? 'scale-105 border-primary/50 bg-primary/20 text-primary shadow-md ring-1 ring-border/50'
							: 'border-transparent text-muted-foreground hover:border-border/60 hover:bg-card/70 hover:text-foreground'
					}`}
					title='Lip Sync & Voz'
					aria-label='Lip Sync & Voz'
				>
					<Mic className='size-4.5' />
					{isPlayingAudio && (
						<span className='-top-0.5 -right-0.5 absolute flex size-2.5'>
							<span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75' />
							<span className='relative inline-flex size-2.5 rounded-full bg-primary' />
						</span>
					)}
				</button>

				{/* 3. Fondo */}
				<button
					type='button'
					onClick={() => onToggleTool(activeTool === 'background' ? null : 'background')}
					className={`relative flex size-9.5 items-center justify-center rounded-xl border transition-all sm:size-10 ${
						activeTool === 'background'
							? 'scale-105 border-emerald-500/50 bg-emerald-500/20 text-emerald-400 shadow-md ring-1 ring-border/50'
							: 'border-transparent text-muted-foreground hover:border-border/60 hover:bg-card/70 hover:text-foreground'
					}`}
					title='Fondo y Escenario'
					aria-label='Fondo y Escenario'
				>
					<Palette className='size-4.5' />
					{hasCustomBackground && (
						<span className='-top-0.5 -right-0.5 absolute size-2 rounded-full bg-emerald-400' />
					)}
				</button>

				{/* 4. Cámara y Encuadre (Disponible en 3D, PNGTuber y Live2D) */}
				<button
					type='button'
					onClick={() => onToggleTool(activeTool === 'camera' ? null : 'camera')}
					className={`relative flex size-9.5 items-center justify-center rounded-xl border transition-all sm:size-10 ${
						activeTool === 'camera'
							? 'scale-105 border-amber-500/50 bg-amber-500/20 text-amber-400 shadow-md ring-1 ring-border/50'
							: 'border-transparent text-muted-foreground hover:border-border/60 hover:bg-card/70 hover:text-foreground'
					}`}
					title='Cámara y Encuadre'
					aria-label='Cámara y Encuadre'
				>
					<Camera className='size-4.5' />
				</button>

				{/* Herramientas específicas 3D VRM */}
				{mode === 'vrm' && (
					<button
						type='button'
						onClick={() => onToggleTool(activeTool === 'model' ? null : 'model')}
						className={`relative flex size-9.5 items-center justify-center rounded-xl border transition-all sm:size-10 ${
							activeTool === 'model'
								? 'scale-105 border-cyan-500/50 bg-cyan-500/20 text-cyan-400 shadow-md ring-1 ring-border/50'
								: 'border-transparent text-muted-foreground hover:border-border/60 hover:bg-card/70 hover:text-foreground'
						}`}
						title='Avatar VRM'
						aria-label='Avatar VRM'
					>
						<Box className='size-4.5' />
					</button>
				)}

				{/* Herramientas específicas PNGTuber */}
				{mode === 'pngtuber' && (
					<button
						type='button'
						onClick={() => onToggleTool(activeTool === 'settings' ? null : 'settings')}
						className={`relative flex size-9.5 items-center justify-center rounded-xl border transition-all sm:size-10 ${
							activeTool === 'settings'
								? 'scale-105 border-primary/50 bg-primary/20 text-primary shadow-md ring-1 ring-border/50'
								: 'border-transparent text-muted-foreground hover:border-border/60 hover:bg-card/70 hover:text-foreground'
						}`}
						title='Ajustes PNGTuber'
						aria-label='Ajustes PNGTuber'
					>
						<Box className='size-4.5' />
					</button>
				)}

				{/* Herramientas específicas Live2D */}
				{mode === 'live2d' && (
					<button
						type='button'
						onClick={() => onToggleTool(activeTool === 'settings' ? null : 'settings')}
						className={`relative flex size-9.5 items-center justify-center rounded-xl border transition-all sm:size-10 ${
							activeTool === 'settings'
								? 'scale-105 border-cyan-500/50 bg-cyan-500/20 text-cyan-400 shadow-md ring-1 ring-border/50'
								: 'border-transparent text-muted-foreground hover:border-border/60 hover:bg-card/70 hover:text-foreground'
						}`}
						title='Ajustes Live2D'
						aria-label='Ajustes Live2D'
					>
						<Box className='size-4.5' />
					</button>
				)}

				<div className='my-0.5 h-px w-6 bg-border/70' />

				{/* Pantalla Completa */}
				<button
					type='button'
					onClick={onToggleFullscreen}
					className={`flex size-9.5 items-center justify-center rounded-xl border transition-all sm:size-10 ${
						isFullscreen
							? 'border-primary/50 bg-primary/20 text-primary shadow-xs'
							: 'border-transparent text-muted-foreground hover:border-border/60 hover:bg-card/70 hover:text-foreground'
					}`}
					title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
					aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
				>
					{isFullscreen ? <Minimize2 className='size-4' /> : <Maximize2 className='size-4' />}
				</button>

				{/* Ocultar interfaz */}
				<button
					type='button'
					onClick={onToggleHud}
					className='flex size-9.5 items-center justify-center rounded-xl border border-transparent text-muted-foreground transition-all hover:border-border/60 hover:bg-card/70 hover:text-foreground sm:size-10'
					title='Ocultar interfaz gráfica'
					aria-label='Ocultar interfaz gráfica'
				>
					<EyeOff className='size-4' />
				</button>
			</div>
		</div>
	);
}
