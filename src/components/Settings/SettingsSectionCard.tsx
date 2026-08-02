import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type ReactNode } from 'react';

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
				'border-border/60 bg-card/90 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.18)] backdrop-blur-xl transition-all',
				highlighted ? 'ring-1 ring-violet-500/30' : '',
			].join(' ')}
		>
			<CardHeader className='space-y-4 border-border/50 border-b px-5 py-5 sm:px-6'>
				<div className='flex items-start justify-between gap-4'>
					<div className='flex min-w-0 items-start gap-4'>
						<div className='flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-background/80 text-violet-600 shadow-sm'>
							{icon}
						</div>
						<div className='space-y-1'>
							<CardTitle className='text-xl'>{title}</CardTitle>
							<CardDescription className='max-w-xl'>{description}</CardDescription>
						</div>
					</div>
					<div className={['rounded-full border px-3 py-1 text-xs font-medium', statusTone].join(' ')}>
						{statusLabel}
					</div>
				</div>
			</CardHeader>
			<CardContent className='space-y-5 px-5 py-5 sm:px-6'>{children}</CardContent>
		</Card>
	);
}
