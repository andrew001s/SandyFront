'use client';

import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarSeparator,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Tv } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
	{ href: '/home', label: 'Dashboard', icon: LayoutDashboard },
	{ href: '/avatar', label: 'Avatar VTuber', icon: Tv },
];

export function AppSidebar() {
	const pathname = usePathname();

	return (
		<Sidebar collapsible='icon' variant='inset'>
			<SidebarHeader className='p-4 pt-6'>
				<div className='flex items-center gap-3 group-data-[collapsible=icon]:justify-center'>
					<div className='flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-chart-1 to-primary text-primary-foreground text-xs font-bold'>
						S
					</div>
					<span className='font-bold text-sm group-data-[collapsible=icon]:hidden'>SandyIA</span>
				</div>
			</SidebarHeader>
			<SidebarSeparator />
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel className='group-data-[collapsible=icon]:hidden'>
						Navegación
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{navItems.map((item) => {
								const isActive = pathname === item.href;
								return (
									<SidebarMenuItem key={item.href}>
										<SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
											<Link
												href={item.href}
												className={cn('flex items-center gap-3', isActive && 'font-medium')}
											>
												<item.icon className='h-4 w-4' />
												<span>{item.label}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}
