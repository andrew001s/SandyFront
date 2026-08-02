'use client';

import { useKickAuthContext } from '@/context/KickAuthContext';
import Image from 'next/image';
import { useEffect } from 'react';
import { BsMoonStarsFill } from 'react-icons/bs';
import { ClipLoader } from 'react-spinners';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { BackgroundGradient } from '../ui/background-gradient';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

export const CardConnectionKick = () => {
	const { profile, status, isLoading, handleConnect, handleDisconnect, fetchProfile } =
		useKickAuthContext();

	useEffect(() => {
		if (status && !profile) {
			fetchProfile().catch(() => {
				toast.error('No se pudo cargar el perfil de Kick');
			});
		}
	}, [status, profile, fetchProfile]);

	return (
		<BackgroundGradient className='rounded-[22px] bg-background p-2'>
			<Card className='mt-3 w-full gap-0 border-none bg-transparent p-0.5 sm:p-0'>
				<CardContent className='flex flex-col space-y-4 p-4 sm:flex-row sm:items-center sm:space-x-4'>
					<div className='flex flex-row items-center space-x-4 sm:justify-center'>
						<Avatar className='ml-4 h-28 w-28 border-2 border-border'>
							<AvatarImage src={profile?.picProfile} />
							<AvatarFallback>
								<Image
									src='/icons/default.png'
									alt='Default Icon'
									width={100}
									height={100}
									loading='lazy'
									className='h-full w-full object-cover'
								/>
							</AvatarFallback>
						</Avatar>
						<span className='truncate font-bold text-2xl text-foreground'>{profile?.username ?? ''}</span>
					</div>

					<div className='flex w-full flex-col justify-center'>
						{status ? (
							<Button
								onClick={() => void handleDisconnect()}
								className='mx-auto h-16 w-full cursor-pointer bg-[#604ABB] font-normal text-white text-xl duration-300 ease-in-out hover:scale-105 hover:bg-[#4f3fa3]'
							>
								<span>Cerrar sesión Kick</span>
							</Button>
						) : (
							<Button
								onClick={() => void handleConnect()}
								className='mx-auto h-16 w-xs cursor-pointer bg-[#604ABB] font-normal text-white text-xl duration-300 ease-in-out hover:scale-105 hover:bg-[#4f3fa3]'
								disabled={isLoading}
							>
								{isLoading ? (
									<div className='flex flex-row items-center justify-center space-x-3'>
										<span className='pl-2'>Conectando</span>
										<ClipLoader color='#ffffff' size={20} className='animate-spin' />
									</div>
								) : (
									<span>Conectar con Kick</span>
								)}
							</Button>
						)}
						<span className='pt-2 text-xl'>
							Estado de Kick:{' '}
							{status ? (
								<span className='text-emerald-500 dark:text-emerald-400'>Autenticado</span>
							) : (
								<span className='text-destructive'>No autenticado</span>
							)}
						</span>
					</div>
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
