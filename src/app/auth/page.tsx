'use client';

import { Show, SignOutButton, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { FiLock, FiLogIn, FiUserPlus } from 'react-icons/fi';

export default function AuthPage() {
	return (
		<div className='min-h-screen bg-[radial-gradient(circle_at_top,_rgba(122,92,204,0.16),_transparent_35%),linear-gradient(180deg,_rgba(10,10,12,1),_rgba(17,17,22,1))] px-4 py-10'>
			<div className='mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center'>
				<div className='grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]'>
					<Card className='border-border/50 bg-card/70 backdrop-blur-xl'>
						<CardHeader className='space-y-4'>
							<div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
								<FiLock size={22} />
							</div>
							<div className='space-y-2'>
								<CardTitle className='text-3xl'>Acceso a SandyIA</CardTitle>
								<CardDescription className='max-w-xl text-base'>
									Entra o crea tu cuenta para usar el dashboard, el avatar y las funciones conectadas a VTube Studio.
								</CardDescription>
							</div>
						</CardHeader>

						<CardContent className='grid gap-3 sm:grid-cols-2'>
							<Button asChild size='lg' className='h-12 justify-start gap-2'>
								<Link href='/sign-in'>
									<FiLogIn size={16} />
									Iniciar sesión
								</Link>
							</Button>
							<Button asChild size='lg' variant='outline' className='h-12 justify-start gap-2'>
								<Link href='/sign-up'>
									<FiUserPlus size={16} />
									Crear cuenta
								</Link>
							</Button>
						</CardContent>
					</Card>

					<Card className='border-border/50 bg-card/50 backdrop-blur-xl'>
						<CardHeader>
							<CardTitle className='text-xl'>Estado de la sesión</CardTitle>
							<CardDescription>Si ya entraste, puedes saltar directo al panel.</CardDescription>
						</CardHeader>
						<CardContent>
							<Show
								when='signed-in'
								fallback={
									<div className='space-y-4 rounded-2xl border border-border/60 bg-background/60 p-6'>
										<p className='text-muted-foreground text-sm'>
											No tienes una sesión activa todavía. Usa los botones de la izquierda para entrar o registrarte.
										</p>
										<div className='rounded-xl border border-dashed border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground'>
											Después de iniciar sesión, podrás volver al dashboard sin tocar el sidebar.
										</div>
									</div>
								}
							>
								<div className='flex flex-col items-start gap-4 rounded-2xl border border-border/60 bg-background/60 p-6'>
									<div className='flex items-center gap-3'>
										<UserButton />
										<div>
											<p className='font-medium text-sm'>Sesión activa</p>
											<p className='text-muted-foreground text-xs'>Tu cuenta ya está conectada.</p>
										</div>
									</div>
									<div className='flex flex-wrap gap-3'>
										<Button asChild>
											<Link href='/home'>Ir al dashboard</Link>
										</Button>
										<SignOutButton redirectUrl='/auth'>
											<Button variant='outline'>Cerrar sesión</Button>
										</SignOutButton>
									</div>
								</div>
							</Show>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
