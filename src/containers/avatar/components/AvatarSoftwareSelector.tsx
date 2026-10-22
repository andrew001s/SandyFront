'use client';

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
					<button
						key={meta.id}
						type='button'
						onClick={() => onSelect(meta.id)}
						className={`flex select-none flex-col justify-between rounded-xl border p-4 text-left outline-none transition-all duration-150 ${
							isSelected
								? 'border-primary/50 bg-primary/[0.08] shadow-xs'
								: 'border-border bg-card hover:border-primary/30'
						}`}
					>
						<div className='flex items-start justify-between gap-3'>
							<div className='flex items-center gap-3'>
								<div
									className={`flex size-10 shrink-0 items-center justify-center rounded-lg border ${
										meta.id === 'vtubestudio'
											? 'border-primary/30 bg-primary/10 text-primary'
											: 'border-[#F28BD8]/30 bg-[#F28BD8]/10 text-[#F28BD8]'
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
										<h3 className='font-display font-semibold text-foreground text-sm'>
											{meta.name}
										</h3>
										<span
											className={`rounded border px-1.5 py-0.2 font-bold font-mono text-[9px] uppercase ${
												meta.dimension === '2d'
													? 'border-primary/30 bg-primary/10 text-primary'
													: 'border-[#F28BD8]/30 bg-[#F28BD8]/10 text-[#F28BD8]'
											}`}
										>
											{meta.badge}
										</span>
									</div>
									<p className='mt-1 line-clamp-2 font-sans text-muted-foreground text-xs leading-relaxed'>
										{meta.description}
									</p>
								</div>
							</div>

							<div className='shrink-0'>
								{isConnected ? (
									<span className='flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-400'>
										<span className='size-1.5 animate-pulse rounded-full bg-emerald-400' />
										ONLINE
									</span>
								) : isSelected && isConnecting ? (
									<span className='flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] text-amber-400'>
										<span className='size-1.5 animate-pulse rounded-full bg-amber-400' />
										CONECTANDO
									</span>
								) : null}
							</div>
						</div>
					</button>
				);
			})}
		</div>
	);
}
