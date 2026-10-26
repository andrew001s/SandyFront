'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AvatarSoftware } from '@/types/avatar';
import { Activity, Box, Layers } from 'lucide-react';

interface Props {
	selectedSoftware: AvatarSoftware;
	connectedSoftware: AvatarSoftware | null;
	onSelect: (software: AvatarSoftware) => void;
}

export function AvatarSoftwareSelector({ selectedSoftware, connectedSoftware, onSelect }: Props) {
	return (
		<div className='flex w-full min-w-0 lg:flex-1 lg:justify-end'>
			<Tabs
				value={selectedSoftware}
				onValueChange={(val) => onSelect(val as AvatarSoftware)}
				className='w-full lg:max-w-96'
			>
				<TabsList className='grid h-10 w-full grid-cols-3 gap-1 rounded-lg border border-border/80 bg-card p-1'>
					<TabsTrigger
						value='pngtuber'
						onClick={() => onSelect('pngtuber')}
						className='flex h-8 min-w-0 items-center justify-center gap-1 rounded-md px-1.5 font-medium font-sans text-[11px] transition-colors data-[state=active]:bg-primary/10 data-[state=active]:font-semibold data-[state=active]:text-primary sm:gap-1.5 sm:px-2.5 sm:text-xs'
					>
						<Layers className='size-3.5 text-primary' />
						<span>PNGTuber</span>
						{connectedSoftware === 'pngtuber' && (
							<span className='size-1.5 rounded-full bg-emerald-400' />
						)}
					</TabsTrigger>
					<TabsTrigger
						value='live2d'
						onClick={() => onSelect('live2d')}
						className='flex h-8 min-w-0 items-center justify-center gap-1 rounded-md px-1.5 font-medium font-sans text-[11px] transition-colors data-[state=active]:bg-cyan-500/10 data-[state=active]:font-semibold data-[state=active]:text-cyan-500 sm:gap-1.5 sm:px-2.5 sm:text-xs'
					>
						<Activity className='size-3.5 text-cyan-400' />
						<span className='sm:hidden'>2D</span>
						<span className='hidden sm:inline'>Avatar 2D</span>
						{connectedSoftware === 'live2d' && (
							<span className='size-1.5 rounded-full bg-emerald-400' />
						)}
					</TabsTrigger>
					<TabsTrigger
						value='vrm'
						onClick={() => onSelect('vrm')}
						className='flex h-8 min-w-0 items-center justify-center gap-1 rounded-md px-1.5 font-medium font-sans text-[11px] transition-colors data-[state=active]:bg-secondary/10 data-[state=active]:font-semibold data-[state=active]:text-secondary sm:gap-1.5 sm:px-2.5 sm:text-xs'
					>
						<Box className='size-3.5 text-secondary' />
						<span className='sm:hidden'>3D</span>
						<span className='hidden sm:inline'>Avatar 3D</span>
						{(connectedSoftware === 'vrm' || connectedSoftware === 'vnyan') && (
							<span className='size-1.5 rounded-full bg-emerald-400' />
						)}
					</TabsTrigger>
				</TabsList>
			</Tabs>
		</div>
	);
}
