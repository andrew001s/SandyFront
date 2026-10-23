'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AvatarSoftware } from '@/types/avatar';
import { Box, Tv } from 'lucide-react';

interface Props {
	selectedSoftware: AvatarSoftware;
	connectedSoftware: AvatarSoftware | null;
	isConnecting: boolean;
	onSelect: (software: AvatarSoftware) => void;
}

export function AvatarSoftwareSelector({
	selectedSoftware,
	connectedSoftware,
	isConnecting,
	onSelect,
}: Props) {
	return (
		<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
			<Tabs
				value={selectedSoftware}
				onValueChange={(val) => onSelect(val as AvatarSoftware)}
				className='w-full sm:w-auto'
			>
				<TabsList className='grid h-10 w-full grid-cols-2 gap-1 rounded-lg border border-border/80 bg-card p-1 sm:w-84'>
					<TabsTrigger
						value='vtubestudio'
						className='flex h-8 items-center justify-center gap-2 rounded-md px-3 font-medium font-sans text-xs transition-colors data-[state=active]:bg-primary/10 data-[state=active]:font-semibold data-[state=active]:text-primary'
					>
						<Tv className='size-3.5 text-primary' />
						<span>Avatar 2D (Navegador)</span>
						{connectedSoftware === 'vtubestudio' && (
							<span className='size-1.5 rounded-full bg-emerald-400' />
						)}
					</TabsTrigger>
					<TabsTrigger
						value='vrm'
						className='flex h-8 items-center justify-center gap-2 rounded-md px-3 font-medium font-sans text-xs transition-colors data-[state=active]:bg-secondary/10 data-[state=active]:font-semibold data-[state=active]:text-secondary'
					>
						<Box className='size-3.5 text-secondary' />
						<span>Avatar 3D (VRM)</span>
						{(connectedSoftware === 'vrm' || connectedSoftware === 'vnyan') && (
							<span className='size-1.5 rounded-full bg-emerald-400' />
						)}
					</TabsTrigger>
				</TabsList>
			</Tabs>

			<div className='flex items-center gap-2 text-xs'>
				<span className='font-mono text-[11px] text-muted-foreground'>
					{selectedSoftware === 'vtubestudio'
						? 'Entorno 2D (PNGTuber / Live2D) · En navegador'
						: 'Entorno 3D VRM · WebGL en navegador'}
				</span>
				{connectedSoftware === selectedSoftware ? (
					<span className='flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-400'>
						<span className='size-1.5 animate-pulse rounded-full bg-emerald-400' />
						ONLINE
					</span>
				) : isConnecting ? (
					<span className='flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] text-amber-400'>
						<span className='size-1.5 animate-pulse rounded-full bg-amber-400' />
						CONECTANDO
					</span>
				) : null}
			</div>
		</div>
	);
}
