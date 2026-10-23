'use client';

import { Hero } from '@/components/landing/Hero';
import { KoFiOverlay } from '@/components/landing/KoFi';
import { LandingNav } from '@/components/landing/LandingNav';
import { StarField } from '@/components/landing/StarField';
import dynamic from 'next/dynamic';

const Marquee = dynamic(() => import('@/components/landing/Marquee').then((m) => m.Marquee), {
	ssr: false,
});
const Features = dynamic(() => import('@/components/landing/Features').then((m) => m.Features));
const HowItWorks = dynamic(() =>
	import('@/components/landing/HowItWorks').then((m) => m.HowItWorks),
);
const Faq = dynamic(() => import('@/components/landing/Faq').then((m) => m.Faq));
const Support = dynamic(() => import('@/components/landing/Support').then((m) => m.Support), {
	ssr: false,
});
const Cta = dynamic(() => import('@/components/landing/Cta').then((m) => m.Cta), { ssr: false });

export function Landing() {
	return (
		<div className='relative min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-foreground'>
			<StarField
				count={35}
				className='pointer-events-none fixed inset-0 opacity-20 dark:opacity-35'
			/>
			<LandingNav />
			<KoFiOverlay />
			<main className='relative z-0 overflow-x-clip'>
				<Hero />
				<Marquee />
				<Features />
				<HowItWorks />
				<Faq />
				<Support />
				<Cta />
			</main>
		</div>
	);
}
