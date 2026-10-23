import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { DashboardShell } from '@/containers/dashboard/DashboardShell';
import { noIndexMetadata } from '@/lib/seo';
import { Show, UserProfile } from '@clerk/nextjs';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = noIndexMetadata;

const userProfileAppearance = {
	elements: {
		rootBox: 'w-full max-w-none',
		cardBox: 'w-full max-w-none shadow-none border-none bg-transparent',
		navbar: 'w-full max-w-none',
		pageScrollBox: 'w-full max-w-none',
		scrollBox: 'w-full max-w-none',
		contentBox: 'w-full max-w-none',
	},
};

export default function AccountPage() {
	return (
		<DashboardShell>
			<div className='mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 md:px-6'>
				<PageHeader
					tag='Perfil de Usuario · Seguridad y Acceso'
					title='Cuenta y Seguridad'
					description='Gestiona tu sesión, correo electrónico, autenticación multifactor y datos vinculados a tu cuenta.'
				/>

				<div className='w-full overflow-hidden rounded-xl border border-border bg-card p-4 shadow-xs sm:p-6'>
					<Show
						when='signed-in'
						fallback={
							<div className='flex flex-col items-center justify-center py-8 text-center'>
								<h3 className='font-display font-semibold text-base text-foreground'>
									Necesitas iniciar sesión
								</h3>
								<p className='mt-1 font-sans text-muted-foreground text-xs'>
									Para ver y modificar tu configuración de cuenta, inicia sesión en Sandy Studio.
								</p>
								<Button
									asChild
									className='mt-4 h-9 rounded-lg bg-primary font-sans font-semibold text-primary-foreground text-xs shadow-xs hover:bg-primary/90'
								>
									<Link href='/auth'>Iniciar sesión</Link>
								</Button>
							</div>
						}
					>
						<div className='w-full'>
							<UserProfile routing='path' path='/account' appearance={userProfileAppearance} />
						</div>
					</Show>
				</div>
			</div>
		</DashboardShell>
	);
}
