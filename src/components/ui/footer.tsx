'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
	FaDiscord,
	FaFacebook,
	FaInstagram,
	FaTwitch,
	FaXTwitter,
	FaYoutube,
} from 'react-icons/fa6';
import { LuGithub } from 'react-icons/lu';

export const Footer = () => {
	const pathname = usePathname();
	const isSidebarPage = [
		'/home',
		'/conexiones',
		'/moderacion',
		'/avatar',
		'/settings',
		'/account',
	].some((route) => pathname === route || pathname.startsWith(`${route}/`));

	const socialLinks = [
		{
			name: 'GitHub',
			url: 'https://github.com/andrew001s',
			icon: LuGithub,
		},
		{
			name: 'Twitter',
			url: 'https://x.com/ElShandrew',
			icon: FaXTwitter,
		},
		{
			name: 'Twitch',
			url: 'https://www.twitch.tv/elshandrew',
			icon: FaTwitch,
		},
		{
			name: 'YouTube',
			url: 'https://www.youtube.com/@Shandrew',
			icon: FaYoutube,
		},
		{
			name: 'Instagram',
			url: 'https://www.instagram.com/elshandrew/',
			icon: FaInstagram,
		},
		{
			name: 'Discord',
			url: 'https://discord.com/invite/KtCBAfneRy',
			icon: FaDiscord,
		},
		{
			name: 'Facebook',
			url: 'https://www.facebook.com/Shandrewvt',
			icon: FaFacebook,
		},
	];

	return (
		<footer
			className={cn(
				'w-full border-t border-border/60 bg-background/80 px-4 py-6 backdrop-blur-sm',
				isSidebarPage && 'md:pl-[17rem]',
			)}
		>
			<div className='container mx-auto flex flex-col items-center justify-between gap-4 md:flex-row'>
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.45 }}
					className='flex flex-col items-center gap-3 text-center text-sm text-muted-foreground md:items-start md:text-left'
				>
					<div>© Shandrew {new Date().getFullYear()}. Todos los derechos reservados.</div>
					<nav className='flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs'>
						<Link
							href='/privacy-policy'
							className='transition-colors hover:text-foreground'
							aria-label='Política de Privacidad'
						>
							Política de Privacidad
						</Link>
						<span aria-hidden='true' className='h-3 w-px bg-border' />
						<Link
							href='/terms-of-service'
							className='transition-colors hover:text-foreground'
							aria-label='Términos del Servicio'
						>
							Términos del Servicio
						</Link>
					</nav>
				</motion.div>
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.45, delay: 0.12 }}
					className='flex flex-wrap items-center justify-center gap-2 md:justify-end'
				>
					{socialLinks.map((link, index) => {
						const Icon = link.icon;

						return (
							<motion.div
								key={link.name}
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.3, delay: 0.04 * index }}
								whileHover={{ y: -2 }}
								whileTap={{ scale: 0.97 }}
							>
								<Button
									asChild
									variant='outline'
									size='icon'
									className='size-10 rounded-full border-border/70 bg-background/90 shadow-none text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground'
								>
									<Link
										href={link.url}
										target='_blank'
										rel='noopener noreferrer'
										aria-label={link.name}
									>
										<Icon size={20} />
									</Link>
								</Button>
							</motion.div>
						);
					})}
				</motion.div>
			</div>
		</footer>
	);
};
