'use client';

import { AppSidebar } from '@/components/ui/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function DashboardShell({ children }: { children: React.ReactNode }) {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	return (
		<SidebarProvider defaultOpen={true}>
			<AppSidebar />
			<SidebarInset>
				<header className='flex h-14 items-center justify-between border-b px-4'>
					<SidebarTrigger />
					{mounted && (
						<button
							onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
							className='rounded-lg p-2 transition-colors hover:bg-muted'
						>
							{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
						</button>
					)}
				</header>
				<div className='flex-1'>{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
