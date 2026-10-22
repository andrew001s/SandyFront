import { Star } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
	tag?: string;
	title: string;
	description?: string;
	children?: ReactNode;
	star?: boolean;
}

export function PageHeader({ tag, title, description, children, star = true }: PageHeaderProps) {
	return (
		<header className='mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
			<div>
				{tag && (
					<div className='mb-1.5 flex items-center gap-2 font-mono text-[11px] text-primary uppercase tracking-wider'>
						<span>{tag}</span>
					</div>
				)}
				<h1 className='flex items-center gap-2.5 font-bold font-display text-2xl text-foreground sm:text-3xl'>
					<span>{title}</span>
					{star && (
						<span className='inline-block animate-[twinkle_3s_ease-in-out_infinite] text-amber-400'>
							<Star
								size={20}
								className='fill-amber-400 drop-shadow-[0_0_8px_rgba(253,230,138,0.7)]'
							/>
						</span>
					)}
				</h1>
				{description && (
					<p className='mt-1 max-w-2xl font-sans text-muted-foreground text-xs leading-relaxed sm:text-sm'>
						{description}
					</p>
				)}
			</div>
			{children && <div className='flex items-center gap-2 shrink-0'>{children}</div>}
		</header>
	);
}
