'use client';

import type { SupportCheckout } from '@/api/support';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useSupportPurchase } from '@/context/SupportPurchaseContext';
import { KOFI_URL } from '@/lib/links';
import axios from 'axios';
import { CheckCircle2, Coffee, ExternalLink } from 'lucide-react';
import { useState } from 'react';

const triggerClass =
	'inline-flex h-8 items-center gap-1.5 rounded-lg bg-secondary px-2.5 font-semibold text-secondary-foreground text-xs transition-colors hover:bg-secondary/85 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 sm:h-9 sm:gap-2 sm:px-3';
const failureMessage = (error: unknown) =>
	axios.isAxiosError(error) && typeof error.response?.data?.detail === 'string'
		? error.response.data.detail
		: 'No se pudo completar la solicitud. Inténtalo de nuevo.';

function PurchasePanel({
	purchase,
}: { purchase: NonNullable<ReturnType<typeof useSupportPurchase>> }) {
	const [checkout, setCheckout] = useState<SupportCheckout | null>(null);
	const [code, setCode] = useState('');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const action = async (run: () => Promise<void>) => {
		setBusy(true);
		setError(null);
		setNotice(null);
		try {
			await run();
		} catch (failure) {
			setError(failureMessage(failure));
		} finally {
			setBusy(false);
		}
	};
	return (
		<div className='space-y-5'>
			{purchase.loading ? (
				<p className='text-muted-foreground text-sm'>Comprobando tu compra…</p>
			) : purchase.status?.watermark_free ? (
				<div className='space-y-2'>
					<p className='flex items-center gap-2 font-semibold'>
						<CheckCircle2 aria-hidden className='size-5 text-emerald-700 dark:text-emerald-400' />{' '}
						Beneficio sin marca activo
					</p>
					<p className='text-muted-foreground text-sm'>
						Gracias por apoyar Sandy Studio. Tu cuenta ya funciona sin el aviso en PNG, 2D y 3D.
					</p>
					<p className='text-muted-foreground text-sm'>
						Los enlaces de OBS vinculados se actualizan automáticamente. Si tu enlace es anterior a
						esta función, cópialo de nuevo desde el visor una vez.
					</p>
				</div>
			) : (
				<div className='space-y-3'>
					<div className='flex items-baseline justify-between gap-3'>
						<h3 className='font-semibold'>Sandy sin marca de agua</h3>
						<span className='shrink-0 font-semibold'>US$3</span>
					</div>
					<p className='text-muted-foreground text-sm'>
						Un solo pago por tu cuenta. Retira el aviso de apoyo en PNG, 2D, 3D y tus fuentes de
						OBS. Las funciones de Sandy siguen siendo gratuitas.
					</p>
					{purchase.status?.state === 'pending' && (
						<output className='block text-sm'>
							Esperando la confirmación de Ko-fi. Si pagaste con otro correo verificado en tu
							cuenta, también se vinculará automáticamente. No vuelvas a pagar si ya completaste la
							compra.
						</output>
					)}
					{purchase.status?.state === 'review' && (
						<p role='alert' className='text-sm'>
							Tu pago necesita revisión. Contacta al creador con tu recibo y no repitas el pago.
						</p>
					)}
					{purchase.status?.state === 'revoked' && (
						<p className='text-muted-foreground text-sm'>
							El beneficio se retiró por una devolución o reversión registrada. Si no corresponde,
							solicita una revisión con tu recibo.
						</p>
					)}
					{!purchase.status?.available ? (
						<p className='text-muted-foreground text-sm'>
							La compra todavía no está habilitada. Puedes seguir usando Sandy y apoyar
							voluntariamente en Ko-fi.
						</p>
					) : checkout?.checkout_url ? (
						<div className='space-y-3'>
							<p className='text-muted-foreground text-xs'>
								Ko-fi enviará tu código de Sandy Studio Plus al correo que uses en el pago.
							</p>
							<a
								href={checkout.checkout_url}
								target='_blank'
								rel='noopener noreferrer'
								className='inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 font-semibold text-primary-foreground text-sm focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2'
							>
								Pagar US$3 en Ko-fi <ExternalLink aria-hidden className='size-4' />
							</a>
							<label htmlFor='support-license-code' className='block font-medium text-sm'>
								Código de Sandy Studio Plus
							</label>
							<Input
								id='support-license-code'
								value={code}
								placeholder='SANDY-XXXX-XXXX-XXXX-XXXX'
								onChange={(event) => setCode(event.target.value.toUpperCase())}
								autoComplete='one-time-code'
								maxLength={27}
							/>
							<Button
								variant='outline'
								disabled={busy || code.trim().length < 11}
								onClick={() =>
									void action(async () => {
										await purchase.redeem(code);
										setCode('');
									})
								}
							>
								Activar Sandy Studio Plus
							</Button>
						</div>
					) : (
						<Button
							disabled={busy || purchase.status?.state === 'review'}
							onClick={() => void action(async () => setCheckout(await purchase.checkout()))}
							className='min-h-11'
						>
							{busy
								? 'Preparando compra…'
								: purchase.status?.state === 'pending'
									? 'Ver instrucciones de pago'
									: 'Preparar compra de US$3'}
						</Button>
					)}
				</div>
			)}
			{(error || purchase.error) && (
				<p role='alert' className='text-destructive text-sm'>
					{error ?? purchase.error}
				</p>
			)}
			{notice && <output className='block text-sm'>{notice}</output>}
			<div className='flex flex-wrap gap-2'>
				<Button
					variant='outline'
					disabled={busy || purchase.loading}
					onClick={() =>
						void action(async () => {
							await purchase.refresh();
						})
					}
				>
					Comprobar estado
				</Button>
				<a
					href={KOFI_URL}
					target='_blank'
					rel='noopener noreferrer'
					className='inline-flex min-h-10 items-center gap-2 px-3 text-sm underline underline-offset-4'
				>
					Aportar voluntariamente <ExternalLink aria-hidden className='size-3.5' />
				</a>
			</div>
			{purchase.status?.watermark_free && (
				<details className='border-border border-t pt-4'>
					<summary className='min-h-9 cursor-pointer font-medium text-sm'>
						Seguridad de mis enlaces de OBS
					</summary>
					<p className='py-3 text-muted-foreground text-sm'>
						Si compartiste un enlace, puedes renovarlos. Los anteriores volverán a mostrar el aviso;
						tendrás que copiar los nuevos desde el visor.
					</p>
					<Button
						variant='outline'
						disabled={busy}
						onClick={() =>
							void action(async () => {
								await purchase.rotateOverlayKey();
								setNotice(
									'Permisos renovados. Copia de nuevo tus enlaces de OBS desde los visores.',
								);
							})
						}
					>
						Renovar enlaces de OBS
					</Button>
				</details>
			)}
		</div>
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
		<Dialog open={open} onOpenChange={setOpen}>
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
			<DialogContent className='max-h-[90dvh] overflow-y-auto p-5 sm:max-w-lg sm:p-6'>
				<DialogTitle className='pr-8'>Apoya Sandy Studio</DialogTitle>
				<DialogDescription>
					Elige un aporte voluntario o una compra única para retirar la marca.
				</DialogDescription>
				<PurchasePanel key={purchase.ownerId ?? 'signed-out'} purchase={purchase} />
			</DialogContent>
		</Dialog>
	);
}
