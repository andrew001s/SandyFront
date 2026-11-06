'use client';

import { openNewsModal } from '@/components/modals/NewsModal';
import { KOFI_URL } from '@/lib/links';
import { Coffee, HelpCircle, Moon, Star, Sun } from 'lucide-react';
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
			<a
				href={KOFI_URL}
				target='_blank'
				rel='noopener noreferrer'
				aria-label='Invita un café al creador en Ko-fi'
				title='Apoya el desarrollo de Sandy Studio en Ko-fi'
				className='inline-flex h-8 items-center gap-1.5 rounded-lg bg-secondary px-2.5 font-semibold text-secondary-foreground text-xs transition-colors hover:bg-secondary/85 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 sm:h-9 sm:gap-2 sm:px-3'
			>
				<Coffee className='size-4' aria-hidden='true' />
				<span className='sm:hidden'>Apoyar</span>
				<span className='hidden sm:inline'>Invita un café</span>
			</a>
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
