'use client';

import { ChevronDown, ExternalLink } from 'lucide-react';

export type OnboardingOfficialDocLink = { label: string; href: string; description: string };

export function OnboardingOfficialDocs({
	title,
	description,
	links,
	className = '',
}: {
	title: string;
	description?: string;
	links: OnboardingOfficialDocLink[];
	className?: string;
}) {
	if (!links.length) return null;
	return (
		<details className={`group border-border border-t pt-3 ${className}`}>
			<summary className='flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-md font-medium text-foreground text-sm hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring'>
				<span>Ayuda: {title}</span>
				<ChevronDown
					aria-hidden='true'
					className='size-4 shrink-0 text-muted-foreground group-open:rotate-180'
				/>
			</summary>
			<div className='space-y-2 pb-2'>
				{description && (
					<p className='text-muted-foreground text-sm leading-relaxed'>{description}</p>
				)}
				{links.map((link) => (
					<a
						key={link.href}
						href={link.href}
						target='_blank'
						rel='noreferrer noopener'
						className='flex min-h-11 items-start gap-3 rounded-lg px-2 py-3 text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring'
					>
						<ExternalLink
							aria-hidden='true'
							className='mt-0.5 size-4 shrink-0 text-muted-foreground'
						/>
						<span className='min-w-0'>
							<span className='font-medium underline underline-offset-4'>{link.label}</span>
							<span className='mt-1 block text-muted-foreground'>{link.description}</span>
							<span className='sr-only'>Se abre en otra pestaña</span>
						</span>
					</a>
				))}
			</div>
		</details>
	);
}
