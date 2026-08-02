import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardShell } from '@/containers/dashboard/DashboardShell';
import type { Metadata } from 'next';
import { Show, UserProfile } from '@clerk/nextjs';
import Link from 'next/link';
import { noIndexMetadata } from '@/lib/seo';

export const metadata: Metadata = noIndexMetadata;

const userProfileAppearance = {
	elements: {
		rootBox: 'w-full max-w-none',
		cardBox: 'w-full max-w-none',
		navbar: 'w-full max-w-none',
		pageScrollBox: 'w-full max-w-none',
		scrollBox: 'w-full max-w-none',
		contentBox: 'w-full max-w-none',
	},
};

export default function AccountPage() {
	return (
		<DashboardShell>
			<div className='min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-violet-50/40 px-4 py-6 dark:to-background'>
				<div className='clerk-fullwidth mx-auto flex w-full max-w-none flex-col gap-6'>
					<Show
						when='signed-in'
						fallback={
							<Card className='border-border/60 bg-card/90 backdrop-blur-xl'>
								<CardHeader>
									<CardTitle>Necesitas iniciar sesión</CardTitle>
									<CardDescription>
										Para ver tu configuración de cuenta primero inicia sesión en Clerk.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<Button asChild>
										<Link href='/auth'>Ir a iniciar sesión</Link>
									</Button>
								</CardContent>
							</Card>
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
