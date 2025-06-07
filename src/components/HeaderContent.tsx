import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dot } from 'lucide-react';

export const HeaderContent = () => {
	return (
		<div className='flex flex-row items-center justify-center self-center bg-sidebar pr-4 text-justify'>
			<div className='-mt-1.5 z-10 flex flex-row items-center space-x-2'>
				<Dot className='-mr-3 text-chart-2' size={48} />
				<span className='-mr-3 pr-4 text-xl'>Shandrew</span>
				<Avatar>
					<AvatarImage src='' />
					<AvatarFallback>U</AvatarFallback>
				</Avatar>
			</div>
			<div className='absolute top-0 left-0 w-full bg-sidebar pb-18' />
		</div>
	);
};
