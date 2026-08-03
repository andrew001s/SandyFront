'use client';

import { Hero } from '@/components/landing/Hero';
import { KoFiOverlay } from '@/components/landing/KoFi';
import { LandingNav } from '@/components/landing/LandingNav';
import { StarField } from '@/components/landing/StarField';
import dynamic from 'next/dynamic';

const Marquee = dynamic(() => import('@/components/landing/Marquee').then((m) => m.Marquee));
const Features = dynamic(() => import('@/components/landing/Features').then((m) => m.Features));
const HowItWorks = dynamic(() =>
	import('@/components/landing/HowItWorks').then((m) => m.HowItWorks),
);
const Faq = dynamic(() => import('@/components/landing/Faq').then((m) => m.Faq));
const Support = dynamic(() => import('@/components/landing/Support').then((m) => m.Support));
const Cta = dynamic(() => import('@/components/landing/Cta').then((m) => m.Cta));

export function Landing() {
	return (
		<div className='relative min-h-screen bg-[#F6F3FC] text-zinc-900 selection:bg-[#8B5CF6]/40 dark:bg-[#0B0A12] dark:text-zinc-50'>
			<StarField count={70} className='fixed inset-0 opacity-50' />
			<LandingNav />
			<KoFiOverlay />
			<div className='relative z-0 overflow-x-clip'>
				<Hero />
				<Marquee />
				<Features />
				<HowItWorks />
				<Faq />
				<Support />
				<Cta />
			</div>
		</div>
	);
}
