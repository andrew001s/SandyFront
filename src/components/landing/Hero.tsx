'use client';

import { AuthAction } from '@/components/landing/AuthAction';
import { MoonGlow, StarField } from '@/components/landing/StarField';
import { useAuth } from '@clerk/nextjs';
import { ArrowRight, Mic, Sparkle, Star, Tv } from 'lucide-react';
import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { BsMoonStarsFill } from 'react-icons/bs';

const script: Array<{ type: 'user' | 'sandy' | 'thinking'; text?: string }> = [
	{ type: 'user', text: 'Alguien en el chat: "hola Sandy!" 👋' },
	{ type: 'thinking' },
	{ type: 'sandy', text: '¡Hola chat! Conectada y lista para la transmisión' },
	{ type: 'user', text: '!hola  (audio de tu micrófono)' },
	{ type: 'thinking' },
	{ type: 'sandy', text: 'Te escucho perfecto, moviendo el modelo 🎭' },
	{ type: 'user', text: '!comando openrouter' },
	{ type: 'thinking' },
	{ type: 'sandy', text: 'Modelo cargado. Respondo lo que quieras' },
	{ type: 'user', text: 'Donación: "Eres increíble 💜"' },
	{ type: 'thinking' },
	{ type: 'sandy', text: '¡Gracias por la donación! Los quiero muchísimo 💜' },
	{ type: 'user', text: '!hora' },
	{ type: 'thinking' },
	{ type: 'sandy', text: 'Son las 22:14, hora del stream ⏰' },
];

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

	const shown = script.slice(0, step).filter((m) => m.type !== 'thinking');
	const current = step < script.length ? script[step] : undefined;

	return (
		<motion.div
			ref={ref}
			initial={{ opacity: 0, y: 40, rotateX: 6 }}
			animate={{ opacity: 1, y: 0, rotateX: 0 }}
			transition={{ duration: 0.9, delay: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
			className='relative w-full max-w-md'
		>
			<div className='-inset-6 -z-10 absolute rounded-[2rem] bg-gradient-to-tr from-[#8B5CF6]/30 via-transparent to-[#22D3EE]/20 blur-2xl' />
			<MoonGlow flip className='-top-12 -right-4 absolute hidden sm:block' />

			<div className='overflow-hidden rounded-2xl border border-[#1B1536]/10 bg-white/90 shadow-[0_20px_80px_rgba(109,91,208,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-[#100F1B]/90 dark:shadow-[0_20px_80px_rgba(0,0,0,0.5)]'>
				<div className='z-50 flex items-center justify-between border-[#1B1536]/10 border-b bg-white/90 px-4 py-3 dark:border-white/10 dark:bg-[#100F1B]/90'>
					<div className='flex items-center gap-2'>
						<div className='flex gap-1.5'>
							<span className='h-3 w-3 rounded-full bg-[#FF5F57]' />
							<span className='h-3 w-3 rounded-full bg-[#FEBC2E]' />
							<span className='h-3 w-3 rounded-full bg-[#28C840]' />
						</div>
						<span className='ml-3 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400'>
							<Tv size={12} className='text-violet-600 dark:text-[#A78BFA]' />
							sandy-core · streaming
						</span>
					</div>
					<span className='flex items-center gap-1.5 rounded-full bg-[#8B5CF6]/15 px-2.5 py-1 font-medium text-[10px] text-violet-700 dark:text-[#A78BFA]'>
						<span className='h-1.5 w-1.5 animate-pulse rounded-full bg-[#A78BFA]' />
						ON AIR
					</span>
				</div>

				<div className='flex h-[360px] flex-col justify-end gap-2.5 overflow-hidden px-4 py-4'>
					<AnimatePresence initial={false}>
						{shown.map((line, i) => (
							<motion.div
								key={i}
								initial={{ opacity: 0, y: 14, scale: 0.97 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, transition: { duration: 0.25 } }}
								transition={{ duration: 0.4 }}
								className={`flex ${line.type === 'user' ? 'justify-end' : 'justify-start'}`}
							>
								<div
									className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-snug ${
										line.type === 'user'
											? 'rounded-br-md bg-[#8B5CF6] text-white'
											: 'rounded-bl-md border border-[#1B1536]/10 bg-[#8B5CF6]/5 text-zinc-800 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100'
									}`}
								>
									{line.type === 'sandy' && (
										<span className='mb-0.5 block font-medium text-[10px] text-violet-600 dark:text-[#A78BFA]'>
											Sandy
										</span>
									)}
									{line.text}
								</div>
							</motion.div>
						))}
					</AnimatePresence>

					<AnimatePresence>
						{current?.type === 'thinking' && (
							<motion.div
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 8 }}
								className='flex justify-start'
							>
								<div className='flex items-center gap-1 rounded-2xl rounded-bl-md border border-[#1B1536]/10 bg-[#8B5CF6]/5 px-4 py-3 dark:border-white/10 dark:bg-white/5'>
									{['S', 'A', 'N'].map((_, i) => (
										<motion.span
											key={i}
											animate={{ opacity: [0.2, 1, 0.2] }}
											transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: i * 0.2 }}
											className='h-1.5 w-1.5 rounded-full bg-violet-500 dark:bg-[#A78BFA]'
										/>
									))}
								</div>
							</motion.div>
						)}
					</AnimatePresence>

					<motion.div
						animate={{ opacity: [0.4, 1, 0.4] }}
						transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY }}
						className='flex items-center gap-2 pt-2 text-[10px] text-zinc-500 uppercase tracking-[0.2em] dark:text-zinc-400'
					>
						<Mic size={10} />
						Escuchando chat · en vivo
					</motion.div>
				</div>
			</div>
		</motion.div>
	);
}

const integrations = ['Twitch', 'VTube Studio'];

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
						Tu chat conversa
						<br />
						con una{' '}
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
						Una VTuber con inteligencia artificial que lee tu chat de Twitch, responde con su voz,
						se mueve en VTube Studio y entiende lo que dices por micrófono.
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
							{integrations.map((name) => (
								<span
									key={name}
									className='rounded-full border border-[#1B1536]/10 bg-white/70 px-3.5 py-1.5 text-xs text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300'
								>
									{name}
								</span>
							))}
						</div>
					</motion.div>
				</motion.div>

				<div className='relative flex justify-center lg:justify-end' style={{ perspective: 1000 }}>
					<ChatMock />
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
