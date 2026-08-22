'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

type FireworksProps = {
	className?: string;
};

type Spark = {
	angle: number;
	distance: number;
	delay: number;
	size: number;
	color: string;
};

type Burst = {
	x: number;
	y: number;
	delay: number;
	particles: Spark[];
};

const sparkColors = [
	'#F472B6',
	'#22D3EE',
	'#A78BFA',
	'#FDE047',
	'#34D399',
	'#FB7185',
	'#60A5FA',
	'#C4B5FD',
];

function makeBurst(x: number, y: number, delay: number): Burst {
	return {
		x,
		y,
		delay,
		particles: Array.from({ length: 10 }, (_, index) => {
			const angle = (Math.PI * 2 * index) / 10 + Math.random() * 0.4;
			const distance = 64 + Math.random() * 46;
			return {
				angle,
				distance,
				delay: delay + index * 0.015,
				size: 6 + Math.random() * 4,
				color: sparkColors[index % sparkColors.length],
			};
		}),
	};
}

export function OnboardingFireworks({ className }: FireworksProps) {
	const bursts = useMemo(
		() => [
			makeBurst(14, 16, 0),
			makeBurst(32, 8, 0.1),
			makeBurst(58, 14, 0.2),
			makeBurst(78, 10, 0.35),
			makeBurst(88, 18, 0.5),
		],
		[],
	);

	return (
		<div className={className} aria-hidden='true'>
			{bursts.map((burst, burstIndex) => (
				<div
					key={`${burst.x}-${burst.y}-${burstIndex}`}
					className='absolute'
					style={{ left: `${burst.x}%`, top: `${burst.y}%` }}
				>
					<motion.div
						className='-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 size-4 rounded-full bg-white/80 blur-[2px]'
						initial={{ scale: 0, opacity: 0 }}
						animate={{ scale: [0, 1.4, 0], opacity: [0, 1, 0] }}
						transition={{
							duration: 1.1,
							delay: burst.delay,
							repeat: Number.POSITIVE_INFINITY,
							repeatDelay: 1.35,
							ease: 'easeOut',
						}}
					/>
					<motion.div
						className='absolute top-1/2 left-1/2 rounded-full border border-white/55'
						initial={{ scale: 0.1, opacity: 0 }}
						animate={{ scale: [0.1, 2.25], opacity: [0, 0.55, 0] }}
						transition={{
							duration: 1.1,
							delay: burst.delay,
							repeat: Number.POSITIVE_INFINITY,
							repeatDelay: 1.35,
							ease: 'easeOut',
						}}
						style={{ width: 8, height: 8, marginLeft: -4, marginTop: -4 }}
					/>

					{burst.particles.map((spark, sparkIndex) => {
						const translateX = Math.cos(spark.angle) * spark.distance;
						const translateY = Math.sin(spark.angle) * spark.distance;

						return (
							<motion.span
								key={`${burstIndex}-${sparkIndex}`}
								className='absolute top-1/2 left-1/2 rounded-full shadow-[0_0_12px_rgba(255,255,255,0.45)]'
								style={{
									width: `${spark.size}px`,
									height: `${spark.size}px`,
									backgroundColor: spark.color,
									marginLeft: `${-spark.size / 2}px`,
									marginTop: `${-spark.size / 2}px`,
								}}
								initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
								animate={{
									x: [0, translateX * 0.55, translateX],
									y: [0, translateY * 0.55, translateY],
									opacity: [0, 1, 0],
									scale: [0.4, 1, 0.15],
								}}
								transition={{
									duration: 1.15,
									delay: spark.delay,
									repeat: Number.POSITIVE_INFINITY,
									repeatDelay: 1.35,
									ease: 'easeOut',
								}}
							/>
						);
					})}
				</div>
			))}
		</div>
	);
}
