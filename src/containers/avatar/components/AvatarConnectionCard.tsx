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
	const [showTips, setShowTips] = useState(false);

	useEffect(() => {
		const targetPort = config?.port ?? currentMeta.defaultPort;
		setPort(String(targetPort));
		setHost(config?.host ?? '127.0.0.1');
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

	const is3D = software === 'vnyan' || software === 'vseeface';

	return (
		<Card className='h-fit rounded-xl border-border/60 bg-card'>
			<CardHeader className='pb-4'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-3'>
						<div
							className={`rounded-lg p-2.5 ${
								is3D ? 'bg-cyan-500/10 text-cyan-400' : 'bg-primary/10 text-primary'
							}`}
						>
							{is3D ? <Box className='size-5' /> : <Tv className='size-5' />}
						</div>
						<div>
							<CardTitle className='flex items-center gap-2 font-display font-semibold text-base text-foreground'>
								Conexión: {currentMeta.name}
							</CardTitle>
							<CardDescription className='text-xs'>
								{is3D
									? 'Conexión WebSocket nativa para VRM (puerto por defecto: 8000)'
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
							{is3D
								? 'Configuración de VNyan (3D VRM)'
								: 'Configuración de VTube Studio (2D Live2D)'}
						</div>
						<p className='text-muted-foreground leading-relaxed'>
							{is3D
								? "En VNyan: Abre Settings ➔ pestaña Misc ➔ WebSockets ➔ activa 'Start Receiver' (puerto 8000, o usa 8008 si tu backend Python ya ocupa el 8000). Sandy transmitirá fonemas de boca (A, Joy) y expresiones VRM automáticamente vía WebSocket."
								: 'En VTS: Abre Configuración ⚙️ ➔ baja a "Plugin API" ➔ activa "Start API" y acepta la solicitud de SandyIA.'}
						</p>
					</div>
				)}

				<div className='flex flex-wrap items-end gap-3'>
					{is3D && (
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
							Puerto WS
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

					<div className='flex items-center gap-2'>
						{connected ? (
							<>
								<Button
									onClick={() => {
										void onDisconnect();
									}}
									variant='outline'
									className='h-9 border-destructive/40 text-destructive text-xs hover:bg-destructive/10'
								>
									Desconectar
								</Button>
							</>
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

						{connected && onRefreshModels && !is3D && (
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
								{'uptime' in stats && ` · ${Math.floor(stats.uptime / 60)}m`}
							</span>
						)}

						{stats && connected && 'packetsSent' in stats && (
							<span className='font-mono text-muted-foreground'>
								{stats.packetsSent} mensajes WS
							</span>
						)}
					</div>

					<div className='flex items-center gap-1.5'>
						{stats && connected && 'vTubeStudioVersion' in stats && stats.vTubeStudioVersion && (
							<span className='hidden font-mono text-[10px] text-muted-foreground sm:inline'>
								v{stats.vTubeStudioVersion}
							</span>
						)}
						<Badge variant='outline' className='font-mono text-[10px] text-muted-foreground'>
							{is3D ? `ws://${host}:${port}/vnyan` : `ws://${host}:${port}`}
						</Badge>
					</div>
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
