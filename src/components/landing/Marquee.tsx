import { Moon, Star } from 'lucide-react';

const items = [
	'Chat de Twitch',
	'Chat de Kick',
	'Chat de YouTube',
	'Reconocimiento de voz',
	'VTube Studio',
	'Respuestas con IA',
	'Voz natural',
	'Lip sync en vivo',
];

export function Marquee() {
	const row = [...items, ...items];

	return (
		<section className='relative border-[#1B1536]/10 border-y bg-[#EDE7FA] py-5 dark:border-white/10 dark:bg-[#0D0C16]'>
			<div className='pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#F6F3FC] to-transparent dark:from-[#0B0A12]' />
			<div className='pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#F6F3FC] to-transparent dark:from-[#0B0A12]' />

			<div className='flex w-max animate-[marquee_30s_linear_infinite] motion-reduce:animate-none'>
				{row.map((item, i) => (
					<div key={`${item}-${i}`} className='flex shrink-0 items-center gap-8 pr-8'>
						<span className='font-semibold text-sm text-zinc-700 uppercase tracking-wide [font-family:var(--font-unbounded)] dark:text-zinc-300'>
							{item}
						</span>
						{i % 2 === 0 ? (
							<Star
								size={12}
								style={{ animationDelay: `${(i % 4) * 0.35}s` }}
								className='shrink-0 animate-[twinkle_2.6s_ease-in-out_infinite] fill-[#8B5CF6] text-[#8B5CF6] dark:fill-[#A78BFA] dark:text-[#A78BFA]'
							/>
						) : (
							<Moon
								size={12}
								style={{ animationDelay: `${(i % 4) * 0.35 + 0.2}s` }}
								className='shrink-0 animate-[twinkle_3.2s_ease-in-out_infinite] fill-[#22D3EE]/80 text-[#0E9CC0] dark:fill-[#67E8F9]/80 dark:text-[#22D3EE]'
							/>
						)}
					</div>
				))}
			</div>
		</section>
	);
}
