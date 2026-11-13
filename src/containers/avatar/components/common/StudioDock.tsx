'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useServiceStatus } from '@/hooks/useServiceStatus';
import {
	Box,
	Camera,
	Eye,
	EyeOff,
	type LucideIcon,
	Maximize2,
	Mic,
	Minimize2,
	Palette,
	Power,
	SlidersHorizontal,
	Smile,
	Sparkles,
	Waves,
	Wind,
	Zap,
} from 'lucide-react';
import { DropdownMenu } from 'radix-ui';
import type { ReactElement } from 'react';

export type StudioAvatarMode = 'vrm' | 'pngtuber' | 'live2d';
export type StudioActiveTool =
	| 'expressions'
	| 'automaticReactions'
	| 'emotions'
	| 'lipsync'
	| 'background'
	| 'camera'
	| 'model'
	| 'idle'
	| 'triggers'
	| 'settings'
	| 'microphone'
	| 'services'
	| 'features'
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
	serviceControlsOnly?: boolean;
}

type Tool = { id: NonNullable<StudioActiveTool>; label: string; icon: LucideIcon };
function DockTooltip({
	label,
	side,
	children,
}: { label: string; side: 'left' | 'right' | 'top'; children: ReactElement }) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>{children}</TooltipTrigger>
			<TooltipContent side={side} className='pointer-events-none'>
				{label}
			</TooltipContent>
		</Tooltip>
	);
}

export function StudioDock({
	mode,
	activeTool,
	onToggleTool,
	isFullscreen,
	onToggleFullscreen,
	isHudVisible,
	onToggleHud,
	hasCustomBackground,
	position = 'right',
	className = '',
	serviceControlsOnly = false,
}: StudioDockProps) {
	const { serviceStatus } = useServiceStatus();
	const isMobile = useMediaQuery('(max-width: 767px)');
	const side = isMobile ? 'top' : position === 'left' ? 'right' : 'left';
	const posClass =
		position === 'left'
			? 'bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 right-3 md:top-4 md:right-auto md:bottom-4 md:left-4 md:my-auto'
			: 'bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 right-3 md:top-4 md:right-4 md:bottom-4 md:left-auto md:my-auto';
	const buttonClass = (active: boolean) =>
		`relative flex size-11 shrink-0 items-center justify-center rounded-xl border transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[-2px] ${active ? 'border-primary/50 bg-primary/15 text-primary' : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'}`;
	const toggle = (tool: NonNullable<StudioActiveTool>) =>
		onToggleTool(
			activeTool === tool || (tool === 'expressions' && activeTool === 'emotions') ? null : tool,
		);
	const avatarTools: Tool[] = [{ id: 'expressions', label: 'Expresiones manuales', icon: Smile }];
	if (mode === 'vrm')
		avatarTools.push(
			{ id: 'model', label: 'Avatar VRM', icon: Box },
			{ id: 'idle', label: 'Idle del avatar', icon: Wind },
			{ id: 'triggers', label: 'Nodos activables', icon: Zap },
		);
	else
		avatarTools.push({
			id: 'settings',
			label: mode === 'pngtuber' ? 'Ajustes PNGTuber' : 'Ajustes Live2D',
			icon: Box,
		});
	const groups: {
		label: string;
		tourId: string;
		icon: LucideIcon;
		tools: Tool[];
		indicator?: string;
	}[] = [
		{ label: 'Avatar', tourId: 'studio-tour-avatar', icon: Smile, tools: avatarTools },
		{
			label: 'Escenario',
			tourId: 'studio-tour-scene',
			icon: Palette,
			tools: [
				{ id: 'background', label: 'Fondo y Escenario', icon: Palette },
				{ id: 'camera', label: 'Cámara y Encuadre', icon: Camera },
			],
			indicator: hasCustomBackground ? 'bg-primary' : undefined,
		},
		{
			label: 'Opciones avanzadas',
			tourId: 'studio-tour-controls',
			icon: SlidersHorizontal,
			tools: [
				{ id: 'lipsync', label: 'Prueba de lip sync y voz', icon: Waves },
				{ id: 'features', label: 'Funciones del dashboard', icon: SlidersHorizontal },
			],
		},
	];
	if (!isHudVisible)
		return (
			<div className={`pointer-events-auto absolute ${posClass} z-30 h-fit w-fit ${className}`}>
				<DockTooltip label='Mostrar controles de estudio' side={side}>
					<button
						type='button'
						onClick={onToggleHud}
						className={`${buttonClass(false)} border-border bg-background`}
						aria-label='Mostrar controles de estudio'
					>
						<Eye className='size-4' />
					</button>
				</DockTooltip>
			</div>
		);
	return (
		<div
			id='studio-tour-dock'
			className={`pointer-events-auto absolute ${posClass} z-30 flex min-h-0 select-none items-center gap-1 rounded-2xl border border-border/80 bg-background p-1.5 shadow-lg md:h-fit md:max-h-[calc(100%-2rem)] md:w-[4.25rem] md:flex-col ${className}`}
		>
			<div className='flex shrink-0 items-center gap-1 md:w-full md:flex-col'>
				{(
					[
						{
							id: 'services',
							label: 'Servicio de emisión',
							icon: Power,
							tourId: 'studio-tour-services',
						},
						{
							id: 'microphone',
							label: 'Hablar con la VTuber',
							icon: Mic,
							tourId: 'studio-tour-voice',
						},
					] as const
				).map((tool) => (
					<DockTooltip key={tool.id} label={tool.label} side={side}>
						<button
							id={tool.tourId}
							type='button'
							aria-label={tool.label}
							aria-pressed={activeTool === tool.id}
							onClick={() => toggle(tool.id)}
							className={buttonClass(activeTool === tool.id)}
						>
							<tool.icon className='size-4.5' />
							{tool.id === 'services' && serviceStatus?.running && (
								<span
									aria-hidden='true'
									className={`absolute top-1 right-1 size-2 rounded-full ${tool.id === 'services' ? 'bg-emerald-400' : 'bg-secondary'}`}
								/>
							)}
						</button>
					</DockTooltip>
				))}
			</div>
			<div className='flex min-h-0 min-w-0 flex-1 items-center gap-1 overflow-x-auto overscroll-contain [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] md:w-full md:flex-auto md:flex-col md:overflow-y-auto md:overflow-x-hidden [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar]:size-1'>
				{groups
					.filter((group) => !serviceControlsOnly || group.tourId === 'studio-tour-controls')
					.map((group) => (
						<DropdownMenu.Root key={group.label} modal={false}>
							<DockTooltip label={group.label} side={side}>
								<DropdownMenu.Trigger asChild>
									<button
										id={group.tourId}
										type='button'
										aria-label={group.label}
										className={buttonClass(
											group.tools.some((tool) => activeTool === tool.id) ||
												(group.label === 'Avatar' && activeTool === 'emotions'),
										)}
									>
										<group.icon className='size-4.5' />
										{group.indicator && (
											<span
												aria-hidden='true'
												className={`absolute top-1 right-1 size-2 rounded-full ${group.indicator}`}
											/>
										)}
									</button>
								</DropdownMenu.Trigger>
							</DockTooltip>
							<DropdownMenu.Portal>
								<DropdownMenu.Content
									side={side}
									sideOffset={12}
									collisionPadding={12}
									className='z-50 min-w-52 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg'
								>
									<DropdownMenu.Label className='px-3 py-2 font-semibold text-sm'>
										{group.label}
									</DropdownMenu.Label>
									{group.tools
										.filter((tool) => !serviceControlsOnly || tool.id === 'features')
										.map((tool) => (
											<DropdownMenu.Item
												key={tool.id}
												onSelect={() => toggle(tool.id)}
												className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none focus:bg-muted ${activeTool === tool.id ? 'bg-primary/10 text-primary' : ''}`}
											>
												<tool.icon className='size-4' />
												<span>{tool.label}</span>
											</DropdownMenu.Item>
										))}
								</DropdownMenu.Content>
							</DropdownMenu.Portal>
						</DropdownMenu.Root>
					))}
				{!serviceControlsOnly && (
					<DockTooltip label='Reacciones automáticas' side={side}>
						<button
							id='studio-tour-reactions'
							type='button'
							onClick={() => toggle('automaticReactions')}
							aria-label='Reacciones automáticas'
							aria-pressed={activeTool === 'automaticReactions'}
							className={buttonClass(activeTool === 'automaticReactions')}
						>
							<Sparkles className='size-4.5' />
						</button>
					</DockTooltip>
				)}
			</div>
			<div className='h-6 w-px shrink-0 bg-border/70 md:h-px md:w-6' />
			<div className='flex shrink-0 items-center gap-1 md:flex-col'>
				<DockTooltip
					label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
					side={side}
				>
					<button
						type='button'
						onClick={onToggleFullscreen}
						aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
						className={buttonClass(isFullscreen)}
					>
						{isFullscreen ? <Minimize2 className='size-4' /> : <Maximize2 className='size-4' />}
					</button>
				</DockTooltip>
				<DockTooltip label='Ocultar interfaz gráfica' side={side}>
					<button
						type='button'
						onClick={onToggleHud}
						aria-label='Ocultar interfaz gráfica'
						className={buttonClass(false)}
					>
						<EyeOff className='size-4' />
					</button>
				</DockTooltip>
			</div>
		</div>
	);
}
