'use client';

import { AuthAction } from '@/components/landing/AuthAction';
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
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const [scrolled, setScrolled] = useState(false);

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
			transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
			className='fixed inset-x-0 top-0 z-50'
		>
			<nav
				className={`mx-auto flex max-w-7xl items-center justify-between px-5 transition-all duration-300 md:px-8 ${
					scrolled
						? 'mt-2.5 rounded-2xl bg-white/80 py-2.5 shadow-[0_8px_30px_rgba(109,91,208,0.08)] backdrop-blur-xl dark:bg-[#0D0C16]/70 dark:shadow-none'
						: 'bg-transparent py-4'
				}`}
			>
				<Link href='/' className='flex items-center gap-2.5'>
					<span
						className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#22D3EE] shadow-[0_0_24px_rgba(139,92,246,0.45)] transition-all duration-300 ${
							scrolled ? 'h-8 w-8' : 'h-9 w-9'
						}`}
					>
						<Image src='/icons/default.png' alt='Sandy Studio' fill className='object-cover' />
						<span className='-right-0.5 -top-0.5 absolute h-2 w-2 animate-pulse rounded-full bg-[#22D3EE] ring-2 ring-[#F6F3FC] dark:ring-[#0B0A12]' />
					</span>
					<span className='font-bold text-lg text-zinc-900 tracking-tight [font-family:var(--font-unbounded)] dark:text-zinc-50'>
						Sandy <span className='text-violet-600 dark:text-[#A78BFA]'>Studio</span>
					</span>
				</Link>

				<div className='hidden items-center gap-1 md:flex'>
					{links.map((link) => (
						<a
							key={link.href}
							href={link.href}
							className='rounded-full px-4 py-2 text-sm text-zinc-600 transition-colors hover:bg-[#8B5CF6]/10 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-white'
						>
							{link.label}
						</a>
					))}
				</div>

				<div className='flex items-center gap-2'>
					{mounted && (
						<button
							type='button'
							onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
							aria-label='Cambiar tema'
							className='rounded-full p-2 text-zinc-600 transition-colors hover:bg-[#8B5CF6]/10 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-white'
						>
							{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
						</button>
					)}
					<AuthAction
						action='signin'
						variant='ghost'
						className='hidden text-zinc-700 hover:bg-[#8B5CF6]/10 hover:text-zinc-900 sm:inline-flex dark:text-zinc-200 dark:hover:bg-white/5 dark:hover:text-white'
					>
						Entrar
					</AuthAction>
					<AuthAction
						action='signup'
						className='rounded-full border border-[#8B5CF6]/40 bg-[#8B5CF6] px-5 text-white shadow-[0_0_20px_rgba(139,92,246,0.35)] transition-all hover:bg-[#7C4DFF] hover:shadow-[0_0_28px_rgba(139,92,246,0.55)]'
					>
						Crear cuenta
					</AuthAction>
				</div>
			</nav>
		</motion.header>
	);
}
