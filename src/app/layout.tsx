import { esES } from '@clerk/localizations';
import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Unbounded } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/components/providers/AppProviders';
import { Footer } from '@/components/ui/footer';
import { metadataBase, sharedDescription, sharedOpenGraphImage, sharedSiteName } from '@/lib/seo';
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

const unbounded = Unbounded({
	variable: '--font-unbounded',
	subsets: ['latin'],
});

export const viewport: Viewport = {
	themeColor: '#8B5CF6',
	colorScheme: 'light dark',
};

export const metadata: Metadata = {
	metadataBase,
	title: {
		default: sharedSiteName,
		template: `%s | ${sharedSiteName}`,
	},
	description: sharedDescription,
	applicationName: sharedSiteName,
	manifest: '/manifest.webmanifest',
	alternates: {
		canonical: '/',
	},
	openGraph: {
		type: 'website',
		siteName: sharedSiteName,
		title: sharedSiteName,
		description: sharedDescription,
		url: '/',
		locale: 'es_ES',
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
		site: '@ElShandrew',
		creator: '@ElShandrew',
	},
	verification: {
		google: 'AL5En1HMHtQ2Q0tI5CsdqAgKRlzJY-kU7qZ02BZtABQ',
	},
	icons: {
		icon: [
			{ url: '/favicon.ico', type: 'image/x-icon', sizes: 'any' },
			{ url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
			{ url: '/favicon.svg', type: 'image/svg+xml' },
		],
		apple: '/apple-touch-icon.png',
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
						<AppProviders>
							<main className='w-full flex-grow'>
								<Toaster richColors position='top-right' />
								{children}
							</main>
							<Footer />
						</AppProviders>
					</ThemeProvider>
				</ClerkProvider>
			</body>
		</html>
	);
}
