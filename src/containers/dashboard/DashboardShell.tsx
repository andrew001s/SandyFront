'use client';

import { AppSidebar } from '@/components/ui/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSettingsProvider } from '@/context/AppSettingsContext';
import { AudioQueueManager } from '@/lib/audioQueueSingleton';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';

function GlobalAudioPlayer() {
	const audioRef = useRef<HTMLAudioElement | null>(null);

	useEffect(() => {
		const manager = AudioQueueManager.getInstance();
		manager.setAudioElement(audioRef.current);

		return () => {
			manager.setAudioElement(null);
		};
	}, []);

	return (
		<audio ref={audioRef} preload='auto' className='hidden'>
			<track kind='captions' />
		</audio>
	);
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	return (
		<AppSettingsProvider>
			<SidebarProvider defaultOpen={true}>
				<AppSidebar />
				<SidebarInset>
					<header className='flex h-14 items-center justify-between border-b px-4'>
						<SidebarTrigger />
						{mounted && (
							<button
								type='button'
								onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
								className='rounded-lg p-2 transition-colors hover:bg-muted'
							>
								{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
							</button>
						)}
					</header>
					<GlobalAudioPlayer />
					<div className='flex-1'>{children}</div>
				</SidebarInset>
			</SidebarProvider>
		</AppSettingsProvider>
	);
}
