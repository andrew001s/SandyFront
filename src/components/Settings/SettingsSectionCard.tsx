import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReactNode } from 'react';

type SettingsSectionCardProps = {
	icon: ReactNode;
	title: string;
	description: string;
	statusLabel: string;
	statusTone: string;
	children: ReactNode;
	highlighted?: boolean;
};

export function SettingsSectionCard({
	icon,
	title,
	description,
	statusLabel,
	statusTone,
	children,
	highlighted,
}: SettingsSectionCardProps) {
	return (
		<Card
			className={[
				'rounded-xl border-border/60 bg-card transition-all',
				highlighted ? 'ring-1 ring-primary/40' : '',
			].join(' ')}
		>
			<CardHeader className='space-y-4 border-border/50 border-b px-5 py-5 sm:px-6'>
				<div className='flex items-start justify-between gap-4'>
					<div className='flex min-w-0 items-start gap-3.5'>
						<div className='flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background/60 text-primary'>
							{icon}
						</div>
						<div className='space-y-1'>
							<CardTitle className='font-display font-semibold text-foreground text-lg'>
								{title}
							</CardTitle>
							<CardDescription className='max-w-xl font-sans text-muted-foreground text-xs leading-relaxed'>
								{description}
							</CardDescription>
						</div>
					</div>
					<div
						className={['rounded-full border px-3 py-1 font-mono text-xs', statusTone].join(' ')}
					>
						{statusLabel}
					</div>
				</div>
			</CardHeader>
			<CardContent className='space-y-5 px-5 py-5 sm:px-6'>{children}</CardContent>
		</Card>
	);
}
