'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { VTSStats } from '@/hooks/useVTubeStudio';
import { AVATAR_SOFTWARE_LIST } from '@/lib/avatar/constants';
import type { AvatarConnectionStats, AvatarSoftware, SoftwareConfig } from '@/types/avatar';
import { Box, HelpCircle, RefreshCw, Tv, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

type AvatarConnectionCardProps = {
	connecting: boolean;
	connected: boolean;
	error: string | null;
	stats?: (VTSStats | AvatarConnectionStats) | null;
	software?: AvatarSoftware;
	config?: SoftwareConfig;
	onConnect: (optionsOrPort?: number | { port?: number; host?: string }) => void | Promise<void>;
	onDisconnect: () => void | Promise<void>;
	onRefreshModels?: () => void | Promise<void>;
	onUpdateConfig?: (updates: Partial<SoftwareConfig>) => void;
};

export function AvatarConnectionCard({
	connecting,
	connected,
	error,
	stats,
	software = 'vtubestudio',
	config,
	onConnect,
	onDisconnect,
	onRefreshModels,
	onUpdateConfig,
}: AvatarConnectionCardProps) {
	const currentMeta =
		AVATAR_SOFTWARE_LIST.find((s) => s.id === software) ?? AVATAR_SOFTWARE_LIST[0];

	const [port, setPort] = useState(String(config?.port ?? currentMeta.defaultPort));
	const [host, setHost] = useState(config?.host ?? '127.0.0.1');
	const [transitionDuration, setTransitionDuration] = useState(
		String(config?.transitionDurationMs ?? 120),
	);
	const [showTips, setShowTips] = useState(false);

	useEffect(() => {
		const targetPort = config?.port ?? currentMeta.defaultPort;
		setPort(String(targetPort));
		setHost(config?.host ?? '127.0.0.1');
		setTransitionDuration(String(config?.transitionDurationMs ?? 120));
	}, [config, currentMeta]);

	const handlePortChange = (val: string) => {
		setPort(val);
		const num = Number(val);
		if (num > 0) {
			onUpdateConfig?.({ port: num });
		}
	};

	const handleHostChange = (val: string) => {
		setHost(val);
		onUpdateConfig?.({ host: val });
	};

	const handleDurationChange = (val: string) => {
		setTransitionDuration(val);
		const num = Number(val);
		if (!Number.isNaN(num) && num >= 0) {
			onUpdateConfig?.({ transitionDurationMs: Math.min(1000, num) });
		}
	};

	const isVSeeFace = software === 'vseeface';

	return (
		<Card className='border-border/50 bg-card/50 backdrop-blur-sm'>
			<CardHeader className='pb-4'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-2'>
						<div
							className={`rounded-lg p-2 ${
								isVSeeFace ? 'bg-cyan-500/10 text-cyan-400' : 'bg-pink-500/10 text-pink-500'
							}`}
						>
							{isVSeeFace ? <Box className='size-5' /> : <Tv className='size-5' />}
						</div>
						<div>
							<CardTitle className='flex items-center gap-2 text-lg'>
								Conexión: {currentMeta.name}
							</CardTitle>
							<CardDescription className='text-xs'>
								{isVSeeFace
									? 'VMC Protocol (OSC sobre UDP, puerto por defecto: 39539)'
									: 'Conexión WebSocket API para Live2D (puerto por defecto: 8001)'}
							</CardDescription>
						</div>
					</div>

					<Button
						variant='ghost'
						size='sm'
						onClick={() => setShowTips(!showTips)}
						className='gap-1 text-muted-foreground text-xs hover:text-foreground'
					>
						<HelpCircle className='size-3.5' /> Guía
					</Button>
				</div>
			</CardHeader>

			<CardContent className='space-y-4'>
				{showTips && (
					<div className='fade-in animate-in space-y-1.5 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs duration-200'>
						<div className='flex items-center gap-1.5 font-semibold text-primary'>
							{isVSeeFace
								? 'Configuración de VSeeFace (3D VRM)'
								: 'Configuración de VTube Studio (2D Live2D)'}
						</div>
						<p className='text-muted-foreground leading-relaxed'>
							{isVSeeFace
								? 'En VSeeFace: Abre General Settings ➔ busca "OSC/VMC receiver" ➔ actívalo con puerto UDP 39539. Sandy transmitirá fonemas de boca (A, Joy) y expresiones VRM automáticamente.'
								: 'En VTS: Abre Configuración ⚙️ ➔ baja a "Plugin API" ➔ activa "Start API" y acepta la solicitud de SandyIA.'}
						</p>
					</div>
				)}

				<div className='flex flex-wrap items-end gap-3'>
					{isVSeeFace && (
						<div className='w-28 space-y-1.5'>
							<label htmlFor='avatar-host' className='font-medium text-muted-foreground text-xs'>
								Host
							</label>
							<Input
								id='avatar-host'
								type='text'
								value={host}
								onChange={(event) => handleHostChange(event.target.value)}
								disabled={connected || connecting}
								className='h-9 text-xs'
							/>
						</div>
					)}

					<div className='w-24 space-y-1.5'>
						<label htmlFor='avatar-port' className='font-medium text-muted-foreground text-xs'>
							Puerto {isVSeeFace ? 'UDP' : 'WS'}
						</label>
						<Input
							id='avatar-port'
							type='number'
							value={port}
							onChange={(event) => handlePortChange(event.target.value)}
							disabled={connected || connecting}
							className='h-9 font-mono text-xs'
						/>
					</div>

					{isVSeeFace && (
						<div className='w-28 space-y-1.5'>
							<label
								htmlFor='avatar-duration'
								className='font-medium text-muted-foreground text-xs'
							>
								Transición (ms)
							</label>
							<Input
								id='avatar-duration'
								type='number'
								min='0'
								max='600'
								step='10'
								value={transitionDuration}
								onChange={(event) => handleDurationChange(event.target.value)}
								className='h-9 font-mono text-xs'
								placeholder='120'
							/>
						</div>
					)}

					<div className='flex items-center gap-2'>
						{connected ? (
							<Button
								onClick={() => {
									void onDisconnect();
								}}
								variant='outline'
								className='h-9 border-destructive/40 text-destructive text-xs hover:bg-destructive/10'
							>
								Desconectar
							</Button>
						) : (
							<Button
								onClick={() => {
									void onConnect({
										port: Number(port) || currentMeta.defaultPort,
										host,
									});
								}}
								disabled={connecting}
								className='h-9 font-medium text-xs'
							>
								{connecting ? 'Conectando...' : `Conectar a ${currentMeta.shortName}`}
							</Button>
						)}

						{connected && onRefreshModels && !isVSeeFace && (
							<Button
								onClick={() => {
									void onRefreshModels();
								}}
								variant='ghost'
								size='icon'
								className='h-9 w-9'
								title='Refrescar Modelos'
							>
								<RefreshCw className='size-4' />
							</Button>
						)}
					</div>
				</div>

				<div className='flex flex-wrap items-center justify-between gap-2 border-border/40 border-t pt-2 text-xs'>
					<div className='flex items-center gap-2'>
						{connected ? (
							<span className='flex items-center gap-1.5 font-medium text-emerald-400'>
								<FiCheckCircle size={14} />
								Conectado ({currentMeta.name})
							</span>
						) : connecting ? (
							<span className='flex items-center gap-1.5 font-medium text-amber-400'>
								<span className='size-2.5 animate-pulse rounded-full bg-amber-400' />
								Conectando...
							</span>
						) : (
							<span className='flex items-center gap-1.5 text-muted-foreground'>
								<WifiOff size={14} />
								Desconectado
							</span>
						)}

						{stats && connected && 'framerate' in stats && (
							<span className='font-mono text-muted-foreground'>
								{stats.framerate.toFixed(0)} FPS
							</span>
						)}

						{stats && connected && 'packetsSent' in stats && (
							<span className='font-mono text-muted-foreground'>
								{stats.packetsSent} paquetes VMC
							</span>
						)}
					</div>

					<Badge variant='outline' className='font-mono text-[10px] text-muted-foreground'>
						{isVSeeFace ? `UDP OSC :${port}` : `ws://${host}:${port}`}
					</Badge>
				</div>

				{error && (
					<div className='fade-in flex animate-in items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3'>
						<FiAlertCircle size={16} className='mt-0.5 shrink-0 text-destructive' />
						<p className='text-destructive text-xs leading-relaxed'>{error}</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
