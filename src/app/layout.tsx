import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
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
	title: 'Sandy Front',
	description: 'Sandy Front Application',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='es' suppressHydrationWarning translate='no'>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<ThemeProvider attribute='class' defaultTheme='dark' enableSystem>
					<StatusProvider>
						<StatusProviderBot>
							<MessagesProvider>
								<main className='w-full'>
									<Toaster richColors position='top-right' />
									{children}
								</main>
							</MessagesProvider>
						</StatusProviderBot>
					</StatusProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
