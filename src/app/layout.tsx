import { esES } from '@clerk/localizations';
import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Geist, Geist_Mono, Unbounded } from 'next/font/google';
import './globals.css';
import { Footer } from '@/components/ui/footer';
import { MessagesProvider } from '@/context/MessagesContext';
import { StatusProvider } from '@/context/StatusContext';
import { StatusProviderBot } from '@/context/StatusContextBot';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { metadataBase, sharedDescription, sharedSiteName, sharedOpenGraphImage } from '@/lib/seo';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

const unbounded = Unbounded({
	variable: '--font-unbounded',
	subsets: ['latin'],
	weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
	metadataBase,
	title: {
		default: sharedSiteName,
		template: `%s | ${sharedSiteName}`,
	},
	description: sharedDescription,
	applicationName: sharedSiteName,
	alternates: {
		canonical: '/',
	},
	openGraph: {
		type: 'website',
		siteName: sharedSiteName,
		title: sharedSiteName,
		description: sharedDescription,
		url: '/',
		images: [
			{
				url: sharedOpenGraphImage,
				width: 1200,
				height: 630,
				alt: 'Sandy Studio',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: sharedSiteName,
		description: sharedDescription,
		images: [sharedOpenGraphImage],
	},
	icons: {
		icon: '/icons/icon.png',
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='es' suppressHydrationWarning translate='no'>
			<body
				className={`${geistSans.variable} ${geistMono.variable} ${unbounded.variable} flex min-h-screen flex-col antialiased`}
			>
				<ClerkProvider localization={esES}>
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
				</ClerkProvider>
			</body>
		</html>
	);
}
