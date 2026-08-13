'use client';

import { Card } from '@/components/ui/card';
import type { ReactNode } from 'react';

type OnboardingSplitCardProps = {
	left: ReactNode;
	right: ReactNode;
};

export function OnboardingSplitCard({ left, right }: OnboardingSplitCardProps) {
	return (
		<Card className='overflow-hidden border-border/60 bg-card/80 shadow-[0_20px_60px_rgba(0,0,0,0.10)] backdrop-blur-sm'>
			<div className='flex flex-col gap-0 lg:flex-row'>
				<div className='border-border/60 border-b p-5 sm:p-6 lg:flex-1 lg:border-r lg:border-b-0'>{left}</div>
				<div className='p-5 sm:p-6 lg:flex-[1.1]'>{right}</div>
			</div>
		</Card>
	);
}
