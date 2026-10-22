'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { BsMoonStarsFill } from 'react-icons/bs';
import { ClipLoader } from 'react-spinners';

type SocialConnectionCardProps = {
	name: string;
	statusLabel: string;
	connected: boolean;
	isLoading?: boolean;
	isPrincipal?: boolean;
	isBusy?: boolean;
	avatarSrc?: string | null;
	avatarAlt: string;
	fallbackSrc?: string;
	connectLabel: string;
	disconnectLabel: string;
	onConnect: () => void;
	onDisconnect: () => void;
	connectDisabled?: boolean;
	connectButtonClassName?: string;
	disconnectButtonClassName?: string;
	avatarClassName?: string;
	disconnectedDescription?: ReactNode;
	children?: ReactNode;
	statusPrefix?: string;
};

export const SocialConnectionCard = ({
	name,
	statusLabel,
	connected,
	isLoading = false,
	isPrincipal = true,
	isBusy = false,
	avatarSrc,
	avatarAlt,
	fallbackSrc = '/icons/default.png',
	connectLabel,
	disconnectLabel,
	onConnect,
	onDisconnect,
	connectDisabled = false,
	avatarClassName,
	children,
	statusPrefix,
}: SocialConnectionCardProps) => {
	return (
		<div
			className={cn(
				'relative flex flex-col justify-between overflow-hidden rounded-xl border p-5 shadow-xs transition-all duration-200',
				connected ? 'border-primary/40 bg-card' : 'border-border bg-card hover:border-primary/30',
			)}
		>
			{/* Marca de agua celestial */}
			<div className='-right-3 -top-3 pointer-events-none absolute opacity-15'>
				<BsMoonStarsFill size={64} className='text-primary' />
			</div>

			<div>
				<div className='flex items-start justify-between gap-4'>
					<div className='flex items-center gap-3.5'>
						<Avatar
							className={cn(
								'size-14 shrink-0 rounded-xl border border-border shadow-xs',
								avatarClassName,
							)}
						>
							{avatarSrc ? (
								<>
									<AvatarImage src={avatarSrc} alt={avatarAlt} className='object-cover' />
									<AvatarFallback className='rounded-xl bg-background'>
										<Image
											src={fallbackSrc}
											alt='Default Icon'
											width={56}
											height={56}
											className='size-full object-cover p-1'
										/>
									</AvatarFallback>
								</>
							) : (
								<AvatarFallback className='rounded-xl bg-background'>
									<Image
										src={fallbackSrc}
										alt='Default Icon'
										width={56}
										height={56}
										className='size-full object-cover p-1'
									/>
								</AvatarFallback>
							)}
						</Avatar>

						<div className='min-w-0 flex-1'>
							<h3 className='truncate font-display font-semibold text-base text-foreground'>
								{connected ? name : isPrincipal ? 'Cuenta de Emisión' : 'Cuenta de Bot'}
							</h3>
							<div className='mt-1 flex items-center gap-1.5'>
								<span
									className={cn(
										'size-1.5 rounded-full',
										connected ? 'animate-pulse bg-emerald-400' : 'bg-muted-foreground/60',
									)}
								/>
								<span className='font-mono text-muted-foreground text-xs'>
									{statusPrefix ? `${statusPrefix}: ` : ''}
									<span
										className={cn(
											connected ? 'font-medium text-emerald-400' : 'text-muted-foreground',
										)}
									>
										{connected ? statusLabel : 'No autenticado'}
									</span>
								</span>
							</div>
						</div>
					</div>

					<span
						className={cn(
							'shrink-0 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider',
							connected
								? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
								: 'border-border bg-background text-muted-foreground',
						)}
					>
						{connected ? 'ONLINE' : 'DESCONECTADO'}
					</span>
				</div>
			</div>

			<div className='mt-6 space-y-3'>
				{!connected ? (
					<Button
						onClick={() => void onConnect()}
						disabled={isLoading || connectDisabled}
						className='h-9 w-full rounded-lg bg-primary font-sans font-semibold text-primary-foreground text-xs shadow-xs transition-all hover:bg-primary/90'
					>
						{isLoading ? (
							<div className='flex items-center justify-center gap-2'>
								<span>Conectando</span>
								<ClipLoader color='currentColor' size={14} />
							</div>
						) : (
							<span>{connectLabel}</span>
						)}
					</Button>
				) : (
					<>
						<Button
							onClick={() => void onDisconnect()}
							disabled={isBusy}
							variant='outline'
							className='h-9 w-full rounded-lg border-border font-medium font-sans text-muted-foreground text-xs hover:bg-muted/50 hover:text-foreground'
						>
							{isBusy ? (
								<div className='flex items-center justify-center gap-2'>
									<span>Procesando</span>
									<ClipLoader color='currentColor' size={14} />
								</div>
							) : (
								<span>{disconnectLabel}</span>
							)}
						</Button>
						{children}
					</>
				)}
			</div>
		</div>
	);
};
