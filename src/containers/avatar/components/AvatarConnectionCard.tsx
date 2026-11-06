'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { VTSStats } from '@/hooks/useVTubeStudio';
import { AVATAR_SOFTWARE_LIST } from '@/lib/avatar/constants';
import type { AvatarConnectionStats, AvatarSoftware, SoftwareConfig } from '@/types/avatar';
import { CheckCircle2, HelpCircle, LoaderCircle, RefreshCw, WifiOff } from 'lucide-react';
import { useEffect, useId, useState } from 'react';

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
	const meta = AVATAR_SOFTWARE_LIST.find((item) => item.id === software) ?? AVATAR_SOFTWARE_LIST[0];
	const is3D = software === 'vnyan' || software === 'vseeface';
	const configPort = config?.port ?? (is3D ? 8000 : 8001);
	const configHost = config?.host ?? '127.0.0.1';
	const [port, setPort] = useState(String(configPort));
	const [host, setHost] = useState(configHost);
	const [showTips, setShowTips] = useState(false);
	const id = useId();
	const validPort = Number.isInteger(Number(port)) && Number(port) > 0 && Number(port) <= 65535;
	useEffect(() => {
		setPort(String(configPort));
		setHost(configHost);
	}, [configPort, configHost]);

	return (
		<Card className='gap-0 rounded-xl border-border bg-card py-0 shadow-none'>
			<CardContent className='space-y-4 p-4 sm:p-5'>
				<div className='flex flex-wrap items-start justify-between gap-3'>
					<div className='min-w-0 space-y-1'>
						<h3 className='font-semibold text-base'>Conexión con {meta.name}</h3>
						<output className='flex items-center gap-2 text-muted-foreground text-sm'>
							{connecting ? (
								<LoaderCircle aria-hidden className='size-4 motion-safe:animate-spin' />
							) : connected ? (
								<CheckCircle2
									aria-hidden
									className='size-4 text-emerald-700 dark:text-emerald-400'
								/>
							) : (
								<WifiOff aria-hidden className='size-4' />
							)}
							{connecting
								? 'Conectando y autorizando…'
								: connected
									? 'Conectado a la aplicación'
									: 'Desconectado'}
							{connected && stats && 'framerate' in stats && (
								<span className='font-mono text-xs'>{stats.framerate.toFixed(0)} FPS</span>
							)}
						</output>
					</div>
					<Button
						type='button'
						variant='ghost'
						size='sm'
						onClick={() => setShowTips(!showTips)}
						aria-expanded={showTips}
						aria-controls={`${id}-guide`}
						className='min-h-9 gap-2 text-muted-foreground text-xs'
					>
						<HelpCircle aria-hidden className='size-4' /> Cómo conectar
					</Button>
				</div>
				{!connected && !connecting && (
					<p className='max-w-prose text-muted-foreground text-sm'>
						Abre {meta.name}, activa su API de plugins y conecta desde aquí. Esta conexión es
						independiente del avatar del navegador.
					</p>
				)}
				{showTips && (
					<ol
						id={`${id}-guide`}
						className='list-decimal space-y-1 border-border border-t pt-3 pl-5 text-muted-foreground text-sm'
					>
						{is3D ? (
							<li>En VNyan, abre Settings → Misc → WebSockets y activa Start Receiver.</li>
						) : (
							<li>En VTube Studio, abre Configuración → Plugin API y activa Start API.</li>
						)}
						<li>Usa el mismo puerto que aparece en la aplicación y pulsa Conectar.</li>
						<li>Acepta la solicitud de SandyIA en la aplicación.</li>
					</ol>
				)}
				<div className='flex flex-wrap items-end gap-3'>
					{is3D && (
						<div className='w-36 space-y-1'>
							<label htmlFor={`${id}-host`} className='text-muted-foreground text-xs'>
								Host
							</label>
							<Input
								id={`${id}-host`}
								value={host}
								disabled={connected || connecting}
								onChange={(event) => {
									setHost(event.target.value);
									onUpdateConfig?.({ host: event.target.value });
								}}
							/>
						</div>
					)}
					<div className='w-28 space-y-1'>
						<label htmlFor={`${id}-port`} className='text-muted-foreground text-xs'>
							Puerto API
						</label>
						<Input
							id={`${id}-port`}
							type='number'
							min={1}
							max={65535}
							value={port}
							aria-invalid={!validPort}
							aria-describedby={!validPort ? `${id}-port-error` : undefined}
							disabled={connected || connecting}
							onChange={(event) => {
								setPort(event.target.value);
								const value = Number(event.target.value);
								if (Number.isInteger(value) && value > 0 && value <= 65535)
									onUpdateConfig?.({ port: value });
							}}
							className='h-10 font-mono text-sm'
						/>
					</div>
					{connected || connecting ? (
						<Button
							type='button'
							variant='outline'
							onClick={() => void onDisconnect()}
							className='h-10 text-destructive hover:bg-destructive/10 hover:text-destructive'
						>
							{connecting ? 'Cancelar conexión' : 'Desconectar'}
						</Button>
					) : (
						<Button
							type='button'
							disabled={!validPort}
							onClick={() => void onConnect({ port: Number(port), host })}
							className='h-10'
						>
							Conectar a {meta.shortName}
						</Button>
					)}
					{connected && onRefreshModels && (
						<Button
							type='button'
							variant='ghost'
							onClick={() => void onRefreshModels()}
							className='h-10 gap-2 text-sm'
						>
							<RefreshCw aria-hidden className='size-4' /> Actualizar modelos
						</Button>
					)}
					<code className='pb-2 text-muted-foreground text-xs'>{`ws://${is3D ? host : 'localhost'}:${port}`}</code>
				</div>
				{!validPort && (
					<p id={`${id}-port-error`} className='text-destructive text-sm'>
						Usa un puerto entre 1 y 65535.
					</p>
				)}
				{error && (
					<p role='alert' className='border-border border-t pt-3 text-destructive text-sm'>
						{error}
					</p>
				)}
			</CardContent>
		</Card>
	);
}
