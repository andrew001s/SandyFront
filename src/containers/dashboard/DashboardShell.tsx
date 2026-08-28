'use client';

import { StarField } from '@/components/landing/StarField';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSettingsProvider } from '@/context/AppSettingsContext';
import { useLocalAiRelay } from '@/hooks/useLocalAiRelay';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

/**
 * Atiende las peticiones de inferencia que el backend publica por SSE cuando el
 * proveedor es el modelo local.
 *
 * Va dentro de AppSettingsProvider —lee la configuración— y a nivel del shell,
 * no de una pantalla concreta, para que el chat de Twitch y los eventos sigan
 * respondiendo aunque el panel de conversación no esté abierto.
 */
function LocalAiRelay() {
	useLocalAiRelay();
	return null;
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	return (
		<AppSettingsProvider>
			<LocalAiRelay />
			<SidebarProvider defaultOpen={true}>
				<AppSidebar />
				<SidebarInset>
					<header className='sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/70 px-4 backdrop-blur-sm'>
						<SidebarTrigger />
						{mounted && (
							<button
								type='button'
								onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
								className='flex size-9 items-center justify-center rounded-full border border-border/70 bg-background/60 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground'
								aria-label='Cambiar tema'
							>
								{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
							</button>
						)}
					</header>
					<div className='relative flex-1'>
						<StarField
							count={40}
							seed={9}
							className='pointer-events-none fixed inset-0 opacity-55'
						/>
						<div className='pointer-events-none fixed inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.16),transparent_60%)]' />
						<div className='relative z-10 flex h-full flex-col'>{children}</div>
					</div>
				</SidebarInset>
			</SidebarProvider>
		</AppSettingsProvider>
	);
}
