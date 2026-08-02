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
	SidebarSeparator,
	useSidebar,
} from '@/components/ui/sidebar';
import { KOFI_URL } from '@/lib/links';
import { cn } from '@/lib/utils';
import { SignOutButton, useClerk, useUser } from '@clerk/nextjs';
import {
	CircleUserRound,
	Coffee,
	LayoutDashboard,
	LogIn,
	LogOut,
	Plug,
	Settings2,
	ShieldCheck,
	Tv,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';

const navItems = [
	{ href: '/home', label: 'Dashboard', icon: LayoutDashboard },
	{ href: '/conexiones', label: 'Conexiones', icon: Plug },
	{ href: '/moderacion', label: 'Moderación', icon: ShieldCheck },
	{ href: '/avatar', label: 'Avatar VTuber', icon: Tv },
	{ href: '/settings', label: 'Configuración de IA', icon: Settings2 },
	{ href: '/account', label: 'Configuración', icon: CircleUserRound },
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
		<Sidebar collapsible='icon' variant='floating'>
			<SidebarHeader className='p-3 pt-3'>
				<Link
					href='/home'
					aria-label='Sandy Studio'
					title='Sandy Studio'
					className='flex w-full items-center justify-center p-3 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3'
				>
					<div className='relative h-16 w-full shrink-0 overflow-hidden rounded-2xl shadow-sm ring-2 ring-transparent group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:w-10'>
						<Image
							src={logoSrc}
							alt='Sandy Studio'
							fill
							sizes={state === 'collapsed' ? '40px' : '240px'}
							className='object-contain p-1.5'
							priority
						/>
					</div>
				</Link>
			</SidebarHeader>
			<SidebarSeparator className='mx-4 mb-2 group-data-[collapsible=icon]:mx-2' />
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
													isActive && 'font-medium',
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
				{state === 'collapsed' ? (
					<a
						href={KOFI_URL}
						target='_blank'
						rel='noopener noreferrer'
						aria-label='Apóyame en Ko-fi'
						className='mx-auto mb-2 flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground'
					>
						<Coffee className='h-4 w-4 shrink-0 text-[#FF5E5B]' />
					</a>
				) : (
					<div className='mb-2 flex w-full justify-center'>
						<KoFiButton />
					</div>
				)}
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
					</div>
					<div className='mt-3'>
						{isSignedIn ? (
							<SignOutButton redirectUrl='/'>
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
								type='button'
								variant='outline'
								size='sm'
								onClick={() => void openSignIn({ fallbackRedirectUrl: '/home' })}
								className='h-10 w-full justify-start gap-3 rounded-2xl border-border/70 bg-background px-3 shadow-none group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0'
							>
								<LogIn className='h-4 w-4 shrink-0' />
								<span className='group-data-[collapsible=icon]:hidden'>Iniciar sesión</span>
							</Button>
						)}
					</div>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
