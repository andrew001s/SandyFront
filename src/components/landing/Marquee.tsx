import { Moon, Star } from 'lucide-react';

const items = [
	'Chat de Twitch',
	'Chat de Kick',
	'Chat de YouTube',
	'Reconocimiento de voz Azure',
	'VTube Studio (Live2D)',
	'VSeeFace (VRM 3D)',
	'Gemini & OpenRouter',
	'Fish Audio TTS',
	'Lip sync en tiempo real',
	'Comandos de chat',
];

export function Marquee() {
	const row = [...items, ...items];

	return (
		<section className='relative border-border border-y bg-card/30 py-3.5 backdrop-blur-sm'>
			<div className='pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-background to-transparent' />
			<div className='pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-background to-transparent' />

			<div className='flex w-max animate-[marquee_35s_linear_infinite] motion-reduce:animate-none'>
				{row.map((item, i) => (
					<div key={`${item}-${i}`} className='flex shrink-0 items-center gap-6 pr-6'>
						<span className='font-medium font-mono text-muted-foreground text-xs uppercase tracking-wider'>
							{item}
						</span>
						{i % 2 === 0 ? (
							<Star
								size={12}
								style={{ animationDelay: `${(i % 4) * 0.35}s` }}
								className='shrink-0 animate-[twinkle_2.6s_ease-in-out_infinite] fill-primary text-primary'
							/>
						) : (
							<Moon
								size={12}
								style={{ animationDelay: `${(i % 4) * 0.35 + 0.2}s` }}
								className='shrink-0 animate-[twinkle_3.2s_ease-in-out_infinite] fill-[#F28BD8]/80 text-[#F28BD8]'
							/>
						)}
					</div>
				))}
			</div>
		</section>
	);
}
