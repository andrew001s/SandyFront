import { getTokens, postAuth } from '@/api/fetchAuth';
import { start } from '@/api/sandycore';
import { useTwitchAuthContext } from '@/context/TwitchAuthContext';
import { useEffect } from 'react';
import { BsMoonStarsFill } from 'react-icons/bs';
import { TailSpin } from 'react-loader-spinner';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Card } from './ui/card';

export const ConnectionCard = () => {
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
				toast.success('Conectado a Twitch');
			} catch (error) {
				console.error('Error al reconectar:', error);
				toast.error('Error al reconectar, iniciando nuevo proceso de autenticación');
				handleStart(false);
			} finally {
				setIsLoading(false);
			}
		}
	};

	return (
		<Card
			className='mt-3 w-full gap-0 p-0.5'
			style={{ background: 'linear-gradient(90deg, #3A265E, #4B367C)' }}
		>
			<div className='flex flex-row items-center justify-between p-4'>
				<div className='flex flex-row items-center justify-center space-x-4'>
					<Avatar className='ml-4 h-28 w-28 border-2 border-foreground'>
						<AvatarImage src={profile?.picProfile} />
						<AvatarFallback>
							{/* biome-ignore lint/nursery/noImgElement: React Vite */}
							<img
								src='/icons/default.png'
								alt='Default Icon'
								className='h-full w-full object-cover'
							/>
						</AvatarFallback>
					</Avatar>
					<span className='font-bold text-2xl text-foreground'>{profile?.username}</span>
				</div>

				<div className='mx-4 flex flex-col justify-center'>
					{status ? (
						<Button
							onClick={handleClose}
							className='mx-auto h-16 w-xs cursor-pointer bg-chart-1 font-normal text-foreground text-xl hover:bg-chart-1'
						>
							<span>Desconectar</span>
						</Button>
					) : (
						<Button
							onClick={handleStartConnection}
							className='mx-auto h-16 w-xs cursor-pointer bg-chart-1 font-normal text-foreground text-xl hover:bg-chart-1'
							disabled={isLoading}
						>
							{isLoading ? (
								<div className='flex flex-row items-center justify-center space-x-3'>
									<span className='pl-2'>Conectando</span>
									<TailSpin
										height={24}
										width={24}
										color='#ffffff'
										ariaLabel='loading'
										visible={true}
									/>
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
			</div>
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
	);
};
