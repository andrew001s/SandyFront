'use client';

import { openNewsModal } from '@/components/modals/NewsModal';
import { SupportPurchaseButton } from '@/components/support/SupportPurchaseButton';
import { HelpCircle, Moon, Star, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useNextStep } from 'nextstepjs';
import { useEffect, useState } from 'react';

export function DashboardActions({ studio = false }: { studio?: boolean }) {
	const { resolvedTheme, setTheme } = useTheme();
	const { startNextStep } = useNextStep();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	return (
		<div id='studio-tour-community' className='flex shrink-0 items-center gap-1 sm:gap-2'>
			<SupportPurchaseButton />
			<button
				type='button'
				onClick={openNewsModal}
				aria-label='Ver novedades'
				title='Novedades'
				className='inline-flex size-8 items-center justify-center gap-2 rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:size-9 sm:w-auto sm:px-3'
			>
				<Star className='size-4' />
				<span className='hidden text-xs xl:inline'>Novedades</span>
			</button>
			{studio && (
				<button
					type='button'
					onClick={() => startNextStep('dashboard-tour')}
					aria-label='Ver recorrido del estudio'
					title='Ver recorrido'
					className='flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground sm:size-9'
				>
					<HelpCircle className='size-4' />
				</button>
			)}
			<button
				type='button'
				onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
				aria-label='Cambiar tema'
				className='flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground sm:size-9'
			>
				{mounted && resolvedTheme === 'dark' ? (
					<Sun className='size-4' />
				) : (
					<Moon className='size-4' />
				)}
			</button>
		</div>
	);
}
