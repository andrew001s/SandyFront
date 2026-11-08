'use client';

import type { SupportCheckout } from '@/api/support';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useSupportPurchase } from '@/context/SupportPurchaseContext';
import { KOFI_URL } from '@/lib/links';
import axios from 'axios';
import { ArrowLeft, CheckCircle2, Coffee, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

const triggerClass =
	'inline-flex h-8 items-center gap-1.5 rounded-lg bg-secondary px-2.5 font-semibold text-secondary-foreground text-xs transition-colors hover:bg-secondary/85 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 sm:h-9 sm:gap-2 sm:px-3';
const primaryClass =
	'min-h-12 w-full whitespace-normal bg-primary font-semibold text-primary-foreground hover:bg-[#5948D1] dark:hover:bg-[#A594FF] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100';
const failureMessage = (error: unknown) =>
	axios.isAxiosError(error) && typeof error.response?.data?.detail === 'string'
		? error.response.data.detail
		: error instanceof Error
			? error.message
			: 'No se pudo completar la solicitud. Inténtalo de nuevo.';

type View = 'choice' | 'code';

function SupportDialog({
	purchase,
	open,
	onOpenChange,
}: {
	purchase: NonNullable<ReturnType<typeof useSupportPurchase>>;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [view, setView] = useState<View>('choice');
	const [code, setCode] = useState('');
	const [checkout, setCheckout] = useState<SupportCheckout | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const operation = useRef(0);
	const buyRef = useRef<HTMLButtonElement>(null);
	const returnFocus = useRef(false);

	useEffect(
		() => () => {
			operation.current++;
		},
		[],
	);

	useEffect(() => {
		if (open && view === 'code' && !busy) inputRef.current?.focus();
		if (open && view === 'choice' && returnFocus.current) {
			buyRef.current?.focus();
			returnFocus.current = false;
		}
	}, [open, view, busy]);

	const changeOpen = (next: boolean) => {
		onOpenChange(next);
		if (!next) {
			operation.current++;
			setView('choice');
			setCode('');
			setCheckout(null);
			setError(null);
			setBusy(false);
		}
	};

	const run = async (action: (isCurrent: () => boolean) => Promise<void>) => {
		const request = ++operation.current;
		const isCurrent = () => request === operation.current;
		setBusy(true);
		setError(null);
		try {
			await action(isCurrent);
		} catch (failure) {
			if (isCurrent()) setError(failureMessage(failure));
		} finally {
			if (isCurrent()) setBusy(false);
		}
	};

	const isActive = Boolean(purchase.status?.watermark_free);
	const isReview = purchase.status?.state === 'review';
	const isAvailable = Boolean(purchase.status?.available);
	const startCheckout = () => {
		if (busy) return;
		// Reserve the tab during the click so browsers allow the asynchronous checkout redirect.
		const tab = window.open('about:blank', '_blank');
		if (tab) tab.opener = null;
		void run(async (isCurrent) => {
			try {
				const result = await purchase.checkout();
				if (!isCurrent()) {
					tab?.close();
					return;
				}
				if (result.already_owned) {
					tab?.close();
					return;
				}
				if (!result.checkout_url) throw new Error('No se pudo abrir Ko-fi. Inténtalo de nuevo.');
				setCheckout(result);
				setView('code');
				if (tab && !tab.closed) tab.location.replace(result.checkout_url);
			} catch (failure) {
				tab?.close();
				throw failure;
			}
		});
	};

	return (
		<Dialog open={open} onOpenChange={changeOpen}>
			<DialogContent className='max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-[510px] gap-0 overflow-y-auto overflow-x-hidden p-0 [&>button>svg]:mx-auto [&>button]:top-3.5 [&>button]:right-3.5 [&>button]:z-20 [&>button]:size-11 [&>button]:rounded-md [&>button]:bg-[#0E1022] [&>button]:text-white [&>button]:opacity-100 [&>button]:hover:bg-[#262A4D] [&>button]:hover:text-white'>
				<div className='relative h-36 w-full overflow-hidden sm:h-44'>
					<Image
						src={
							view === 'choice'
								? '/support/sandy-plus-clouds.webp'
								: '/support/sandy-plus-code.webp'
						}
						alt={
							view === 'choice'
								? 'Sandy con una taza entre nubes, estrellas y una luna creciente'
								: 'Sandy sostiene una estrella luminosa entre las nubes'
						}
						fill
						sizes='(max-width: 640px) 92vw, 510px'
						priority
						className='select-none object-cover object-center'
					/>
				</div>

				<div className='space-y-5 px-5 pt-5 pb-6 sm:px-6'>
					{view === 'choice' ? (
						<>
							<div className='space-y-1.5'>
								<DialogTitle className='font-display text-xl'>Apoya Sandy Studio</DialogTitle>
								<DialogDescription className='text-sm leading-relaxed'>
									Elige Sandy Plus para quitar el aviso de apoyo o aporta voluntariamente.
								</DialogDescription>
							</div>

							{purchase.loading ? (
								<p className='text-muted-foreground text-sm'>Comprobando tu cuenta…</p>
							) : isActive ? (
								<output className='flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 p-3.5'>
									<CheckCircle2
										aria-hidden
										className='mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400'
									/>
									<span>
										<span className='block font-semibold text-sm'>Sandy Plus activado</span>
										<span className='mt-1 block text-muted-foreground text-sm'>
											La marca de agua se retirará automáticamente de tu estudio y de tus overlays
											de OBS. No necesitas cambiar tus enlaces.
										</span>
										<span className='mt-2 block text-muted-foreground text-xs'>
											La sincronización puede tardar hasta 15 segundos con conexión.
										</span>
									</span>
								</output>
							) : (
								<div className='space-y-3'>
									<div className='space-y-1'>
										<p className='font-semibold text-sm'>Un solo pago, en toda tu cuenta</p>
										<p className='text-muted-foreground text-sm leading-relaxed'>
											Retira el aviso de apoyo en PNG, 2D, 3D y OBS. Las funciones de Sandy siguen
											siendo gratuitas.
										</p>
									</div>

									{isReview && (
										<p
											role='alert'
											className='rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm'
										>
											Tu pago necesita revisión. Contacta al creador con tu recibo antes de volver a
											pagar.
										</p>
									)}
									{!isAvailable && !purchase.loading && (
										<p className='text-muted-foreground text-sm'>
											Sandy Plus todavía no está disponible. Puedes seguir usando Sandy y apoyar
											voluntariamente.
										</p>
									)}
								</div>
							)}

							<div className='grid gap-2.5'>
								{!isActive && (
									<Button
										ref={buyRef}
										type='button'
										disabled={busy || purchase.loading || !isAvailable}
										aria-busy={busy}
										onClick={startCheckout}
										className={`${primaryClass} h-auto flex-wrap justify-between gap-x-3 gap-y-1 px-4 py-3`}
									>
										<span>Obtener Sandy Plus</span>
										<span className='text-xs'>US$3 · pago único</span>
									</Button>
								)}
								<a
									href={KOFI_URL}
									target='_blank'
									rel='noopener noreferrer'
									className='inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 font-medium text-foreground text-sm transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2'
								>
									<Coffee aria-hidden className='size-4 text-primary' />
									Apoyar voluntariamente
									<ExternalLink aria-hidden className='size-3.5 text-muted-foreground' />
								</a>
							</div>
							{!isActive && (
								<div className='text-center'>
									<button
										type='button'
										disabled={busy}
										onClick={() => {
											setError(null);
											setView('code');
										}}
										className='inline-flex min-h-11 items-center rounded-sm px-2 text-foreground text-sm underline underline-offset-4 hover:text-primary focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 disabled:opacity-60'
									>
										Ya tengo un código
									</button>
								</div>
							)}
							<p className='text-center text-muted-foreground text-xs'>
								El aporte voluntario no activa Sandy Plus.
							</p>
						</>
					) : (
						<>
							<button
								type='button'
								onClick={() => {
									returnFocus.current = true;
									setError(null);
									setView('choice');
								}}
								disabled={busy}
								className='inline-flex min-h-11 items-center gap-1.5 rounded-sm text-muted-foreground text-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 disabled:opacity-60'
							>
								<ArrowLeft aria-hidden className='size-4' />
								Volver
							</button>

							<div className='space-y-1.5'>
								<DialogTitle className='font-display text-xl'>Canjear código</DialogTitle>
								<DialogDescription className='text-sm leading-relaxed'>
									Pega tu código de Sandy Plus para activar el beneficio en esta cuenta.
								</DialogDescription>
							</div>

							<form
								className='space-y-3'
								onSubmit={(event) => {
									event.preventDefault();
									if (!code.trim() || busy) return;
									void run(async (isCurrent) => {
										await purchase.redeem(code);
										if (!isCurrent()) return;
										setCode('');
										setCheckout(null);
										setView('choice');
									});
								}}
							>
								<label htmlFor='support-license-code' className='block font-medium text-sm'>
									Código de Sandy Studio Plus
								</label>
								<Input
									ref={inputRef}
									id='support-license-code'
									value={code}
									placeholder='SANDY-XXXX-XXXX-XXXX-XXXX'
									onChange={(event) => {
										setCode(event.target.value.toUpperCase());
										setError(null);
									}}
									disabled={busy}
									className='min-h-12 font-mono text-base'
									spellCheck={false}
									autoCapitalize='characters'
									autoComplete='one-time-code'
									maxLength={27}
									aria-invalid={Boolean(error)}
									aria-describedby={error ? 'support-code-error' : undefined}
								/>
								<Button
									type='submit'
									disabled={busy || code.trim().length < 11 || !isAvailable}
									className={primaryClass}
								>
									{busy ? 'Activando…' : 'Activar Sandy Plus'}
								</Button>
							</form>

							{checkout?.checkout_url && (
								<div className='space-y-2 border-border border-t pt-3'>
									<p className='text-muted-foreground text-sm'>
										Completa el pago en la pestaña de Ko-fi. El código llegará al correo asociado al
										pago. Si no se abrió, usa este enlace.
									</p>
									<a
										href={checkout.checkout_url}
										target='_blank'
										rel='noopener noreferrer'
										className='inline-flex min-h-11 items-center gap-2 rounded-sm text-foreground text-sm underline underline-offset-4 hover:text-primary focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2'
									>
										Continuar en Ko-fi
										<ExternalLink aria-hidden className='size-4' />
									</a>
								</div>
							)}
						</>
					)}
					{(error || purchase.error) && (
						<p
							id='support-code-error'
							role='alert'
							className='break-words text-destructive text-sm'
						>
							{error || purchase.error}
						</p>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

export function SupportPurchaseButton() {
	const purchase = useSupportPurchase();
	const [open, setOpen] = useState(false);
	if (!purchase)
		return (
			<a
				href={KOFI_URL}
				target='_blank'
				rel='noopener noreferrer'
				className={triggerClass}
				aria-label='Invita un café al creador en Ko-fi'
			>
				<Coffee aria-hidden className='size-4' />
				<span>Apoyar</span>
			</a>
		);
	return (
		<>
			<button
				type='button'
				className={triggerClass}
				onClick={() => setOpen(true)}
				aria-label='Apoyar Sandy Studio y gestionar mi compra'
			>
				<Coffee aria-hidden className='size-4' />
				<span className='sm:hidden'>Apoyar</span>
				<span className='hidden sm:inline'>
					{purchase.status?.watermark_free ? 'Mi apoyo' : 'Apoyar Sandy'}
				</span>
			</button>
			<SupportDialog
				key={purchase.ownerId}
				purchase={purchase}
				open={open}
				onOpenChange={setOpen}
			/>
		</>
	);
}
