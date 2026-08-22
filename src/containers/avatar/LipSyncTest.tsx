'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FiMusic, FiWifi } from 'react-icons/fi';

interface Props {
	connected: boolean;
}

export function LipSyncTest({ connected }: Props) {
	return (
		<Card className='border-border/50 bg-card/50 backdrop-blur-sm'>
			<CardContent className='space-y-3 p-4'>
				<div className='flex items-center justify-between gap-3'>
					<div className='flex items-center gap-2'>
						<FiMusic size={16} className='text-primary' />
						<span className='font-medium text-sm'>Lip Sync Automático</span>
					</div>
					<Badge
						variant='outline'
						className={
							connected
								? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
								: 'border-border/70 text-muted-foreground'
						}
					>
						{connected ? 'VTS conectado' : 'VTS desconectado'}
					</Badge>
				</div>
				<p className='text-muted-foreground text-xs leading-relaxed'>
					Cada audio reproducido desde Fish Audio anima la boca del modelo automáticamente. No
					necesitas botones de prueba.
				</p>
				<div className='flex items-center gap-2 text-muted-foreground text-xs'>
					<FiWifi size={14} />
					<span>La sincronización se activa al reproducir audio real en la app.</span>
				</div>
			</CardContent>
		</Card>
	);
}

export default LipSyncTest;
