import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { type VTSStats } from '@/hooks/useVTubeStudio';
import { FiAlertCircle, FiCheckCircle, FiRefreshCw, FiWifi, FiWifiOff } from 'react-icons/fi';
import { useState } from 'react';

type AvatarConnectionCardProps = {
	connecting: boolean;
	connected: boolean;
	error: string | null;
	stats: VTSStats | null;
	onConnect: (port: number) => void | Promise<void>;
	onDisconnect: () => void | Promise<void>;
	onRefreshModels: () => void | Promise<void>;
};

export function AvatarConnectionCard({
	connecting,
	connected,
	error,
	stats,
	onConnect,
	onDisconnect,
	onRefreshModels,
}: AvatarConnectionCardProps) {
	const [port, setPort] = useState('8001');

	return (
		<Card className='border-border/50 bg-card/50 backdrop-blur-sm'>
			<CardHeader>
				<CardTitle className='flex items-center gap-2 text-lg'>
					<FiWifi size={18} className='text-primary' />
					Conexión
				</CardTitle>
				<CardDescription>Conectate al WebSocket de VTube Studio (puerto por defecto: 8001)</CardDescription>
			</CardHeader>
			<CardContent>
				<div className='flex flex-wrap items-end gap-4'>
					<div className='flex-1 space-y-1.5'>
						<label htmlFor='vts-port' className='font-medium text-muted-foreground text-xs'>
							Puerto
						</label>
						<Input
							id='vts-port'
							type='number'
							value={port}
							onChange={(event) => setPort(event.target.value)}
							disabled={connected || connecting}
							className='max-w-[120px]'
						/>
					</div>
					<div className='flex items-center gap-2'>
						{connected ? (
							<Button
								onClick={() => {
									void onDisconnect();
								}}
								variant='outline'
							>
								Desconectar
							</Button>
						) : (
							<Button
								onClick={() => {
									void onConnect(Number(port) || 8001);
								}}
								disabled={connecting}
							>
								{connecting ? 'Conectando...' : 'Conectar'}
							</Button>
						)}
						{connected && (
							<Button
								onClick={() => {
									void onRefreshModels();
								}}
								variant='ghost'
								size='icon'
								title='Refrescar'
							>
								<FiRefreshCw size={16} />
							</Button>
						)}
					</div>
				</div>

				<div className='mt-4 flex items-center gap-2'>
					{connected ? (
						<span className='flex items-center gap-1.5 text-green-500 text-xs'>
							<FiCheckCircle size={14} />
							Conectado
						</span>
					) : connecting ? (
						<span className='flex items-center gap-1.5 text-muted-foreground text-xs'>
							<span className='h-3 w-3 animate-pulse rounded-full bg-yellow-500' />
							Conectando...
						</span>
					) : (
						<span className='flex items-center gap-1.5 text-muted-foreground text-xs'>
							<FiWifiOff size={14} />
							Desconectado
						</span>
					)}
					{stats && connected && (
						<span className='text-muted-foreground text-xs'>
							VTS {stats.vTubeStudioVersion} — {stats.framerate.toFixed(0)} fps
						</span>
					)}
				</div>

				{error && (
					<div className='mt-3 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3'>
						<FiAlertCircle size={16} className='mt-0.5 shrink-0 text-destructive' />
						<p className='text-destructive text-xs'>{error}</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
