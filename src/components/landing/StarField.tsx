'use client';

import { useMemo } from 'react';
import { BsMoonStarsFill } from 'react-icons/bs';

type Star = {
	top: string;
	left: string;
	size: number;
	delay: number;
	duration: number;
	glow: boolean;
};

type StarFieldProps = {
	count?: number;
	seed?: number;
	className?: string;
	moon?: boolean;
	moonClassName?: string;
};

type MoonGlowProps = {
	className?: string;
	flip?: boolean;
};

export function MoonGlow({ className = '', flip = false }: MoonGlowProps) {
	return (
		<div className={`relative ${flip ? '-scale-x-100' : ''} ${className}`}>
			<BsMoonStarsFill
				size={62}
				aria-hidden='true'
				className='absolute top-1 left-1 animate-pulse text-violet-600/70 blur-[0.4px] drop-shadow-[0_0_16px_rgba(168,85,247,0.18)] dark:text-white/55'
			/>
		</div>
	);
}

function mulberry32(seed: number) {
	let state = seed;
	return () => {
		state |= 0;
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function StarField({
	count = 40,
	seed = 7,
	className = 'absolute inset-0',
	moon = false,
	moonClassName = 'top-12 right-[10%]',
}: StarFieldProps) {
	const stars = useMemo<Array<Star>>(() => {
		const rand = mulberry32(seed);
		return Array.from({ length: count }, () => {
			const glow = rand() > 0.78;
			return {
				top: `${Math.round(rand() * 100)}%`,
				left: `${Math.round(rand() * 100)}%`,
				size: glow ? 3 : rand() > 0.45 ? 2 : 1,
				delay: Math.round(rand() * 6000) / 1000,
				duration: Math.round((2.4 + rand() * 3.2) * 100) / 100,
				glow,
			};
		});
	}, [count, seed]);

	return (
		<div aria-hidden='true' className={`pointer-events-none overflow-hidden ${className}`}>
			{stars.map((star, i) => (
				<span
					key={i}
					className='absolute rounded-full bg-[#8B5CF6]/80 dark:bg-white'
					style={{
						top: star.top,
						left: star.left,
						width: star.size,
						height: star.size,
						boxShadow: star.glow ? '0 0 8px rgba(139,92,246,0.55)' : '0 0 3px rgba(139,92,246,0.3)',
						animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
					}}
				/>
			))}
			{moon && (
				<div
					style={{ animation: 'float-slow 9s ease-in-out infinite' }}
					className={`absolute ${moonClassName}`}
				>
					<MoonGlow />
				</div>
			)}
		</div>
	);
}
