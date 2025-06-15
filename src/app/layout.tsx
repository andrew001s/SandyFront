import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Footer } from '@/components/ui/footer';
import { MessagesProvider } from '@/context/MessagesContext';
import { StatusProvider } from '@/context/StatusContext';
import { StatusProviderBot } from '@/context/StatusContextBot';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'SandyIA',
	description:
		'Sandy IA es una VTuber que te ayuda a interactuar con tu chat y servicios de streaming.',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='es' suppressHydrationWarning translate='no'>
			<body
				className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}
			>
				<ThemeProvider attribute='class' defaultTheme='dark' enableSystem>
					<StatusProvider>
						<StatusProviderBot>
							<MessagesProvider>
								<main className='w-full flex-grow'>
									<Toaster richColors position='top-right' />
									{children}
								</main>
								<Footer />
							</MessagesProvider>
						</StatusProviderBot>
					</StatusProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
