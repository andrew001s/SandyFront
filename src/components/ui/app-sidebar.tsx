'use client';

import { SignOutButton, useUser } from '@clerk/nextjs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarFooter,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarSeparator,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { LayoutDashboard, LogIn, LogOut, Settings2, Tv } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
	{ href: '/home', label: 'Dashboard', icon: LayoutDashboard },
	{ href: '/avatar', label: 'Avatar VTuber', icon: Tv },
	{ href: '/settings', label: 'Configuración de IA', icon: Settings2 },
];

export function AppSidebar() {
	const pathname = usePathname();
	const { isLoaded, isSignedIn, user } = useUser();

	const displayName = user?.fullName ?? user?.firstName ?? user?.username ?? 'Tu perfil';
	const email = user?.primaryEmailAddress?.emailAddress ?? 'Sesión activa';
	const initials = (
		user?.firstName?.[0] ?? user?.lastName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0] ?? 'S'
	).toUpperCase();

	return (
		<Sidebar collapsible='icon' variant='floating'>
			<SidebarHeader className='p-3 pt-3'>
				<div className='rounded-[28px] border border-sidebar-border bg-background/80 p-3 shadow-sm backdrop-blur-sm group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3'>
					<div className='flex items-center gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0'>
						<Avatar className='size-12 shrink-0 ring-2 ring-background shadow-sm group-data-[collapsible=icon]:size-10'>
							{isSignedIn && user?.imageUrl ? (
								<AvatarImage src={user.imageUrl} alt={displayName} />
							) : null}
							<AvatarFallback className='bg-primary/10 text-primary text-sm font-semibold'>
								{initials}
							</AvatarFallback>
						</Avatar>
						{isSignedIn ? (
							<div className='min-w-0 flex-1 group-data-[collapsible=icon]:hidden'>
								<p className='text-xs text-muted-foreground'>
									{isLoaded ? 'Perfil de inicio de sesión' : 'Cargando perfil'}
								</p>
								<div className='flex items-center gap-2'>
									<span className='truncate font-semibold text-sm'>{displayName}</span>
									<Badge variant='secondary' className='rounded-full px-2 py-0.5 text-[10px]'>
										Online
									</Badge>
								</div>
								<p className='truncate text-xs text-muted-foreground'>{email}</p>
							</div>
						) : (
							<div className='min-w-0 flex-1 group-data-[collapsible=icon]:hidden'>
								<p className='text-xs text-muted-foreground'>Sin sesión activa</p>
								<span className='block truncate font-semibold text-sm'>Inicia sesión</span>
								<p className='truncate text-xs text-muted-foreground'>
									Accede para ver tu perfil y volver al dashboard.
								</p>
							</div>
						)}
					</div>
				</div>
			</SidebarHeader>
			<SidebarSeparator className='mx-4 group-data-[collapsible=icon]:mx-2' />
			<SidebarContent className='px-3 pb-3 group-data-[collapsible=icon]:px-2'>
				<SidebarGroup className='rounded-[28px] border border-sidebar-border bg-background/75 p-3 shadow-sm backdrop-blur-sm group-data-[collapsible=icon]:rounded-[24px] group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2'>
					<SidebarGroupLabel className='px-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] group-data-[collapsible=icon]:hidden'>
						Navegación
					</SidebarGroupLabel>
					<SidebarGroupContent className='mt-2'>
						<SidebarMenu className='gap-2'>
							{navItems.map((item) => {
								const isActive = pathname === item.href;
								return (
									<SidebarMenuItem key={item.href}>
										<SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
											<Link
												href={item.href}
												className={cn(
													'flex items-center gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0',
													isActive && 'font-medium'
												)}
											>
												<item.icon className='h-4 w-4 shrink-0' />
												<span className='group-data-[collapsible=icon]:hidden'>{item.label}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className='mt-auto p-3 group-data-[collapsible=icon]:p-2'>
				<div className='rounded-[28px] border border-sidebar-border bg-background/80 p-3 shadow-sm backdrop-blur-sm group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2'>
					<div className='flex items-center gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0'>
						<Avatar className='size-10 shrink-0 ring-2 ring-background shadow-sm'>
							{isSignedIn && user?.imageUrl ? (
								<AvatarImage src={user.imageUrl} alt={displayName} />
							) : null}
							<AvatarFallback className='bg-primary/10 text-primary text-sm font-semibold'>
								{initials}
							</AvatarFallback>
						</Avatar>
						<div className='min-w-0 flex-1 group-data-[collapsible=icon]:hidden'>
							<p className='truncate font-semibold text-sm'>{displayName}</p>
							<p className='truncate text-xs text-muted-foreground'>{email}</p>
						</div>
						<Badge variant='secondary' className='rounded-full px-2 py-0.5 text-[10px] group-data-[collapsible=icon]:hidden'>
							{isSignedIn ? 'Activo' : 'Invitado'}
						</Badge>
					</div>
					<div className='mt-3'>
						{isSignedIn ? (
							<SignOutButton redirectUrl='/auth'>
								<Button
									type='button'
									variant='outline'
									size='sm'
									className='h-10 w-full justify-start gap-3 rounded-2xl border-border/70 bg-background px-3 shadow-none group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0'
								>
									<LogOut className='h-4 w-4 shrink-0' />
									<span className='group-data-[collapsible=icon]:hidden'>Cerrar sesión</span>
								</Button>
							</SignOutButton>
						) : (
							<Button
								asChild
								variant='outline'
								size='sm'
								className='h-10 w-full justify-start gap-3 rounded-2xl border-border/70 bg-background px-3 shadow-none group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0'
							>
								<Link href='/auth'>
									<LogIn className='h-4 w-4 shrink-0' />
									<span className='group-data-[collapsible=icon]:hidden'>Iniciar sesión</span>
								</Link>
							</Button>
						)}
					</div>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
