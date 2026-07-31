'use client';

import { Cta } from '@/components/landing/Cta';
import { Faq } from '@/components/landing/Faq';
import { Features } from '@/components/landing/Features';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { LandingNav } from '@/components/landing/LandingNav';
import { Marquee } from '@/components/landing/Marquee';
import { StarField } from '@/components/landing/StarField';

export function Landing() {
	return (
		<div className='relative min-h-screen bg-[#F6F3FC] text-zinc-900 selection:bg-[#8B5CF6]/40 dark:bg-[#0B0A12] dark:text-zinc-50'>
			<StarField count={70} className='fixed inset-0 opacity-50' />
			<LandingNav />
			<div className='relative z-0 overflow-x-clip'>
				<Hero />
				<Marquee />
				<Features />
				<HowItWorks />
				<Faq />
				<Cta />
			</div>
		</div>
	);
}
