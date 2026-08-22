'use client';

import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export type OnboardingOfficialDocLink = {
	label: string;
	href: string;
	description: string;
};

type OnboardingOfficialDocsProps = {
	title: string;
	description?: string;
	links: OnboardingOfficialDocLink[];
	className?: string;
};

export function OnboardingOfficialDocs({
	title,
	description,
	links,
	className,
}: OnboardingOfficialDocsProps) {
	return (
		<div className={className}>
			<div className='space-y-1'>
				<p className='text-muted-foreground text-xs uppercase tracking-[0.22em]'>{title}</p>
				{description ? (
					<p className='max-w-2xl text-muted-foreground text-sm leading-relaxed'>{description}</p>
				) : null}
			</div>

			<div className='mt-4 grid grid-cols-1 gap-3'>
				{links.map((link) => (
					<Button
						key={link.href}
						asChild
						variant='outline'
						size='sm'
						className='h-auto w-full justify-start rounded-2xl border-border/70 bg-background/70 px-4 py-3 text-left shadow-sm hover:bg-background/90'
					>
						<a
							href={link.href}
							target='_blank'
							rel='noreferrer noopener'
							className='flex w-full min-w-0 items-start gap-3'
						>
							<ExternalLink className='size-4' />
							<span className='min-w-0 text-left'>
								{link.label}
								<span className='block text-muted-foreground text-xs leading-relaxed'>
									{link.description}
								</span>
							</span>
						</a>
					</Button>
				))}
			</div>
		</div>
	);
}
