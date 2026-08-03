'use client';

import { ConnectionCardSkeleton } from '@/components/loading/dashboard-skeletons';
import { useYoutubeAuthContext } from '@/context/YoutubeAuthContext';
import Image from 'next/image';
import { useState } from 'react';
import { BsMoonStarsFill } from 'react-icons/bs';
import { FaYoutube } from 'react-icons/fa';
import { ClipLoader } from 'react-spinners';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { BackgroundGradient } from '../ui/background-gradient';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';

export const CardConnectionYoutube = () => {
	const {
		profile,
		status,
		tokensAuthenticated,
		serviceStatus,
		isLoading,
		isBusy,
		isRefreshing,
		handleConnect,
		handleDisconnect,
		handleToggleService,
		handleSendTestMessage,
		handleUpdateBroadcast,
	} = useYoutubeAuthContext();

	const [testMessage, setTestMessage] = useState('');
	const [broadcastTitle, setBroadcastTitle] = useState('');
	const [isSendingMessage, setIsSendingMessage] = useState(false);
	const [isUpdatingBroadcast, setIsUpdatingBroadcast] = useState(false);

	const connected = tokensAuthenticated || status;
	const broadcastId = profile?.broadcast_id ?? serviceStatus?.youtube_broadcast_id;
	const channelName =
		profile?.channel_title ??
		profile?.username ??
		serviceStatus?.youtube_channel_title ??
		'YouTube';

	if (isRefreshing) {
		return <ConnectionCardSkeleton />;
	}

	const handleSendMessage = async () => {
		const message = testMessage.trim();
		if (!message) return;
		setIsSendingMessage(true);
		try {
			await handleSendTestMessage(message);
			setTestMessage('');
		} finally {
			setIsSendingMessage(false);
		}
	};

	const handleUpdateTitle = async () => {
		const title = broadcastTitle.trim();
		if (!title || !broadcastId) return;
		setIsUpdatingBroadcast(true);
		try {
			await handleUpdateBroadcast({ broadcast_id: broadcastId, title });
			setBroadcastTitle('');
		} finally {
			setIsUpdatingBroadcast(false);
		}
	};

	return (
		<BackgroundGradient className='rounded-[22px] bg-background p-2'>
			<Card className='mt-3 w-full gap-0 border-none bg-transparent p-0.5 sm:p-0'>
				<CardContent className='flex flex-col space-y-4 p-4'>
					<div className='flex flex-row items-center space-x-4'>
						<Avatar className='ml-4 h-20 w-20 border-2 border-border'>
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
						<div className='min-w-0 flex-1'>
							<div className='flex items-center gap-2'>
								<FaYoutube className='size-5 shrink-0 text-[#FF0000]' />
								<span className='truncate font-bold text-2xl text-foreground'>{channelName}</span>
							</div>
							<span className='block pt-1 text-sm'>
								Estado:{' '}
								{connected ? (
									<span className='text-emerald-500 dark:text-emerald-400'>Autenticado</span>
								) : (
									<span className='text-destructive'>No autenticado</span>
								)}
							</span>
						</div>
					</div>

					{!connected ? (
						<div className='flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-background/80 p-5 text-center'>
							<p className='text-muted-foreground text-sm'>
								Conecta tu cuenta de YouTube para que Sandy lea el live chat, responda por voz y
								actualice tu broadcast. Se abrirá una ventana de Google para autorizar el acceso.
							</p>
							<Button
								onClick={() => void handleConnect()}
								disabled={isLoading}
								className='h-12 w-full cursor-pointer bg-[#FF0000] font-normal text-base text-white duration-300 ease-in-out hover:scale-105 hover:bg-[#cc0000]'
							>
								{isLoading ? (
									<div className='flex flex-row items-center justify-center space-x-3'>
										<span>Conectando</span>
										<ClipLoader color='#ffffff' size={20} />
									</div>
								) : (
									<span>Conectar con YouTube</span>
								)}
							</Button>
						</div>
					) : (
						<div className='space-y-4'>
							<div className='flex flex-col items-center gap-3'>
								<Button
									onClick={() => void handleToggleService()}
									disabled={isBusy}
									className='h-12 w-full cursor-pointer bg-[#604ABB] font-normal text-base text-white duration-300 ease-in-out hover:scale-105 hover:bg-[#4f3fa3]'
								>
									{isBusy ? (
										<div className='flex flex-row items-center justify-center space-x-3'>
											<span>Procesando</span>
											<ClipLoader color='#ffffff' size={20} />
										</div>
									) : serviceStatus?.running ? (
										<span>Pausar servicios</span>
									) : (
										<span>Iniciar servicios</span>
									)}
								</Button>
								<span className='text-muted-foreground text-xs'>
									Monitor: {serviceStatus?.running ? 'activo' : 'apagado'}
									{serviceStatus?.armed ? ' · armado' : ''}
								</span>
							</div>

							<div className='flex flex-col items-center gap-3'>
								<Button
									onClick={() => void handleDisconnect()}
									disabled={isBusy}
									variant='outline'
									className='h-11 w-full cursor-pointer font-normal text-base text-destructive duration-300 ease-in-out hover:bg-destructive/10 hover:text-destructive'
								>
									Cerrar sesión YouTube
								</Button>
								<span className='text-muted-foreground text-xs'>
									Desconecta la cuenta de Google vinculada a Sandy.
								</span>
							</div>

							<div className='space-y-2 rounded-2xl border border-border/70 bg-background/80 p-4'>
								<label
									className='font-medium text-foreground text-sm'
									htmlFor='youtube-test-message'
								>
									Mensaje de prueba al live chat
								</label>
								<div className='flex items-center gap-2'>
									<Input
										id='youtube-test-message'
										value={testMessage}
										onChange={(e) => setTestMessage(e.target.value)}
										placeholder='Ej: ¡Hola chat!'
										disabled={isSendingMessage}
										onKeyDown={(e) => {
											if (e.key === 'Enter') void handleSendMessage();
										}}
									/>
									<Button
										onClick={() => void handleSendMessage()}
										disabled={isSendingMessage || !testMessage.trim()}
									>
										Enviar
									</Button>
								</div>
							</div>

							{broadcastId && (
								<div className='space-y-2 rounded-2xl border border-border/70 bg-background/80 p-4'>
									<label
										className='font-medium text-foreground text-sm'
										htmlFor='youtube-broadcast-title'
									>
										Actualizar título del stream
									</label>
									<div className='flex items-center gap-2'>
										<Input
											id='youtube-broadcast-title'
											value={broadcastTitle}
											onChange={(e) => setBroadcastTitle(e.target.value)}
											placeholder='Nuevo título'
											disabled={isUpdatingBroadcast}
											onKeyDown={(e) => {
												if (e.key === 'Enter') void handleUpdateTitle();
											}}
										/>
										<Button
											onClick={() => void handleUpdateTitle()}
											disabled={isUpdatingBroadcast || !broadcastTitle.trim()}
										>
											Actualizar
										</Button>
									</div>
								</div>
							)}
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
