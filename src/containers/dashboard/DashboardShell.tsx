'use client';

import { StarField } from '@/components/landing/StarField';
import { NewsModal, openNewsModal } from '@/components/modals/NewsModal';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { Footer } from '@/components/ui/footer';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSettingsProvider } from '@/context/AppSettingsContext';
import { useLocalAiRelay } from '@/hooks/useLocalAiRelay';
import { useShutdownOnExit } from '@/hooks/useShutdownOnExit';
import { Moon, Sparkles, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

/**
 * Atiende las peticiones de inferencia del backend cuando el proveedor es local.
 */
function LocalAiRelay() {
	useLocalAiRelay();
	return null;
}

/**
 * Apaga los servicios del usuario si cierra o recarga la página, para que no
 * quede el bot consumiendo tokens sin nadie delante.
 */
function ShutdownOnExit() {
	useShutdownOnExit();
	return null;
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	return (
		<AppSettingsProvider>
			<ShutdownOnExit />
			<LocalAiRelay />
			<SidebarProvider defaultOpen={true}>
				<AppSidebar />
				<SidebarInset className='bg-background'>
					<header className='sticky top-0 z-20 flex h-14 items-center justify-between border-border border-b bg-card/80 px-4 backdrop-blur-md'>
						<div className='flex items-center gap-2'>
							<SidebarTrigger className='text-muted-foreground hover:text-foreground' />
						</div>
						{mounted && (
							<div className='flex items-center gap-2'>
								<button
									type='button'
									onClick={() => openNewsModal()}
									className='flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background/80 px-3 font-medium font-sans text-muted-foreground text-xs transition-colors hover:bg-muted/50 hover:text-foreground'
									aria-label='Ver novedades'
								>
									<Sparkles className='size-3.5 text-primary' />
									<span>Novedades</span>
								</button>
								<button
									type='button'
									onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
									className='flex size-8 items-center justify-center rounded-lg border border-border bg-background/80 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground'
									aria-label='Cambiar tema'
								>
									{theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
								</button>
							</div>
						)}
					</header>
					<NewsModal />
					<div className='relative flex-1'>
						<StarField
							count={30}
							seed={9}
							className='pointer-events-none fixed inset-0 opacity-25 dark:opacity-35'
						/>
						<div className='pointer-events-none fixed inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(140,124,255,0.06),transparent_70%)]' />
						<div className='relative z-10 flex h-full flex-col'>{children}</div>
					</div>
					<Footer forceRender className='mt-auto border-border/50 border-t bg-card/30' />
				</SidebarInset>
			</SidebarProvider>
		</AppSettingsProvider>
	);
}
