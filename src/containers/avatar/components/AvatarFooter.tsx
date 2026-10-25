import { CardFooter } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

export default function AvatarFooter({
	isHudVisible,
	isFullscreen,
}: { isHudVisible: boolean; isFullscreen: boolean }) {
	return (
		<div>
			{isHudVisible && !isFullscreen && (
				<CardFooter className='flex flex-wrap items-center justify-between gap-3 border-border/60 border-t bg-card/60 px-4 py-2.5 text-xs sm:px-5'>
					<span className='font-mono text-[11px] text-muted-foreground'>
						Rotar: Clic izq · Zoom: Rueda ratón · Desplazar: Clic der
					</span>
					<div className='flex items-center gap-3'>
						<a
							href='/overlay/avatar'
							target='_blank'
							rel='noopener noreferrer'
							className='flex items-center gap-1.5 font-medium text-secondary text-xs hover:underline'
						>
							<ExternalLink className='size-3.5' /> Abrir Overlay OBS en ventana independiente
						</a>
					</div>
				</CardFooter>
			)}
		</div>
	);
}
