'use client';

import { Box, Camera, Eye, EyeOff, Maximize2, Mic, Minimize2, Palette, Smile } from 'lucide-react';

export type VrmActiveTool = 'expressions' | 'lipsync' | 'background' | 'camera' | 'model' | null;

interface Props {
	activeTool: VrmActiveTool;
	onToggleTool: (tool: VrmActiveTool) => void;
	isPlayingAudio: boolean;
	isFullscreen: boolean;
	onToggleFullscreen: () => void;
	isHudVisible: boolean;
	onToggleHud: () => void;
	hasCustomBackground: boolean;
}

export function VrmStudioDock({
	activeTool,
	onToggleTool,
	isPlayingAudio,
	isFullscreen,
	onToggleFullscreen,
	isHudVisible,
	onToggleHud,
	hasCustomBackground,
}: Props) {
	if (!isHudVisible) {
		return (
			<div className='absolute top-4 right-4 z-30'>
				<button
					type='button'
					onClick={onToggleHud}
					className='flex size-9 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground shadow-lg backdrop-blur-md transition-all hover:bg-card hover:text-foreground'
					title='Mostrar controles de estudio'
				>
					<Eye className='size-4' />
				</button>
			</div>
		);
	}

	const tools = [
		{
			id: 'expressions' as const,
			label: 'Expresiones',
			icon: Smile,
			activeColor: 'text-secondary bg-secondary/20 border-secondary/50',
			badge: null,
		},
		{
			id: 'lipsync' as const,
			label: 'Lip Sync & Voz',
			icon: Mic,
			activeColor: 'text-primary bg-primary/20 border-primary/50',
			badge: isPlayingAudio ? (
				<span className='-top-0.5 -right-0.5 absolute flex size-2.5'>
					<span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75' />
					<span className='relative inline-flex size-2.5 rounded-full bg-primary' />
				</span>
			) : null,
		},
		{
			id: 'background' as const,
			label: 'Fondo y Escenario',
			icon: Palette,
			activeColor: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/50',
			badge: hasCustomBackground ? (
				<span className='-top-0.5 -right-0.5 absolute size-2 rounded-full bg-emerald-400' />
			) : null,
		},
		{
			id: 'camera' as const,
			label: 'Cámara y Encuadre',
			icon: Camera,
			activeColor: 'text-amber-400 bg-amber-500/20 border-amber-500/50',
			badge: null,
		},
		{
			id: 'model' as const,
			label: 'Avatar VRM',
			icon: Box,
			activeColor: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/50',
			badge: null,
		},
	];

	return (
		<div className='absolute top-4 right-4 z-30 flex flex-col items-center gap-2'>
			{/* Barra vertical icónica estilo VTube Studio */}
			<div className='flex flex-col items-center gap-1.5 rounded-2xl border border-border/80 bg-background/85 p-1.5 shadow-2xl backdrop-blur-xl'>
				{tools.map((t) => {
					const isActive = activeTool === t.id;
					const Icon = t.icon;
					return (
						<button
							key={t.id}
							type='button'
							onClick={() => onToggleTool(isActive ? null : t.id)}
							className={`relative flex size-9.5 items-center justify-center rounded-xl border transition-all sm:size-10 ${
								isActive
									? `${t.activeColor} scale-105 shadow-md ring-1 ring-border/50`
									: 'border-transparent text-muted-foreground hover:border-border/60 hover:bg-card/70 hover:text-foreground'
							}`}
							title={t.label}
						>
							<Icon className='size-4.5' />
							{t.badge}
						</button>
					);
				})}

				<div className='my-0.5 h-px w-6 bg-border/70' />

				{/* Pantalla Completa (Fullscreen) */}
				<button
					type='button'
					onClick={onToggleFullscreen}
					className={`flex size-9.5 items-center justify-center rounded-xl border transition-all sm:size-10 ${
						isFullscreen
							? 'border-primary/50 bg-primary/20 text-primary shadow-xs'
							: 'border-transparent text-muted-foreground hover:border-border/60 hover:bg-card/70 hover:text-foreground'
					}`}
					title={
						isFullscreen ? 'Salir de pantalla completa (Esc)' : 'Pantalla completa (Fullscreen)'
					}
				>
					{isFullscreen ? <Minimize2 className='size-4' /> : <Maximize2 className='size-4' />}
				</button>

				{/* Ocultar interfaz */}
				<button
					type='button'
					onClick={onToggleHud}
					className='flex size-9.5 items-center justify-center rounded-xl border border-transparent text-muted-foreground transition-all hover:border-border/60 hover:bg-card/70 hover:text-foreground sm:size-10'
					title='Ocultar interfaz gráfica'
				>
					<EyeOff className='size-4' />
				</button>
			</div>
		</div>
	);
}
