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
	{ kind: 'highlight', text: '¡Transmisión iniciada en directo!' },
	{ kind: 'chat', user: 'ByBoxi', color: '#FF75A0', text: 'hola Sandy! 👋' },
	{ kind: 'thinking' },
	{ kind: 'sandy', text: '¡Hola chat! Conectada y lista para la transmisión' },
	{ kind: 'chat', user: 'ElShandrew', color: '#7AC943', badge: 'mod', text: 'Buenas! 🎉' },
	{ kind: 'highlight', text: 'Voz sintetizada activa con Fish Audio' },
	{ kind: 'chat', user: 'BlackJack_Unity', color: '#1E90FF', badge: 'vip', text: 'hola que haces' },
	{ kind: 'thinking' },
	{ kind: 'sandy', text: 'Te escucho perfecto, sincronizando modelo Live2D 🎭' },
	{ kind: 'chat', user: 'ReiraStone', color: '#B38373', text: 'se te escucha genial hoy' },
	{ kind: 'system', text: 'Donación recibida: "Sandy eres increíble"' },
	{ kind: 'thinking' },
	{ kind: 'sandy', text: '¡Muchísimas gracias por el apoyo al canal!' },
	{ kind: 'chat', user: 'ByBoxi', color: '#FF75A0', text: 'Sandy, ¿puedes hacer un bailecito?' },
	{ kind: 'thinking' },
	{ kind: 'sandy', text: '¡Claro que sí! Movimiento enviado a VTube Studio' },
];

function TwitchBadge({ badge }: { badge: NonNullable<ChatLine['badge']> }) {
	const styles: Record<NonNullable<ChatLine['badge']>, string> = {
		broadcaster: 'bg-primary text-primary-foreground',
		mod: 'bg-emerald-600 text-white',
		vip: 'bg-fuchsia-600 text-white',
	};
	const labels: Record<NonNullable<ChatLine['badge']>, string> = {
		broadcaster: 'STREAMER',
		mod: 'MOD',
		vip: 'VIP',
	};
	return (
		<span
			className={`mr-1.5 inline-flex items-center justify-center rounded px-1 py-0.5 font-bold font-mono text-[9px] uppercase tracking-wider ${styles[badge]}`}
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
			const id = setInterval(tick, 1700);
			return () => clearInterval(id);
		}

		let id: ReturnType<typeof setInterval> | null = null;
		const start = () => {
			if (id) return;
			id = setInterval(tick, 1700);
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
			initial={{ opacity: 0, y: 30 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.7, delay: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
			className='relative w-full overflow-hidden rounded-xl border border-border bg-card shadow-[0_16px_40px_rgba(0,0,0,0.35)] sm:w-[54%]'
		>
			<div className='flex items-center justify-between border-border border-b bg-card/90 px-3.5 py-2.5'>
				<div className='flex items-center gap-2 font-medium font-mono text-foreground text-xs'>
					<Tv size={14} className='text-primary' />
					<span>Monitor de chat</span>
				</div>
				<span className='flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-400'>
					<span className='size-1.5 animate-pulse rounded-full bg-emerald-400' />
					LIVE
				</span>
			</div>

			<div className='flex h-[350px] flex-col justify-end gap-1.5 overflow-hidden px-3.5 py-3 font-sans'>
				<AnimatePresence initial={false}>
					{shown.map((line, i) => (
						<motion.div
							key={`${line.text}-${i}`}
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, transition: { duration: 0.2 } }}
							transition={{ duration: 0.3 }}
							className='text-xs leading-relaxed'
						>
							{line.kind === 'highlight' && (
								<p className='rounded border border-primary/20 bg-primary/10 px-2 py-1 font-medium text-primary'>
									{line.text}
								</p>
							)}
							{line.kind === 'system' && (
								<p className='font-mono text-[11px] text-muted-foreground italic'>{line.text}</p>
							)}
							{line.kind === 'sandy' && (
								<div className='rounded-md border-primary border-l-2 bg-primary/[0.07] px-2 py-1'>
									<TwitchBadge badge='broadcaster' />
									<span className='mr-1.5 font-bold text-primary'>Sandy</span>
									<span className='text-foreground'>{line.text}</span>
								</div>
							)}
							{line.kind === 'chat' && (
								<p className='px-1 py-0.5'>
									{line.badge && <TwitchBadge badge={line.badge} />}
									<span className='mr-1.5 font-semibold' style={{ color: line.color }}>
										{line.user}
									</span>
									<span className='text-foreground/90'>{line.text}</span>
								</p>
							)}
						</motion.div>
					))}
				</AnimatePresence>

				<AnimatePresence>
					{current?.kind === 'thinking' && (
						<motion.div
							initial={{ opacity: 0, y: 6 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 6 }}
							className='flex items-center gap-1 px-2 py-1'
						>
							<span className='mr-1.5 font-mono text-[11px] text-primary'>Sandy procesando</span>
							{[0, 1, 2].map((i) => (
								<motion.span
									key={i}
									animate={{ opacity: [0.2, 1, 0.2] }}
									transition={{ duration: 0.9, repeat: Number.POSITIVE_INFINITY, delay: i * 0.2 }}
									className='size-1.5 rounded-full bg-primary'
								/>
							))}
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			<div className='flex items-center gap-2 border-border border-t bg-card/60 px-3 py-2'>
				<div className='flex flex-1 items-center gap-2 rounded border border-border/60 bg-background/60 px-2.5 py-1.5 text-muted-foreground text-xs'>
					<Smile size={13} />
					<span className='font-sans'>Mensaje al canal...</span>
				</div>
			</div>
		</motion.div>
	);
}

function VtuberMock() {
	return (
		<motion.div
			initial={{ opacity: 0, y: 30 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.7, delay: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
			className='relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-border bg-card shadow-[0_16px_40px_rgba(0,0,0,0.35)] sm:w-[46%]'
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
			<div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent' />
			<div className='absolute right-2.5 bottom-2.5 flex items-center gap-1.5 rounded border border-border/80 bg-background/85 px-2 py-1 font-mono text-[10px] text-foreground backdrop-blur-sm'>
				<Mic size={11} className='text-primary' />
				<span>Lip sync 60 FPS</span>
			</div>
		</motion.div>
	);
}

const integrations = [
	{ name: 'Twitch', icon: <SiTwitch size={13} className='text-[#9146FF]' /> },
	{ name: 'Kick', icon: <SiKick size={13} className='text-[#53FC18]' /> },
	{ name: 'YouTube', icon: <SiYoutube size={13} className='text-[#FF0000]' /> },
	{ name: 'VTube Studio (Live2D)', icon: null },
	{ name: 'VNyan (VRM 3D)', icon: null },
];

export function Hero() {
	const { isSignedIn } = useAuth();
	const ref = useRef<HTMLDivElement>(null);
	const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
	const textY = useTransform(scrollYProgress, [0, 1], [0, -40]);

	return (
		<section ref={ref} className='relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28'>
			<div className='-z-10 pointer-events-none absolute inset-0'>
				<StarField count={45} seed={11} className='absolute inset-0 opacity-40' />
				<div className='-translate-x-1/2 absolute top-0 left-1/2 h-[420px] w-[700px] rounded-full bg-primary/10 blur-[100px]' />
				<div className='absolute right-0 bottom-0 h-[300px] w-[400px] rounded-full bg-[#F28BD8]/5 blur-[90px]' />
			</div>

			<div className='mx-auto grid max-w-6xl items-center gap-12 px-4 md:px-6 lg:grid-cols-[1.1fr_0.9fr]'>
				<motion.div style={{ y: textY }}>
					<motion.div
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.1 }}
						className='mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 font-medium text-primary text-xs'
					>
						<span className='relative flex h-1.5 w-1.5'>
							<span className='absolute h-1.5 w-1.5 animate-ping rounded-full bg-[#22D3EE] opacity-75' />
							<span className='h-1.5 w-1.5 rounded-full bg-[#22D3EE]' />
						</span>
						<span>VTuber impulsada por IA · lista para tu transmisión</span>
						<BsMoonStarsFill size={15} className='text-primary' />
					</motion.div>

					<motion.h1
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.15 }}
						className='font-bold font-display text-4xl text-foreground leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl'
					>
						Sandy Studio
						<br />
						tu chat conversa con una{' '}
						<span className='bg-gradient-to-r from-primary via-[#B8AAFF] to-[#F28BD8] bg-clip-text text-transparent'>
							VTuber IA
						</span>{' '}
						<motion.span
							animate={{ rotate: [0, 18, -10, 0], scale: [1, 1.2, 1] }}
							transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
							className='inline-block align-[-0.08em]'
						>
							<Star
								size={28}
								className='fill-amber-400 text-amber-400 drop-shadow-[0_0_12px_rgba(253,230,138,0.9)] dark:fill-[#FDE68A] dark:text-[#FDE68A]'
							/>
						</motion.span>
						.
					</motion.h1>

					<motion.p
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.25 }}
						className='mt-6 max-w-xl font-sans text-base text-muted-foreground leading-relaxed sm:text-lg'
					>
						Una co-animadora inteligente que lee el chat de Twitch, Kick y YouTube, responde con su
						propia voz sintetizada, sincroniza labios en VTube Studio y VNyan, y comprende lo que
						dices por tu micrófono.
					</motion.p>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.35 }}
						className='mt-8 flex flex-wrap items-center gap-3'
					>
						<AuthAction
							action={isSignedIn ? 'app' : 'signup'}
							className='group h-11 rounded-lg bg-primary px-6 font-sans font-semibold text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.2),0_4px_16px_rgba(140,124,255,0.25)] transition-all hover:bg-primary/90'
						>
							<span>{isSignedIn ? 'Ir a la consola' : 'Empezar gratis'}</span>
							<ArrowRight size={16} className='transition-transform group-hover:translate-x-1' />
						</AuthAction>
					</motion.div>

					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.6, delay: 0.45 }}
						className='mt-10'
					>
						<p className='mb-2.5 font-mono text-[11px] text-muted-foreground uppercase tracking-wider'>
							Compatibilidad verificada
						</p>
						<div className='flex flex-wrap gap-2'>
							{integrations.map(({ name, icon }) => (
								<span
									key={name}
									className='flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2.5 py-1 font-mono text-foreground/80 text-xs'
								>
									{icon}
									<span>{name}</span>
								</span>
							))}
						</div>
					</motion.div>
				</motion.div>

				<div className='relative flex justify-center lg:justify-end' style={{ perspective: 1000 }}>
					<div className='flex w-full max-w-[520px] flex-col gap-4 sm:flex-row'>
						<VtuberMock />
						<ChatMock />
					</div>
					<motion.span
						animate={{ y: [0, -10, 0], opacity: [0.4, 1, 0.4] }}
						transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY }}
						className='-left-4 absolute top-6 hidden text-primary/80 md:block'
					>
						<Sparkle size={22} className='fill-primary/40' />
					</motion.span>
					<motion.span
						animate={{ y: [0, -8, 0], opacity: [0.3, 1, 0.3] }}
						transition={{ duration: 4.2, repeat: Number.POSITIVE_INFINITY, delay: 0.8 }}
						className='-right-3 absolute bottom-16 hidden text-[#F28BD8]/80 md:block'
					>
						<Sparkle size={16} className='fill-[#F28BD8]/40' />
					</motion.span>
					<motion.span
						animate={{ opacity: [0, 1, 0], scale: [0.6, 1, 0.6] }}
						transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, delay: 0.4 }}
						className='-bottom-4 absolute left-10 hidden text-amber-400 md:block'
					>
						<Star
							size={14}
							className='fill-amber-400 drop-shadow-[0_0_8px_rgba(253,230,138,0.8)]'
						/>
					</motion.span>
				</div>
			</div>
		</section>
	);
}
