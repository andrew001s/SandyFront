'use client';

import { AuthAction } from '@/components/landing/AuthAction';
import { useAuth } from '@clerk/nextjs';
import { Moon, Sun } from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const links = [
	{ href: '#features', label: 'Funciones' },
	{ href: '#como-funciona', label: 'Cómo funciona' },
	{ href: '#faq', label: 'Preguntas' },
];

export function LandingNav() {
	const { isSignedIn } = useAuth();
	const { theme, resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const [scrolled, setScrolled] = useState(false);
	const activeTheme = resolvedTheme ?? theme ?? 'dark';
	const logoSrc =
		activeTheme === 'light' ? '/icons/logo-nav-light.png' : '/icons/logo-nav-dark.png';

	useEffect(() => {
		setMounted(true);
		const onScroll = () => setScrolled(window.scrollY > 16);
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	return (
		<motion.header
			initial={{ y: -24, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
			className='fixed inset-x-0 top-0 z-50 px-4 pt-3 transition-all'
		>
			<nav
				className={`mx-auto flex max-w-6xl items-center justify-between rounded-xl px-4 transition-all duration-200 md:px-6 ${
					scrolled
						? 'border border-border/80 bg-card/85 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.25)] backdrop-blur-md'
						: 'border border-transparent bg-transparent py-3'
				}`}
			>
				<Link
					href='/'
					className='flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
				>
					<span
						className={`relative flex items-center justify-center overflow-hidden transition-all duration-200 ${
							scrolled ? 'w-16' : 'w-20'
						}`}
					>
						<Image
							src={logoSrc}
							alt='Sandy Studio'
							width={80}
							height={31}
							sizes='80px'
							priority
							className='h-auto w-full object-contain'
						/>
					</span>
				</Link>

				<div className='hidden items-center gap-1 md:flex'>
					{links.map((link) => (
						<a
							key={link.href}
							href={link.href}
							className='rounded-md px-3.5 py-1.5 font-medium font-sans text-muted-foreground text-sm transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
						>
							{link.label}
						</a>
					))}
				</div>

				<div className='flex items-center gap-2.5'>
					{mounted && (
						<button
							type='button'
							onClick={() => setTheme(activeTheme === 'dark' ? 'light' : 'dark')}
							aria-label={activeTheme === 'dark' ? 'Activar tema claro' : 'Activar tema oscuro'}
							className='inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card/60 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
						>
							{activeTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
						</button>
					)}
					{isSignedIn ? (
						<AuthAction
							action='app'
							className='h-9 rounded-lg bg-primary px-4 font-sans font-semibold text-primary-foreground text-sm shadow-[0_1px_2px_rgba(0,0,0,0.2),0_4px_12px_rgba(140,124,255,0.25)] transition-all hover:bg-primary/90'
						>
							Ir a la app
						</AuthAction>
					) : (
						<>
							<AuthAction
								action='signin'
								variant='ghost'
								className='hidden h-9 font-medium font-sans text-muted-foreground text-sm hover:bg-muted/50 hover:text-foreground sm:inline-flex'
							>
								Entrar
							</AuthAction>
							<AuthAction
								action='signup'
								className='h-9 rounded-lg bg-primary px-4 font-sans font-semibold text-primary-foreground text-sm shadow-[0_1px_2px_rgba(0,0,0,0.2),0_4px_12px_rgba(140,124,255,0.25)] transition-all hover:bg-primary/90'
							>
								Crear cuenta
							</AuthAction>
						</>
					)}
				</div>
			</nav>
		</motion.header>
	);
}
