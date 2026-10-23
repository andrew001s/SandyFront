'use client';

import { KoFiButton } from '@/components/landing/KoFi';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '@/components/ui/sidebar';
import { KOFI_URL } from '@/lib/links';
import { cn } from '@/lib/utils';
import { SignOutButton, useClerk, useUser } from '@clerk/nextjs';
import {
	CircleUserRound,
	Coffee,
	Gift,
	LayoutDashboard,
	LogIn,
	LogOut,
	Plug,
	Settings2,
	ShieldCheck,
	Tv,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
	{ href: '/home', label: 'Dashboard', icon: LayoutDashboard, tourId: 'sidebar-tour-dashboard' },
	{ href: '/conexiones', label: 'Conexiones', icon: Plug, tourId: 'sidebar-tour-conexiones' },
	{ href: '/recompensas', label: 'Recompensas', icon: Gift, tourId: 'sidebar-tour-recompensas' },
	{
		href: '/moderacion',
		label: 'Moderación',
		icon: ShieldCheck,
		tourId: 'sidebar-tour-moderacion',
	},
	{ href: '/avatar', label: 'Avatar 2D/3D', icon: Tv, tourId: 'sidebar-tour-avatar' },
	{ href: '/settings', label: 'Configuración', icon: Settings2, tourId: 'sidebar-tour-settings' },
	{ href: '/account', label: 'Cuenta', icon: CircleUserRound, tourId: 'sidebar-tour-account' },
];

export function AppSidebar() {
	const pathname = usePathname();
	const { isSignedIn, user } = useUser();
	const { openSignIn } = useClerk();
	const { state } = useSidebar();
	const { theme, resolvedTheme } = useTheme();

	const displayName = user?.fullName ?? user?.firstName ?? user?.username ?? 'Tu perfil';
	const email = user?.primaryEmailAddress?.emailAddress ?? 'Sesión activa';
	const initials = (
		user?.firstName?.[0] ??
		user?.lastName?.[0] ??
		user?.emailAddresses?.[0]?.emailAddress?.[0] ??
		'S'
	).toUpperCase();
	const activeTheme = resolvedTheme ?? theme ?? 'dark';
	const logoSrc =
		state === 'collapsed'
			? '/icons/icon.png'
			: activeTheme === 'light'
				? '/icons/sandyLight.png'
				: '/icons/sandyDark.png';

	return (
		<Sidebar collapsible='icon' className='border-r border-sidebar-border bg-sidebar'>
			<SidebarHeader className='p-3'>
				<Link
					href='/home'
					aria-label='Sandy Studio'
					title='Sandy Studio'
					className='flex w-full items-center justify-center rounded-lg p-2 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
				>
					<div className='relative h-11 w-full shrink-0 overflow-hidden group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:w-8'>
						<Image
							src={logoSrc}
							alt='Sandy Studio'
							fill
							sizes={state === 'collapsed' ? '32px' : '200px'}
							className='object-contain'
							priority
						/>
					</div>
				</Link>
			</SidebarHeader>

			<SidebarContent className='px-2.5 pb-2'>
				<SidebarGroup className='rounded-xl border border-sidebar-border bg-card/60 p-2 shadow-xs'>
					<SidebarGroupLabel className='px-2 font-mono text-[10px] text-muted-foreground uppercase tracking-wider group-data-[collapsible=icon]:hidden'>
						Navegación
					</SidebarGroupLabel>
					<SidebarGroupContent className='mt-1'>
						<SidebarMenu className='gap-1'>
							{navItems.map((item) => {
								const isActive = pathname === item.href;
								return (
									<SidebarMenuItem key={item.href}>
										<SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
											<Link
												href={item.href}
												id={item.tourId}
												className={cn(
													'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 font-sans text-xs transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0',
													isActive
														? 'border border-primary/30 bg-primary/10 font-semibold text-primary'
														: 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
												)}
											>
												<item.icon className='size-4 shrink-0' />
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

			<SidebarFooter className='mt-auto p-2.5'>
				{state === 'collapsed' ? (
					<a
						href={KOFI_URL}
						target='_blank'
						rel='noopener noreferrer'
						aria-label='Apóyame en Ko-fi'
						className='mx-auto mb-2 flex size-9 items-center justify-center rounded-lg border border-border/70 bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
					>
						<Coffee className='size-4 text-primary' />
					</a>
				) : (
					<div className='mb-2 flex w-full justify-center'>
						<KoFiButton />
					</div>
				)}
				<div className='rounded-xl border border-sidebar-border bg-card/80 p-2.5 shadow-xs'>
					<div className='flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0'>
						<Avatar className='size-8 shrink-0 border border-border shadow-xs'>
							{isSignedIn && user?.imageUrl ? (
								<AvatarImage src={user.imageUrl} alt={displayName} />
							) : null}
							<AvatarFallback className='bg-primary/10 font-mono font-bold text-primary text-xs'>
								{initials}
							</AvatarFallback>
						</Avatar>
						<div className='min-w-0 flex-1 group-data-[collapsible=icon]:hidden'>
							<p className='truncate font-sans font-semibold text-xs text-foreground'>
								{displayName}
							</p>
							<p className='truncate font-mono text-[10px] text-muted-foreground'>{email}</p>
						</div>
					</div>
					<div className='mt-2'>
						{isSignedIn ? (
							<SignOutButton redirectUrl='/'>
								<Button
									type='button'
									variant='outline'
									size='sm'
									className='h-8 w-full justify-start gap-2 rounded-lg border-border/70 bg-background px-2.5 font-sans font-medium text-muted-foreground text-xs shadow-none hover:bg-muted/50 hover:text-foreground group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0'
								>
									<LogOut className='size-3.5 shrink-0' />
									<span className='group-data-[collapsible=icon]:hidden'>Cerrar sesión</span>
								</Button>
							</SignOutButton>
						) : (
							<Button
								type='button'
								variant='outline'
								size='sm'
								onClick={() => void openSignIn({ fallbackRedirectUrl: '/home' })}
								className='h-8 w-full justify-start gap-2 rounded-lg border-border/70 bg-background px-2.5 font-sans font-medium text-muted-foreground text-xs shadow-none hover:bg-muted/50 hover:text-foreground group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0'
							>
								<LogIn className='size-3.5 shrink-0' />
								<span className='group-data-[collapsible=icon]:hidden'>Iniciar sesión</span>
							</Button>
						)}
					</div>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
