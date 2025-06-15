'use client';
import { getTokens, postAuth } from '@/api/fetchAuth';
import { start } from '@/api/sandycore';
import { useTwitchAuthContext } from '@/context/TwitchAuthContext';
import Image from 'next/image';
import { useEffect } from 'react';
import { BsMoonStarsFill } from 'react-icons/bs';
import { ClipLoader } from 'react-spinners';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { BackgroundGradient } from '../ui/background-gradient';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { useMessages } from '@/context/MessagesContext';

export const CardConnectionProfile = () => {
	const { addMessage } = useMessages();
	
	const {
		profile,
		status,
		isLoading,
		setIsLoading,
		handleStart,
		handleClose,
		fetchProfile,
		setStatus,
	} = useTwitchAuthContext();

	useEffect(() => {
		if (status && !profile) {
			fetchProfile();
		}
	}, [status, profile, fetchProfile]);

	const handleStartConnection = async () => {
		const tokens = await getTokens(false);
		if (!tokens.tokens || !tokens.tokens.token || !tokens.tokens.refresh_token) {
			handleStart(false);
		} else {
			try {
				setIsLoading(true);
				await postAuth({
					token: tokens.tokens.token,
					refresh_token: tokens.tokens.refresh_token,
					bot: false,
				});
				await start(false);
				setStatus(true);
				await fetchProfile();
				addMessage({
					 type: 'chat',
					content: `Conectado a Twitch como ${profile?.username}`,
					timestamp: new Date().toISOString(),
				});
				toast.success('Conectado a Twitch');
			} catch (error) {
				console.error('Error al reconectar:', error);
				addMessage({
					type: 'chat',
					content: 'Error al reconectar, iniciando nuevo proceso de autenticación',
					timestamp: new Date().toISOString(),
				});
				toast.error('Error al reconectar, iniciando nuevo proceso de autenticación');
				handleStart(false);
			} finally {
				setIsLoading(false);
			}
		}
	};

	return (
		<BackgroundGradient className='rounded-[22px] bg-white p-2 dark:bg-zinc-900'>
			<Card className='mt-3 w-full gap-0 border-none bg-card p-0.5 sm:p-0'>
				<CardContent className='flex flex-col space-y-4 p-4 sm:flex-row sm:items-center sm:space-x-4'>
					<div className='flex flex-row items-center space-x-4 sm:justify-center'>
						<Avatar className='ml-4 h-28 w-28 border-2 border-foreground'>
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
						<span className='truncate font-bold text-2xl text-foreground'>{profile?.username}</span>
					</div>

					<div className='flex w-full flex-col justify-center'>
						{status ? (
							<Button
								onClick={handleClose}
								className='mx-auto h-16 w-full cursor-pointer bg-chart-1 font-normal text-foreground text-xl duration-300 ease-in-out hover:scale-105 hover:bg-chart-1'
							>
								<span>Desconectar</span>
							</Button>
						) : (
							<Button
								onClick={handleStartConnection}
								className='mx-auto h-16 w-xs cursor-pointer bg-chart-1 font-normal text-foreground text-xl duration-300 ease-in-out hover:scale-105 hover:bg-chart-1'
								disabled={isLoading}
							>
								{isLoading ? (
									<div className='flex flex-row items-center justify-center space-x-3'>
										<span className='pl-2'>Conectando</span>
										<ClipLoader color='#ffffff' size={20} className='animate-spin' />
									</div>
								) : (
									<span>Conectar con Twitch</span>
								)}
							</Button>
						)}
						<span className='pt-2 text-xl'>
							Estado:{' '}
							{status ? (
								<span className='text-chart-2'>Conectado</span>
							) : (
								<span className='text-chart-5'>Desconectado</span>
							)}
						</span>
					</div>
				</CardContent>
				<div className='relative'>
					<BsMoonStarsFill
						className='-right-3 -top-10 -scale-x-100 absolute transform animate-pulse drop-shadow-[5px_0px_10px_rgba(255,255,255,0.5)]'
						size={60}
					/>
					<BsMoonStarsFill
						className='-right-3 -top-10 -scale-x-100 absolute transform animate-pulse'
						size={60}
					/>
				</div>
			</Card>
		</BackgroundGradient>
	);
};
