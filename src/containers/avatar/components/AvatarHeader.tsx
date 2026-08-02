import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

export function AvatarHeader() {
	return (
		<header className='space-y-2'>
			<div className='flex flex-wrap items-center gap-3'>
				<h1 className='font-bold text-3xl [font-family:var(--font-unbounded)] sm:text-4xl'>
					<span className='bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent dark:from-[#A78BFA] dark:to-[#22D3EE]'>
						Avatar VTuber
					</span>
					<span className='ml-3 inline-block animate-[twinkle_3s_ease-in-out_infinite] text-amber-400 dark:text-[#FDE68A]'>
						<Star size={20} className='fill-amber-400 dark:fill-[#FDE68A]' />
					</span>
				</h1>
				<Badge variant='secondary' className='rounded-full px-3 py-0.5 text-xs'>
					VTube Studio
				</Badge>
			</div>
			<p className='text-muted-foreground'>Conectate a VTube Studio para controlar tu modelo Live2D</p>
		</header>
	);
}
