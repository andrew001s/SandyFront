'use client';
import StreamChat from '@/components/Chat/Chat';
import { StarField } from '@/components/landing/StarField';
import { NewsModal } from '@/components/modals/NewsModal';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { Footer } from '@/components/ui/footer';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSettingsProvider } from '@/context/AppSettingsContext';
import { useLocalAiRelay } from '@/hooks/useLocalAiRelay';
import { useShutdownOnExit } from '@/hooks/useShutdownOnExit';
import { usePathname } from 'next/navigation';
import { DashboardActions } from './DashboardActions';
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
	const pathname = usePathname();
	const isAvatarStudio = pathname?.startsWith('/avatar') ?? false;
	return (
		<AppSettingsProvider>
			<ShutdownOnExit />
			<LocalAiRelay />
			<StreamChat />
			<SidebarProvider
				defaultOpen={true}
				className={isAvatarStudio ? 'h-dvh min-h-0 overflow-hidden' : undefined}
			>
				<AppSidebar />
				<SidebarInset
					className={isAvatarStudio ? 'h-dvh min-h-0 w-full bg-background' : 'bg-background'}
				>
					{!isAvatarStudio && (
						<header className='flex h-14 shrink-0 items-center justify-between border-border border-b bg-card px-3'>
							<SidebarTrigger />
							<DashboardActions />
						</header>
					)}
					<NewsModal />
					<div
						className={
							isAvatarStudio
								? 'relative flex min-h-0 flex-1 flex-col overflow-hidden'
								: 'relative flex-1'
						}
					>
						<StarField
							count={30}
							seed={9}
							className='pointer-events-none fixed inset-0 opacity-25 dark:opacity-35'
						/>
						<div className='pointer-events-none fixed inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(140,124,255,0.06),transparent_70%)]' />
						<div className='relative z-10 flex min-h-0 flex-1 flex-col'>{children}</div>
					</div>
					{!isAvatarStudio && (
						<Footer forceRender className='mt-auto border-border/50 border-t bg-card/30' />
					)}
				</SidebarInset>
			</SidebarProvider>
		</AppSettingsProvider>
	);
}
