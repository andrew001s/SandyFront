'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardActions } from '@/containers/dashboard/DashboardActions';
import type { AvatarSoftware } from '@/types/avatar';
import { AvatarHeader } from './AvatarHeader';
import { AvatarSoftwareSelector } from './AvatarSoftwareSelector';

export function StudioToolbar({
	software,
	connected,
	onSelect,
}: { software: AvatarSoftware; connected: boolean; onSelect: (software: AvatarSoftware) => void }) {
	return (
		<header className='flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-border border-b px-2 py-1.5 sm:gap-x-3 sm:px-3'>
			<div className='flex flex-1 items-center gap-2 lg:flex-none'>
				<SidebarTrigger id='studio-tour-navigation' className='size-8 sm:size-9' />
				<AvatarHeader />
			</div>
			<div className='order-3 w-full lg:order-none lg:w-auto lg:min-w-48 lg:flex-1'>
				<AvatarSoftwareSelector
					selectedSoftware={software}
					connectedSoftware={connected ? software : null}
					onSelect={onSelect}
				/>
			</div>
			<DashboardActions studio />
		</header>
	);
}
