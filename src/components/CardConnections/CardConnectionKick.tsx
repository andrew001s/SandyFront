'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { ThinkingOrb } from 'thinking-orbs';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { BackgroundGradient } from '../ui/background-gradient';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { useKickAuthContext } from '@/context/KickAuthContext';

export const CardConnectionKick = () => {
	const {
		profile,
		status,
		tokensSaved,
		serviceStatus,
		isLoading,
		isBusy,
		handleConnect,
		handleDisconnect,
		handleToggleService,
		fetchProfile,
		refreshStatus,
	} = useKickAuthContext();

	useEffect(() => {
		void refreshStatus();
	}, [refreshStatus]);

	useEffect(() => {
		if (status && !profile) {
			fetchProfile().catch(() => {
				toast.error('No se pudo cargar el perfil de Kick');
			});
		}
	}, [status, profile, fetchProfile]);

	const isRunning = serviceStatus?.running === true;
	const isArmed = serviceStatus?.armed === true;
	const isMonitorActive = serviceStatus?.monitor_active === true;
	const primaryLabel = !status
		? isLoading
			? 'Conectando...'
			: 'Conectar con Kick'
		: isBusy
			? isRunning
				? 'Pausando...'
				: 'Iniciando...'
			: isRunning
				? 'Pausar servicios'
				: 'Iniciar servicios';
	const primaryAction = !status ? handleConnect : handleToggleService;

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
						<span className='truncate font-bold text-2xl text-foreground'>{profile?.username ?? 'Kick'}</span>
					</div>

					<div className='flex w-full flex-col justify-center'>
						<div className='flex flex-wrap gap-2'>
							<span className='rounded-full border border-border/70 bg-background/70 px-3 py-1 font-medium text-[11px] text-muted-foreground uppercase tracking-[0.18em]'>
								Kick
							</span>
							<span
								className={`rounded-full border px-3 py-1 font-medium text-[11px] uppercase tracking-[0.18em] ${
									status
										? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
										: 'border-border/70 bg-background/70 text-muted-foreground'
								}`}
							>
								{status ? 'Autenticado' : 'No autenticado'}
							</span>
							<span
								className={`rounded-full border px-3 py-1 font-medium text-[11px] uppercase tracking-[0.18em] ${
									tokensSaved
										? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
										: 'border-border/70 bg-background/70 text-muted-foreground'
								}`}
							>
								{tokensSaved ? 'Tokens guardados' : 'Tokens pendientes'}
							</span>
							<span
								className={`rounded-full border px-3 py-1 font-medium text-[11px] uppercase tracking-[0.18em] ${
									isRunning
										? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
										: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
								}`}
							>
								{isRunning ? 'Servicios activos' : 'Servicios pausados'}
							</span>
						</div>

						<div className='mt-4 grid grid-cols-1 gap-2 text-left sm:grid-cols-3'>
							<div className='rounded-2xl border border-border/70 bg-background/70 px-3 py-2 text-muted-foreground'>
								<p className='font-medium text-[11px] uppercase tracking-[0.18em]'>Automatización</p>
								<p className='text-sm'>{isArmed ? 'Armada' : 'No armada'}</p>
							</div>
							<div className='rounded-2xl border border-border/70 bg-background/70 px-3 py-2 text-muted-foreground'>
								<p className='font-medium text-[11px] uppercase tracking-[0.18em]'>Monitor</p>
								<p className='text-sm'>{isMonitorActive ? 'Activo' : 'Inactivo'}</p>
							</div>
							<div className='rounded-2xl border border-border/70 bg-background/70 px-3 py-2 text-muted-foreground'>
								<p className='font-medium text-[11px] uppercase tracking-[0.18em]'>Cuenta</p>
								<p className='text-sm'>{profile?.username ?? 'Pendiente'}</p>
							</div>
						</div>

						<div className='mt-4 flex flex-col gap-3 sm:flex-row'>
							<Button
								onClick={() => void primaryAction()}
								className='mx-auto h-16 w-full cursor-pointer bg-[#604ABB] font-normal text-white text-xl duration-300 ease-in-out hover:scale-105 hover:bg-[#4f3fa3]'
								disabled={isLoading || isBusy}
							>
								{isLoading || isBusy ? (
									<div className='flex flex-row items-center justify-center space-x-3'>
										<span className='pl-2'>{primaryLabel}</span>
										<div className='flex size-6 items-center justify-center'>
											<ThinkingOrb state='solving' size={64} speed={0.55} />
										</div>
									</div>
								) : (
									<span>{primaryLabel}</span>
								)}
							</Button>
							{status ? (
								<Button
									onClick={() => void handleDisconnect()}
									variant='outline'
									className='mx-auto h-16 w-full cursor-pointer font-normal text-xl duration-300 ease-in-out hover:scale-105'
									disabled={isLoading || isBusy}
								>
									<span>Cerrar sesión Kick</span>
								</Button>
							) : null}
						</div>
					</div>
				</CardContent>
			</Card>
		</BackgroundGradient>
	);
};
