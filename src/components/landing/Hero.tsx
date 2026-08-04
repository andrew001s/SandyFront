'use client';

import { AuthAction } from '@/components/landing/AuthAction';
import { StarField } from '@/components/landing/StarField';
import { useAuth } from '@clerk/nextjs';
import { ArrowRight, Mic, Smile, Sparkle, Star, Tv } from 'lucide-react';
import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { BsMoonStarsFill } from 'react-icons/bs';
import { SiKick, SiTwitch, SiYoutube } from 'react-icons/si';

type ChatLine = {
	user?: string;
	color?: string;
	badge?: 'broadcaster' | 'mod' | 'vip';
	text?: string;
	kind: 'chat' | 'sandy' | 'system' | 'highlight' | 'thinking';
};

const script: ChatLine[] = [
	{ kind: 'highlight', text: '🎉 ¡Bienvenidos a la transmisión!' },
	{ kind: 'chat', user: 'ByBoxi', color: '#FF75A0', text: 'hola Sandy! 👋' },
	{ kind: 'thinking' },
	{ kind: 'sandy', text: '¡Hola chat! Conectada y lista para la transmisión' },
	{ kind: 'chat', user: 'ElShandrew', color: '#7AC943', badge: 'mod', text: 'Buenas! 🎉' },
	{ kind: 'highlight', text: '🔊 Voz: Sandy responde con su voz en vivo' },
	{ kind: 'chat', user: 'BlackJack_Unity', color: '#1E90FF', badge: 'vip', text: 'hola que haces' },
	{ kind: 'thinking' },
	{ kind: 'sandy', text: 'Te escucho perfecto, moviendo el modelo 🎭' },
	{ kind: 'chat', user: 'ReiraStone', color: '#B38373', text: 'se te escucha genial hoy' },
	{ kind: 'highlight', text: '💬 Usa comandos para que Sandy reaccione' },
	{ kind: 'system', text: '🎁 donación: "Eres increíble 💜"' },
	{ kind: 'thinking' },
	{ kind: 'sandy', text: '¡Gracias por la donación! Los quiero muchísimo 💜' },
	{ kind: 'chat', user: 'ByBoxi', color: '#FF75A0', text: 'Sandy, ¿puedes hacer un bailecito?' },
	{ kind: 'thinking' },
	{ kind: 'sandy', text: '¡Claro! Bailando un poco 💃' },
	{ kind: 'chat', user: 'FoxyNatore', color: '#7AC943', badge: 'mod', text: '¡Qué bien! 🎉' },
];

function TwitchBadge({ badge }: { badge: NonNullable<ChatLine['badge']> }) {
	const styles: Record<NonNullable<ChatLine['badge']>, string> = {
		broadcaster: 'bg-[#9146FF]',
		mod: 'bg-[#00AD03]',
		vip: 'bg-[#E005B9]',
	};
	const labels: Record<NonNullable<ChatLine['badge']>, string> = {
		broadcaster: 'S',
		mod: 'MOD',
		vip: 'VIP',
	};
	return (
		<span
			className={`mr-1 inline-flex h-[14px] min-w-[14px] items-center justify-center rounded-[4px] px-0.5 align-middle font-bold text-[8px] text-white ${styles[badge]}`}
		>
			{labels[badge]}
		</span>
	);
}

function ChatMock() {
	const [step, setStep] = useState(0);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const tick = () => setStep((s) => (s >= script.length ? 0 : s + 1));

		if (typeof IntersectionObserver === 'undefined') {
			const id = setInterval(tick, 1600);
			return () => clearInterval(id);
		}

		let id: ReturnType<typeof setInterval> | null = null;
		const start = () => {
			if (id) return;
			id = setInterval(tick, 1600);
		};
		const stop = () => {
			if (id) {
				clearInterval(id);
				id = null;
			}
		};

		const observer = new IntersectionObserver((entries) => {
			if (entries[0]?.isIntersecting) {
				start();
			} else {
				stop();
			}
		});
		if (ref.current) {
			observer.observe(ref.current);
		}
		start();

		return () => {
			stop();
			observer.disconnect();
		};
	}, []);

	const shown = script.slice(0, step).filter((m) => m.kind !== 'thinking');
	const current = step < script.length ? script[step] : undefined;

	return (
		<motion.div
			ref={ref}
			initial={{ opacity: 0, y: 40, rotateX: 6 }}
			animate={{ opacity: 1, y: 0, rotateX: 0 }}
			transition={{ duration: 0.9, delay: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
			className='relative w-full overflow-hidden rounded-lg border border-[#26262C] bg-[#18181B] shadow-[0_20px_80px_rgba(0,0,0,0.5)] sm:w-[52%]'
		>
			<div className='flex items-center justify-between border-[#26262C] border-b bg-[#18181B] px-3 py-2.5'>
				<div className='flex items-center gap-1.5 font-semibold text-[#EFEFF1] text-xs'>
					<Tv size={13} className='text-[#9146FF]' />
					Chat de la transmisión
				</div>
				<span className='flex items-center gap-1.5 rounded bg-[#9146FF]/15 px-2 py-1 font-semibold text-[#BF94FF] text-[10px]'>
					<span className='h-1.5 w-1.5 animate-pulse rounded-full bg-[#9146FF]' />
					LIVE
				</span>
			</div>

			<div className='flex h-[360px] flex-col justify-end gap-1 overflow-hidden px-3 py-3'>
				<AnimatePresence initial={false}>
					{shown.map((line, i) => (
						<motion.div
							key={i}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, transition: { duration: 0.2 } }}
							transition={{ duration: 0.35 }}
							className='text-[13px] leading-snug'
						>
							{line.kind === 'highlight' && (
								<p className='rounded bg-[#9146FF]/10 px-2 py-1 font-medium text-[#BF94FF] text-[13px]'>
									{line.text}
								</p>
							)}
							{line.kind === 'system' && (
								<p className='px-1 py-0.5 text-[#ADADB8] text-[12px] italic'>{line.text}</p>
							)}
							{(line.kind === 'chat' || line.kind === 'sandy') && (
								<p className='px-1 py-0.5'>
									{line.kind === 'sandy' && <TwitchBadge badge='broadcaster' />}
									{line.badge && <TwitchBadge badge={line.badge} />}
									<span
										className={`mr-1 font-semibold ${
											line.kind === 'sandy' ? 'text-[#9146FF]' : ''
										}`}
										style={line.kind === 'sandy' ? undefined : { color: line.color }}
									>
										{line.kind === 'sandy' ? 'Sandy' : line.user}
									</span>
									<span className='text-[#EFEFF1]'>{line.text}</span>
								</p>
							)}
						</motion.div>
					))}
				</AnimatePresence>

				<AnimatePresence>
					{current?.kind === 'thinking' && (
						<motion.div
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 8 }}
							className='flex items-center gap-1 px-1 py-1'
						>
							<span className='mr-1 font-semibold text-[#9146FF] text-[12px]'>Sandy</span>
							{['', '', ''].map((_, i) => (
								<motion.span
									key={i}
									animate={{ opacity: [0.2, 1, 0.2] }}
									transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: i * 0.2 }}
									className='h-1.5 w-1.5 rounded-full bg-[#9146FF]'
								/>
							))}
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			<div className='flex items-center gap-2 border-[#26262C] border-t bg-[#18181B] px-3 py-2.5'>
				<div className='flex flex-1 items-center gap-2 rounded-md bg-[#1F1F23] px-3 py-1.5 text-[#ADADB8] text-[13px]'>
					<Smile size={14} className='text-[#ADADB8]' />
					Enviar un mensaje...
				</div>
			</div>
		</motion.div>
	);
}

function VtuberMock() {
	return (
		<motion.div
			initial={{ opacity: 0, y: 40, rotateX: 6 }}
			animate={{ opacity: 1, y: 0, rotateX: 0 }}
			transition={{ duration: 0.9, delay: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
			className='relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-[#26262C] bg-[#18181B] shadow-[0_20px_80px_rgba(0,0,0,0.5)] sm:w-[48%]'
		>
			<video
				autoPlay
				muted
				loop
				playsInline
				preload='auto'
				poster='/hero-poster.jpg'
				aria-label='Sandy VTuber en vivo'
				className='absolute inset-0 size-full object-cover'
			>
				<source src='/hero.webm' type='video/webm' />
				<source src='/hero.mp4' type='video/mp4' />
			</video>
			<div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20' />
			<div className='absolute right-3 bottom-3 flex items-center gap-1.5 rounded bg-black/60 px-2 py-1 text-[#EFEFF1] text-[10px]'>
				<Mic size={11} className='text-[#BF94FF]' />
				Escuchando chat
			</div>
		</motion.div>
	);
}

const integrations = [
	{ name: 'Twitch', icon: <SiTwitch size={13} className='text-[#9146FF]' /> },
	{ name: 'Kick', icon: <SiKick size={13} className='text-[#53FC18]' /> },
	{ name: 'YouTube', icon: <SiYoutube size={13} className='text-[#FF0000]' /> },
	{ name: 'VTube Studio', icon: null },
];

export function Hero() {
	const { isSignedIn } = useAuth();
	const ref = useRef<HTMLDivElement>(null);
	const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
	const glowY = useTransform(scrollYProgress, [0, 1], [0, 160]);
	const textY = useTransform(scrollYProgress, [0, 1], [0, -60]);

	return (
		<section ref={ref} className='relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-32'>
			<motion.div style={{ y: glowY }} className='-z-10 pointer-events-none absolute inset-0'>
				<StarField count={90} seed={11} className='absolute inset-0 opacity-80' />
				<div className='-translate-x-1/2 absolute top-[-20%] left-1/2 h-[560px] w-[860px] rounded-full bg-[#8B5CF6]/25 blur-[70px] md:blur-[140px]' />
				<div className='absolute right-[-10%] bottom-[-10%] h-[420px] w-[520px] rounded-full bg-[#22D3EE]/15 blur-[60px] md:blur-[130px]' />
				<div className='absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(139,92,246,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.14)_1px,transparent_1px)] [background-size:72px_72px] dark:opacity-[0.04] dark:[background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)]' />
			</motion.div>

			<div className='mx-auto grid max-w-7xl items-center gap-14 px-5 md:px-8 lg:grid-cols-[1.1fr_0.9fr]'>
				<motion.div style={{ y: textY }}>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.1 }}
						className='mb-6 inline-flex items-center gap-2 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-4 py-1.5 font-medium text-violet-700 text-xs dark:text-[#C4B5FD]'
					>
						<span className='relative flex h-1.5 w-1.5'>
							<span className='absolute h-1.5 w-1.5 animate-ping rounded-full bg-[#22D3EE] opacity-75' />
							<span className='h-1.5 w-1.5 rounded-full bg-[#22D3EE]' />
						</span>
						VTuber impulsada por IA · lista para tu transmisión
						<BsMoonStarsFill size={16} className='text-violet-500 dark:text-violet-300' />
					</motion.div>

					<motion.h1
						initial={{ opacity: 0, y: 28 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.7, delay: 0.2 }}
						className='font-extrabold text-4xl text-zinc-900 leading-[1.05] tracking-tight [font-family:var(--font-unbounded)] sm:text-5xl lg:text-6xl dark:text-zinc-50'
					>
						Sandy Studio
						<br />
						tu chat conversa con una{' '}
						<span className='bg-gradient-to-r from-violet-600 via-violet-700 to-cyan-600 bg-clip-text text-transparent dark:from-[#A78BFA] dark:via-[#8B5CF6] dark:to-[#22D3EE]'>
							VTuber IA
						</span>{' '}
						<motion.span
							animate={{ rotate: [0, 18, -10, 0], scale: [1, 1.2, 1] }}
							transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
							className='inline-block align-[-0.08em]'
						>
							<Star
								size={26}
								className='fill-amber-400 text-amber-400 drop-shadow-[0_0_12px_rgba(253,230,138,0.9)] dark:fill-[#FDE68A] dark:text-[#FDE68A]'
							/>
						</motion.span>
						.
					</motion.h1>

					<motion.p
						initial={{ opacity: 0, y: 24 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.7, delay: 0.35 }}
						className='mt-6 max-w-xl text-lg text-zinc-600 leading-relaxed dark:text-zinc-400'
					>
						Una VTuber con inteligencia artificial que lee el chat de Twitch, Kick y YouTube,
						responde con su voz, se mueve en VTube Studio y entiende lo que dices por micrófono.
					</motion.p>

					<motion.div
						initial={{ opacity: 0, y: 24 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.7, delay: 0.5 }}
						className='mt-8 flex flex-wrap items-center gap-3'
					>
						<AuthAction
							action={isSignedIn ? 'app' : 'signup'}
							className='group h-12 rounded-full border border-[#8B5CF6]/40 bg-[#8B5CF6] px-7 text-base text-white shadow-[0_0_28px_rgba(139,92,246,0.4)] transition-all hover:bg-[#7C4DFF] hover:shadow-[0_0_36px_rgba(139,92,246,0.6)]'
						>
							{isSignedIn ? 'Ir a la app' : 'Empezar gratis'}
							<ArrowRight size={18} className='transition-transform group-hover:translate-x-1' />
						</AuthAction>
					</motion.div>

					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.8, delay: 0.7 }}
						className='mt-12'
					>
						<p className='mb-3 text-xs text-zinc-500 uppercase tracking-[0.25em]'>
							Conecta con las herramientas que ya usas
						</p>
						<div className='flex flex-wrap gap-2'>
							{integrations.map(({ name, icon }) => (
								<span
									key={name}
									className='flex items-center gap-1.5 rounded-full border border-[#1B1536]/10 bg-white/70 px-3.5 py-1.5 text-xs text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300'
								>
									{icon}
									{name}
								</span>
							))}
						</div>
					</motion.div>
				</motion.div>

				<div className='relative flex justify-center lg:justify-end' style={{ perspective: 1000 }}>
					<div className='flex w-full max-w-[540px] flex-col gap-4 sm:flex-row'>
						<VtuberMock />
						<ChatMock />
					</div>
					<motion.span
						animate={{ y: [0, -10, 0], opacity: [0.4, 1, 0.4] }}
						transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY }}
						className='-left-4 absolute top-6 hidden text-violet-500/80 md:block dark:text-[#A78BFA]/80'
					>
						<Sparkle size={22} className='fill-violet-500/40 dark:fill-[#A78BFA]/40' />
					</motion.span>
					<motion.span
						animate={{ y: [0, -8, 0], opacity: [0.3, 1, 0.3] }}
						transition={{ duration: 4.2, repeat: Number.POSITIVE_INFINITY, delay: 0.8 }}
						className='-right-3 absolute bottom-16 hidden text-cyan-600/80 md:block dark:text-[#67E8F9]/80'
					>
						<Sparkle size={16} className='fill-cyan-600/40 dark:fill-[#67E8F9]/40' />
					</motion.span>
					<motion.span
						animate={{ opacity: [0, 1, 0], scale: [0.6, 1, 0.6] }}
						transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, delay: 0.4 }}
						className='-bottom-4 absolute left-10 hidden text-amber-500 md:block dark:text-[#FDE68A]/90'
					>
						<Star size={14} className='fill-amber-500 dark:fill-[#FDE68A]' />
					</motion.span>
				</div>
			</div>
		</section>
	);
}
