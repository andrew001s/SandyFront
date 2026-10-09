'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AVATAR_SOFTWARE_LIST } from '@/lib/avatar/constants';
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
		<div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
			{AVATAR_SOFTWARE_LIST.map((meta) => {
				const isSelected = selectedSoftware === meta.id;
				const isConnected = connectedSoftware === meta.id;

				return (
					<Card
						key={meta.id}
						onClick={() => onSelect(meta.id)}
						className={`relative cursor-pointer border p-4 transition-all duration-200 hover:border-primary/50 ${
							isSelected
								? 'border-primary/60 bg-primary/10 shadow-lg shadow-primary/5 ring-1 ring-primary/40'
								: 'border-border/50 bg-card/40 hover:bg-card/70'
						}`}
					>
						<div className='flex items-start justify-between gap-3'>
							<div className='flex items-center gap-3'>
								<div
									className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
										meta.id === 'vtubestudio'
											? 'bg-pink-500/10 text-pink-500'
											: 'bg-cyan-500/10 text-cyan-400'
									}`}
								>
									{meta.id === 'vtubestudio' ? (
										<Tv className='size-5' />
									) : (
										<Box className='size-5' />
									)}
								</div>
								<div>
									<div className='flex items-center gap-2'>
										<h3 className='font-semibold text-foreground text-sm'>{meta.name}</h3>
										<Badge
											variant='outline'
											className={`text-[10px] ${
												meta.dimension === '2d'
													? 'border-pink-500/30 text-pink-400'
													: 'border-cyan-500/30 text-cyan-400'
											}`}
										>
											{meta.badge}
										</Badge>
									</div>
									<p className='mt-1 line-clamp-2 text-muted-foreground text-xs leading-relaxed'>
										{meta.description}
									</p>
								</div>
							</div>

							<div className='shrink-0'>
								{isConnected ? (
									<span className='flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-medium text-[11px] text-emerald-400'>
										<span className='size-1.5 animate-pulse rounded-full bg-emerald-400' />
										Conectado
									</span>
								) : isSelected && isConnecting ? (
									<span className='flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-medium text-[11px] text-amber-400'>
										<span className='size-1.5 animate-pulse rounded-full bg-amber-400' />
										Conectando
									</span>
								) : null}
							</div>
						</div>
					</Card>
				);
			})}
		</div>
	);
}
