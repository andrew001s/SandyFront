'use client';

import { start, stop } from '@/api/sandycore';
import { ServiceStartSkeleton } from '@/components/loading/dashboard-skeletons';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { useStatus } from '@/context/StatusContext';
import { useServiceStatus } from '@/hooks/useServiceStatus';
import { getAiErrorCode, getAiErrorMessage } from '@/lib/ai-errors';
import { markServiceStarted, stopServiceRuntime } from '@/lib/serviceRuntime';
import { cn } from '@/lib/utils';
import { AlertTriangle, Pause, Play, Power } from 'lucide-react';
import { useRouter } from 'next/navigation';
import posthog from 'posthog-js';
import { useState } from 'react';
import { toast } from 'sonner';
import { ThinkingOrb } from 'thinking-orbs';

export function ServiceStartCard() {
	const router = useRouter();
	const { setStatus } = useStatus();
	const [isBusy, setIsBusy] = useState(false);
	const [isStopConfirmOpen, setIsStopConfirmOpen] = useState(false);
	const {
		serviceStatus,
		isRunning,
		hasLoaded: hasLoadedStatus,
		hasError: statusError,
		refresh: refreshStatus,
	} = useServiceStatus();

	const statusLoaded = hasLoadedStatus;

	const isConfigured = serviceStatus?.platforms
		? Boolean(
				serviceStatus.platforms.twitch?.connected ||
					serviceStatus.platforms.kick?.connected ||
					serviceStatus.platforms.youtube?.connected,
			)
		: hasLoadedStatus
			? false
			: null;

	const handleStart = async () => {
		try {
			setIsBusy(true);
			await start(false);
			posthog.capture('twitch_service_started');
			markServiceStarted();
			setStatus(true);
			await refreshStatus();
			toast.success('Servicios iniciados');
		} catch (error) {
			console.error('Error al iniciar servicios:', error);
			toast.error(getAiErrorMessage(error));
			posthog.capture('twitch_service_start_failed', { code: getAiErrorCode(error) });
		} finally {
			setIsBusy(false);
		}
	};

	const handleStop = async () => {
		try {
			setIsBusy(true);
			await stop(false);
			posthog.capture('twitch_service_paused');
			stopServiceRuntime();
			setStatus(false);
			await refreshStatus();
			toast.success('Servicios pausados');
		} catch (error) {
			console.error('Error al detener servicios:', error);
			toast.error('No se pudieron detener los servicios');
		} finally {
			setIsBusy(false);
			setIsStopConfirmOpen(false);
		}
	};

	const handleClick = () => {
		if (isRunning) {
			setIsStopConfirmOpen(true);
			return;
		}
		if (isConfigured === false) {
			router.push('/conexiones');
			return;
		}
		void handleStart();
	};

	const active = isRunning;
	const isStatusUnknown = statusError && serviceStatus === null;
	const pillLabel = !statusLoaded
		? 'Verificando'
		: !isConfigured
			? 'Sin conexión'
			: isStatusUnknown
				? 'Sin datos'
				: active
					? 'Activo'
					: 'Inactivo';

	const pillTone = !statusLoaded
		? 'border-border bg-background text-muted-foreground'
		: !isConfigured || isStatusUnknown
			? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
			: active
				? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
				: 'border-border bg-background text-muted-foreground';

	const description = !statusLoaded
		? 'Consultando el estado del servicio...'
		: isConfigured === false
			? 'Conecta al menos una cuenta (Twitch, Kick o YouTube) para iniciar.'
			: isStatusUnknown
				? 'No se pudo consultar el estado. Reintentando...'
				: active
					? 'La VTuber está activa y procesando eventos del stream.'
					: 'Inicia la VTuber para que comience a interactuar con tu chat.';

	if (!statusLoaded) {
		return <ServiceStartSkeleton />;
	}

	return (
		<>
			<div
				className={cn(
					'group relative flex h-full min-h-[200px] flex-col justify-between rounded-xl border p-5 transition-all duration-200',
					active
						? 'border-primary/40 bg-card shadow-xs'
						: 'border-border bg-card hover:border-primary/30',
				)}
			>
				<div>
					<div className='flex items-center justify-between'>
						<div
							className={cn(
								'flex size-10 items-center justify-center rounded-lg border transition-colors',
								active
									? 'border-primary/40 bg-primary/10 text-primary'
									: 'border-border bg-background text-muted-foreground',
							)}
						>
							{isBusy ? (
								<ThinkingOrb state='solving' size={64} speed={0.55} />
							) : (
								<Power className='size-5' />
							)}
						</div>
						<span
							className={cn(
								'flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider',
								pillTone,
							)}
						>
							<span
								className={cn(
									'size-1.5 rounded-full',
									!statusLoaded
										? 'bg-muted-foreground'
										: !isConfigured || isStatusUnknown
											? 'bg-amber-500'
											: active
												? 'animate-pulse bg-emerald-400'
												: 'bg-muted-foreground/60',
								)}
							/>
							{pillLabel}
						</span>
					</div>

					<div className='mt-4'>
						<h3 className='font-display font-semibold text-base text-foreground'>
							Servicio de Emisión
						</h3>
						<p className='mt-1 font-sans text-muted-foreground text-xs leading-relaxed'>
							{description}
						</p>
					</div>
				</div>

				<div className='mt-5'>
					<Button
						type='button'
						onClick={handleClick}
						disabled={isBusy}
						className={cn(
							'h-9 w-full rounded-lg font-sans font-semibold text-xs transition-all',
							active
								? 'border border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground'
								: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
						)}
					>
						{isBusy ? (
							<span>{active ? 'Pausando...' : 'Iniciando...'}</span>
						) : active ? (
							<>
								<Pause size={14} />
								<span>Pausar servicios</span>
							</>
						) : (
							<>
								<Play size={14} className='fill-current' />
								<span>{isConfigured === false ? 'Ir a Conexiones' : 'Iniciar servicios'}</span>
							</>
						)}
					</Button>
				</div>
			</div>

			<Dialog open={isStopConfirmOpen} onOpenChange={setIsStopConfirmOpen}>
				<DialogContent className='w-[min(92vw,26rem)] border-border/80 bg-card p-6 shadow-2xl'>
					<DialogHeader className='gap-2 p-0 text-left'>
						<div className='flex size-10 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10 text-destructive'>
							<AlertTriangle className='size-5' />
						</div>
						<DialogTitle className='font-display font-semibold text-foreground text-lg'>
							¿Pausar servicios?
						</DialogTitle>
						<DialogDescription className='font-sans text-muted-foreground text-xs leading-relaxed'>
							Se detendrán el chat, EventSub y el monitor en vivo, pero tu sesión y configuración
							permanecerán guardadas.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className='mt-4 flex flex-row items-center justify-end gap-2.5 p-0'>
						<Button
							type='button'
							variant='outline'
							onClick={() => setIsStopConfirmOpen(false)}
							disabled={isBusy}
							className='h-9 rounded-lg px-4 font-sans text-xs'
						>
							Cancelar
						</Button>
						<Button
							type='button'
							variant='destructive'
							onClick={() => void handleStop()}
							disabled={isBusy}
							className='h-9 rounded-lg px-4 font-sans font-semibold text-xs shadow-xs'
						>
							{isBusy ? 'Pausando...' : 'Confirmar pausa'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
