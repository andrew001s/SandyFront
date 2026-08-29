'use client';

import { getTokens } from '@/api/fetchAuth';
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
import { useAuth } from '@clerk/nextjs';
import { Power } from 'lucide-react';
import { useRouter } from 'next/navigation';
import posthog from 'posthog-js';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ThinkingOrb } from 'thinking-orbs';

export function ServiceStartCard() {
	const router = useRouter();
	const { setStatus } = useStatus();
	const [isBusy, setIsBusy] = useState(false);
	const [isStopConfirmOpen, setIsStopConfirmOpen] = useState(false);
	const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
	const { isLoaded, isSignedIn } = useAuth();
	const {
		serviceStatus,
		isRunning,
		hasLoaded: hasLoadedStatus,
		hasError: statusError,
		refresh: refreshStatus,
	} = useServiceStatus();

	// Se mide "ya intentamos cargar", no "tenemos datos": si /service-status falla,
	// el esqueleto tiene que irse igual en vez de quedarse para siempre.
	const statusLoaded = hasLoadedStatus && isConfigured !== null;

	// Las peticiones van con el token de Clerk que inyecta backendClient leyendo
	// window.Clerk. Al montar puede no estar hidratado todavía: si se disparaban
	// igual, volvían 401 y la tarjeta quedaba en su estado inicial hasta que el
	// usuario navegaba a otra ruta y volvía.
	useEffect(() => {
		if (!isLoaded || !isSignedIn) {
			return;
		}

		let active = true;
		getTokens(false)
			.then((stored) => {
				if (active) {
					setIsConfigured(Boolean(stored?.tokens?.token && stored?.tokens?.refresh_token));
				}
			})
			.catch(() => {
				if (active) {
					setIsConfigured(false);
				}
			});
		return () => {
			active = false;
		};
	}, [isLoaded, isSignedIn]);

	const handleStart = async () => {
		try {
			setIsBusy(true);
			const stored = await getTokens(false);
			if (!stored?.tokens?.token || !stored?.tokens?.refresh_token) {
				setIsConfigured(false);
				toast.error('Conecta primero tu cuenta principal de Twitch para iniciar el servicio');
				return;
			}
			await start(false);
			posthog.capture('twitch_service_started');
			markServiceStarted();
			setStatus(true);
			await refreshStatus();
			toast.success('Servicios iniciados');
		} catch (error) {
			// El backend devuelve un código estable: se muestra el motivo real
			// (sin vincular, hay que reautorizar, falta canal...) en vez de un
			// "no se pudo" que no dice qué arreglar.
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
			// Corta lo que siguiera en vuelo: respuesta generándose, voz
			// sintetizándose, audio encolado y la boca del modelo.
			stopServiceRuntime();
			// Antes solo se marcaba al arrancar: el estado global se quedaba en
			// activo tras pausar y todo lo que dependía de él seguía habilitado.
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
		? 'border-border/70 bg-background/80 text-muted-foreground'
		: !isConfigured || isStatusUnknown
			? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
			: active
				? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
				: 'border-border/70 bg-background/80 text-muted-foreground';

	const description = !statusLoaded
		? 'Consultando el estado del servicio...'
		: isConfigured === false
			? 'Conecta tu cuenta principal de Twitch para iniciar.'
			: isStatusUnknown
				? 'No se pudo consultar el estado. Reintentando...'
				: active
					? 'La VTuber está activa y responde a tu chat.'
					: 'Inicia la VTuber para que responda a tu chat.';
	const actionLabel = isBusy
		? isRunning
			? 'Pausando...'
			: 'Iniciando...'
		: active
			? 'Pausar servicios'
			: 'Iniciar servicios';

	if (!statusLoaded) {
		return <ServiceStartSkeleton />;
	}

	return (
		<>
			<button
				type='button'
				onClick={handleClick}
				disabled={isBusy}
				className={cn(
					'group relative flex h-full flex-col items-center gap-3 overflow-hidden rounded-2xl border p-5 text-center outline-none transition-all focus-visible:ring-2 focus-visible:ring-violet-500/50',
					active
						? 'border-violet-500/30 bg-violet-500/5 hover:border-violet-500/50 hover:bg-violet-500/10'
						: 'border-border/60 bg-background/60 hover:border-border hover:bg-accent/50',
				)}
			>
				<div
					className='pointer-events-none absolute inset-0 opacity-60'
					style={{
						backgroundImage:
							'linear-gradient(to right, rgba(139,92,246,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(139,92,246,0.08) 1px, transparent 1px)',
						backgroundSize: '18px 18px',
					}}
				/>
				<span
					className={cn(
						'absolute top-3 right-3 flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-medium text-[10px] uppercase tracking-wide',
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
										? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)]'
										: 'bg-muted-foreground',
						)}
					/>
					{pillLabel}
				</span>
				<div
					className={cn(
						'mt-5 flex size-12 items-center justify-center rounded-2xl border shadow-sm transition-colors',
						active
							? 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-[#A78BFA]'
							: 'border-border/70 bg-background/80 text-muted-foreground',
					)}
				>
					{isBusy ? (
						<ThinkingOrb state='solving' size={64} speed={0.55} />
					) : (
						<Power className='size-6' />
					)}
				</div>
				<div className='relative z-10'>
					<p className='font-medium text-sm'>Servicio de la VTuber</p>
					<p className='text-muted-foreground text-xs'>{description}</p>
					<p className='mt-4 font-medium text-foreground text-sm'>{actionLabel}</p>
				</div>
			</button>

			<Dialog open={isStopConfirmOpen} onOpenChange={setIsStopConfirmOpen}>
				<DialogContent className='w-[min(92vw,26rem)]'>
					<DialogHeader>
						<DialogTitle>¿Pausar servicios?</DialogTitle>
						<DialogDescription>
							Se detendrán chat, EventSub y monitor, pero la sesión de Twitch permanecerá activa.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							type='button'
							variant='outline'
							onClick={() => setIsStopConfirmOpen(false)}
							disabled={isBusy}
						>
							Cancelar
						</Button>
						<Button
							type='button'
							variant='destructive'
							onClick={() => void handleStop()}
							disabled={isBusy}
						>
							{isBusy ? 'Pausando...' : 'Pausar servicios'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
