import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type VTSStats } from '@/hooks/useVTubeStudio';
import { FiCpu } from 'react-icons/fi';

type AvatarPerformanceCardProps = {
	stats: VTSStats | null;
	connected: boolean;
};

export function AvatarPerformanceCard({ stats, connected }: AvatarPerformanceCardProps) {
	if (!stats || !connected) {
		return null;
	}

	return (
		<Card className='border-border/50 bg-card/50 backdrop-blur-sm'>
			<CardHeader>
				<CardTitle className='flex items-center gap-2 text-lg'>
					<FiCpu size={18} className='text-primary' />
					Rendimiento
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className='space-y-2'>
					<div className='flex justify-between'>
						<span className='text-muted-foreground text-xs'>FPS</span>
						<span className='font-medium text-foreground text-xs'>{stats.framerate.toFixed(0)}</span>
					</div>
					<div className='flex justify-between'>
						<span className='text-muted-foreground text-xs'>Uptime</span>
						<span className='font-medium text-foreground text-xs'>
							{Math.floor(stats.uptime / 60)}m {Math.floor(stats.uptime % 60)}s
						</span>
					</div>
					<div className='flex justify-between'>
						<span className='text-muted-foreground text-xs'>Ventana</span>
						<span className='font-medium text-foreground text-xs'>{stats.vTubeStudioVersion}</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
