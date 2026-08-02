import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot='skeleton'
			className={cn('skeleton-shimmer relative overflow-hidden rounded-md bg-accent', className)}
			{...props}
		>
			<span aria-hidden='true' className='skeleton-shimmer__bar' />
		</div>
	);
}

export { Skeleton };
