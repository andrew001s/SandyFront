'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import { BsMoonStarsFill } from 'react-icons/bs';
import { ClipLoader } from 'react-spinners';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { BackgroundGradient } from '../ui/background-gradient';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

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
	connectButtonClassName,
	disconnectButtonClassName,
	avatarClassName,
	children,
	statusPrefix,
}: SocialConnectionCardProps) => {
	const actionButtonClasses =
		'h-12 w-full cursor-pointer font-normal text-base text-white duration-300 ease-in-out hover:scale-105';
	const disconnectClasses = cn(
		actionButtonClasses,
		'bg-[#604ABB] hover:bg-[#4f3fa3]',
		disconnectButtonClassName,
	);
	const connectClasses = cn(
		actionButtonClasses,
		connectButtonClassName ?? 'bg-[#604ABB] hover:bg-[#4f3fa3]',
	);

	return (
		<BackgroundGradient className='rounded-[22px] bg-background p-2'>
			<Card className='mt-3 w-full gap-0 border-none bg-transparent p-0.5 sm:p-0'>
				<CardContent className='flex flex-col space-y-4 p-4'>
					<div className='flex flex-row items-center space-x-4'>
						<Avatar
							className={cn('relative ml-4 h-20 w-20 border-2 border-border', avatarClassName)}
						>
							{avatarSrc ? (
								<>
									<AvatarImage src={avatarSrc} alt={avatarAlt} className='object-cover' />
									<AvatarFallback>
										<Image
											src={fallbackSrc}
											alt='Default Icon'
											width={100}
											height={100}
											loading='lazy'
											className='h-full w-full object-cover'
										/>
									</AvatarFallback>
								</>
							) : (
								<AvatarFallback>
									<Image
										src={fallbackSrc}
										alt='Default Icon'
										width={100}
										height={100}
										loading='lazy'
										className='h-full w-full object-cover'
									/>
								</AvatarFallback>
							)}
						</Avatar>
						<div className='min-w-0 flex-1'>
							{connected ? (
								<span className='truncate font-bold text-2xl text-foreground'>{name}</span>
							) : isPrincipal ? (
								<span className='truncate font-bold text-2xl text-foreground'>
									Cuenta Principal
								</span>
							) : (
								<span className='truncate font-bold text-2xl text-foreground'>Cuenta Bot</span>
							)}
							<span className='block pt-1 text-sm'>
								{statusPrefix ?? 'Estado'}:{' '}
								{connected ? (
									<span className='text-emerald-500 dark:text-emerald-400'>{statusLabel}</span>
								) : (
									<span className='text-destructive'>No autenticado</span>
								)}
							</span>
						</div>
					</div>

					{!connected ? (
						<div className='flex flex-col items-center gap-3 rounded-2xl text-center'>
							<Button
								onClick={() => void onConnect()}
								disabled={isLoading || connectDisabled}
								className={connectClasses}
							>
								{isLoading ? (
									<div className='flex flex-row items-center justify-center space-x-3'>
										<span>Conectando</span>
										<ClipLoader color='#ffffff' size={20} />
									</div>
								) : (
									<span>{connectLabel}</span>
								)}
							</Button>
						</div>
					) : (
						<div className='space-y-4'>
							<div className='flex flex-col items-center gap-3'>
								<Button
									onClick={() => void onDisconnect()}
									disabled={isBusy}
									className={disconnectClasses}
								>
									{isBusy ? (
										<div className='flex flex-row items-center justify-center space-x-3'>
											<span>Procesando</span>
											<ClipLoader color='#ffffff' size={20} />
										</div>
									) : (
										<span>{disconnectLabel}</span>
									)}
								</Button>
							</div>

							{children}
						</div>
					)}
				</CardContent>
			</Card>
			<div className='relative'>
				<div className='-right-3 -top-10 -scale-x-100 absolute transform dark:hidden'>
					<BsMoonStarsFill
						className='absolute translate-x-1 translate-y-1 animate-pulse text-violet-300/55 blur-[0.4px] drop-shadow-[0_0_16px_rgba(168,85,247,0.18)]'
						size={62}
					/>
					<BsMoonStarsFill
						className='absolute animate-pulse text-violet-600/90 drop-shadow-[0_0_18px_rgba(124,58,237,0.28)]'
						size={60}
					/>
				</div>
				<div className='-right-3 -top-10 -scale-x-100 absolute hidden transform dark:block'>
					<BsMoonStarsFill
						className='absolute animate-pulse drop-shadow-[5px_0px_10px_rgba(255,255,255,0.5)]'
						size={60}
					/>
					<BsMoonStarsFill className='absolute animate-pulse' size={60} />
				</div>
			</div>
		</BackgroundGradient>
	);
};
