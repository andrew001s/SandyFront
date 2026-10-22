'use client';

import { Reveal } from '@/components/landing/Reveal';
import { StarField } from '@/components/landing/StarField';
import {
	AudioLines,
	Check,
	ChevronDown,
	MessageSquare,
	Mic,
	Play,
	Send,
	Sparkles,
	Star,
	Zap,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { SiGooglegemini, SiKick, SiOpenrouter, SiTwitch, SiYoutube } from 'react-icons/si';

function ChatMock() {
	const messages = [
		{ user: 'maria_celeste', color: '#FF75A0', text: '¡hola Sandy! 👋' },
		{ user: 'ElTioPancho', color: '#7AC943', badge: 'MOD', text: '¡Buenas a todos en el stream!' },
		{ user: 'kitsunefan', color: '#38BDF8', badge: 'VIP', text: '¿cuál es el plan para hoy?' },
	];

	return (
		<div className='relative overflow-hidden rounded-lg border border-border bg-background/80 shadow-inner'>
			<div className='flex items-center justify-between border-border border-b bg-card/90 px-3 py-2'>
				<div className='flex items-center gap-2 font-mono text-foreground text-xs'>
					<SiTwitch size={12} className='text-[#9146FF]' />
					<SiKick size={12} className='text-[#53FC18]' />
					<SiYoutube size={12} className='text-[#FF0000]' />
					<span className='font-semibold'>Flujo unificado</span>
				</div>
				<span className='flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] text-emerald-400'>
					<span className='size-1.5 animate-pulse rounded-full bg-emerald-400' />
					LIVE
				</span>
			</div>

			<div className='space-y-1.5 p-3 text-left font-sans text-xs'>
				<div className='flex items-center gap-1.5 rounded border border-primary/20 bg-primary/10 px-2 py-1 font-medium text-primary'>
					<Sparkles size={12} />
					<span>Transmisión conectada a 3 plataformas</span>
				</div>
				{messages.map((m) => (
					<p key={m.user} className='text-foreground/90 leading-relaxed'>
						{m.badge && (
							<span className='mr-1.5 inline-flex items-center rounded bg-primary/20 px-1 py-0.2 font-bold font-mono text-[8px] text-primary uppercase'>
								{m.badge}
							</span>
						)}
						<span className='mr-1.5 font-semibold' style={{ color: m.color }}>
							{m.user}
						</span>
						<span>{m.text}</span>
					</p>
				))}
				<div className='flex items-center gap-1.5 rounded-md border-primary border-l-2 bg-primary/5 px-2 py-1'>
					<span className='font-bold font-mono text-[11px] text-primary'>Sandy</span>
					<div className='flex items-center gap-1'>
						{[0, 1, 2].map((i) => (
							<span
								key={i}
								style={{ animationDelay: `${i * 0.15}s` }}
								className='size-1 animate-pulse rounded-full bg-primary'
							/>
						))}
					</div>
					<span className='text-[11px] text-muted-foreground'>generando respuesta con voz...</span>
				</div>
			</div>

			<div className='flex items-center gap-2 border-border border-t bg-card/60 px-3 py-1.5'>
				<div className='flex flex-1 items-center gap-1.5 rounded border border-border/60 bg-background/60 px-2 py-1 font-sans text-muted-foreground text-xs'>
					<MessageSquare size={12} />
					<span>Escribe en el chat...</span>
				</div>
				<Send size={12} className='text-primary' />
			</div>
		</div>
	);
}

function AvatarMock() {
	return (
		<div className='relative overflow-hidden rounded-lg border border-border bg-background/80 shadow-inner'>
			<div className='flex items-center justify-between border-border border-b bg-card/90 px-3 py-2'>
				<div className='flex items-center gap-1.5 font-mono text-foreground text-xs'>
					<Sparkles size={12} className='text-primary' />
					<span className='font-semibold'>VMC / OSC Protocol</span>
				</div>
				<span className='flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] text-emerald-400'>
					<span className='size-1.5 animate-pulse rounded-full bg-emerald-400' />
					SYNC
				</span>
			</div>

			<div className='flex flex-col items-center py-5'>
				<div className='relative flex size-16 items-center justify-center rounded-xl border border-primary/30 bg-card shadow-sm'>
					<div className='flex flex-col items-center gap-1.5'>
						<div className='flex gap-2'>
							<span className='size-1.5 rounded-full bg-primary' />
							<span className='size-1.5 rounded-full bg-primary' />
						</div>
						<div className='flex h-3 w-8 items-center justify-center gap-1'>
							{[20, 80, 100, 70, 30].map((h, i) => (
								<span
									key={i}
									style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
									className='w-1 animate-pulse rounded-full bg-primary'
								/>
							))}
						</div>
					</div>
				</div>
				<p className='mt-3 font-mono text-[11px] text-muted-foreground'>Live2D & 3D VRM a 60 FPS</p>
				<div className='mt-2 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-0.5 font-mono text-[10px] text-foreground'>
					<Zap size={10} className='text-primary' />
					<span>VTube Studio & VSeeFace</span>
				</div>
			</div>
		</div>
	);
}

function VoiceMock() {
	return (
		<div className='relative overflow-hidden rounded-lg border border-border bg-background/80 shadow-inner'>
			<div className='flex items-center justify-between border-border border-b bg-card/90 px-3 py-2'>
				<div className='flex items-center gap-1.5 font-mono text-foreground text-xs'>
					<Mic size={12} className='text-primary' />
					<span className='font-semibold'>Azure Speech</span>
				</div>
				<span className='rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] text-primary'>
					STREAM MIC
				</span>
			</div>

			<div className='flex flex-col items-center gap-3 py-5'>
				<div className='flex size-12 items-center justify-center rounded-xl border border-primary/30 bg-card text-primary shadow-sm'>
					<Mic size={20} />
				</div>
				<div className='flex h-7 items-end gap-1'>
					{[25, 45, 20, 75, 40, 90, 60, 35, 70, 30, 80, 50].map((h, i) => (
						<span
							key={i}
							style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }}
							className='w-1 animate-pulse rounded-full bg-gradient-to-t from-primary to-[#F28BD8]'
						/>
					))}
				</div>
				<p className='font-mono text-[11px] text-muted-foreground'>Comandos de voz del streamer</p>
			</div>
		</div>
	);
}

function AudioMock() {
	return (
		<div className='relative overflow-hidden rounded-lg border border-border bg-background/80 shadow-inner'>
			<div className='flex items-center justify-between border-border border-b bg-card/90 px-3 py-2'>
				<div className='flex items-center gap-1.5 font-mono text-foreground text-xs'>
					<AudioLines size={12} className='text-primary' />
					<span className='font-semibold'>Fish Audio TTS</span>
				</div>
				<span className='rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground'>
					BYOK
				</span>
			</div>

			<div className='p-4'>
				<div className='mb-3 flex items-center gap-2.5'>
					<span className='flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm'>
						<Play size={13} className='ml-0.5 fill-current' />
					</span>
					<div>
						<p className='font-mono font-semibold text-foreground text-xs'>Sandy Custom Voice</p>
						<p className='font-mono text-[10px] text-muted-foreground'>0:24 · Síntesis neuronal</p>
					</div>
				</div>
				<div className='flex h-7 items-center gap-1'>
					{[
						18, 35, 55, 80, 60, 95, 45, 70, 35, 22, 50, 80, 65, 100, 42, 28, 65, 40, 15, 50, 80, 32,
					].map((h, i) => (
						<span
							key={i}
							style={{ height: `${h}%` }}
							className={`flex-1 rounded-full ${i < 12 ? 'bg-primary' : 'bg-primary/20'}`}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

function PlatformMock() {
	const platforms = [
		{ icon: <SiTwitch size={14} />, name: 'Twitch IRC', color: '#9146FF' },
		{ icon: <SiKick size={14} />, name: 'Kick Pusher', color: '#53FC18' },
		{ icon: <SiYoutube size={14} />, name: 'YouTube Live', color: '#FF0000' },
	];

	return (
		<div className='relative overflow-hidden rounded-lg border border-border bg-background/80 shadow-inner'>
			<div className='flex items-center justify-between border-border border-b bg-card/90 px-3 py-2'>
				<div className='flex items-center gap-1.5 font-mono text-foreground text-xs'>
					<Zap size={12} className='text-emerald-400' />
					<span className='font-semibold'>Canales vinculados</span>
				</div>
				<span className='rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] text-emerald-400'>
					READY
				</span>
			</div>

			<div className='space-y-1.5 p-3'>
				{platforms.map((p) => (
					<div
						key={p.name}
						className='flex items-center justify-between rounded border border-border bg-card px-2.5 py-1.5'
					>
						<div className='flex items-center gap-2'>
							<span style={{ color: p.color }}>{p.icon}</span>
							<span className='font-medium font-mono text-foreground text-xs'>{p.name}</span>
						</div>
						<span className='flex items-center gap-1 font-mono text-[10px] text-emerald-400'>
							<Check size={11} />
							<span>OAuth</span>
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

function ModelMock() {
	const models = [
		{
			icon: <SiGooglegemini size={13} />,
			name: 'Google Gemini 2.5 Flash',
			desc: 'Rápido, baja latencia y sin costo inicial con tu API key',
			active: true,
		},
		{
			icon: <SiOpenrouter size={13} />,
			name: 'OpenRouter (Claude, Llama, Mistral)',
			desc: 'Elige entre cientos de modelos según la personalidad de tu canal',
			active: false,
		},
	];

	return (
		<div className='relative overflow-hidden rounded-lg border border-border bg-background/80 shadow-inner'>
			<div className='flex items-center justify-between border-border border-b bg-card/90 px-3 py-2'>
				<div className='flex items-center gap-1.5 font-mono text-foreground text-xs'>
					<Zap size={12} className='text-primary' />
					<span className='font-semibold'>Motor de Inteligencia Artificial (BYOK)</span>
				</div>
				<span className='rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] text-primary'>
					TÚ CONTROLAS EL GASTO
				</span>
			</div>

			<div className='grid gap-2 p-3 sm:grid-cols-2'>
				{models.map((m) => (
					<div
						key={m.name}
						className={`flex items-start justify-between rounded-md border p-3 transition-colors ${
							m.active ? 'border-primary/50 bg-primary/[0.08]' : 'border-border bg-card'
						}`}
					>
						<div className='flex items-start gap-2.5'>
							<span className='mt-0.5 text-primary'>{m.icon}</span>
							<div>
								<div className='flex items-center gap-1.5'>
									<p className='font-mono font-semibold text-foreground text-xs'>{m.name}</p>
									{m.active && (
										<span className='rounded bg-primary/20 px-1 font-bold font-mono text-[9px] text-primary'>
											ACTIVO
										</span>
									)}
								</div>
								<p className='mt-0.5 font-sans text-[11px] text-muted-foreground leading-snug'>
									{m.desc}
								</p>
							</div>
						</div>
						<ChevronDown size={14} className='shrink-0 text-muted-foreground' />
					</div>
				))}
			</div>
		</div>
	);
}

type Feature = {
	title: string;
	description: string;
	mockup: ReactNode;
	span: string;
};

const features: Feature[] = [
	{
		title: 'Chat en vivo con IA',
		description:
			'Sandy lee los chats de Twitch, Kick y YouTube simultáneamente y responde con contexto de tu stream, moderando y conversando con los viewers.',
		mockup: <ChatMock />,
		span: 'lg:col-span-4',
	},
	{
		title: 'Lip sync 2D y 3D en tiempo real',
		description:
			'Sincroniza labios y expresiones faciales en VTube Studio (Live2D) o VSeeFace (VRM 3D) mediante VMC/OSC con latencia imperceptible.',
		mockup: <AvatarMock />,
		span: 'lg:col-span-2',
	},
	{
		title: 'Entiende tu voz por micrófono',
		description:
			'Reconocimiento de voz con Azure Speech: háblale en vivo durante el juego y Sandy entenderá y te responderá en el stream.',
		mockup: <VoiceMock />,
		span: 'lg:col-span-2',
	},
	{
		title: 'Voz natural con Fish Audio',
		description:
			'Síntesis de voz ultra-realista con Fish Audio: configura el timbre exacto de tu co-animadora con tu propia API key.',
		mockup: <AudioMock />,
		span: 'lg:col-span-2',
	},
	{
		title: 'Plataformas de streaming',
		description:
			'Conecta tu canal mediante OAuth seguro y sin instalaciones complicadas. Lee eventos de donaciones, subs y chat en directo.',
		mockup: <PlatformMock />,
		span: 'lg:col-span-2',
	},
	{
		title: 'El cerebro que tú elijas',
		description:
			'Modelo BYOK (Bring Your Own Key): tú decides qué modelo de lenguaje usar (Google Gemini o cualquier modelo de OpenRouter) sin sobreprecios.',
		mockup: <ModelMock />,
		span: 'lg:col-span-6',
	},
];

function FeatureCard({ feature }: { feature: Feature }) {
	return (
		<Reveal className={`${feature.span} col-span-6`}>
			<div className='group flex h-full flex-col justify-between rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-sm'>
				<div>
					{feature.mockup}
					<div className='mt-4 flex items-start justify-between gap-3'>
						<div>
							<h3 className='font-display font-semibold text-base text-foreground'>
								{feature.title}
							</h3>
							<p className='mt-1.5 font-sans text-muted-foreground text-xs leading-relaxed sm:text-sm'>
								{feature.description}
							</p>
						</div>
						<span className='hidden shrink-0 animate-[twinkle_3s_ease-in-out_infinite] text-amber-400/80 md:block'>
							<Star size={14} className='fill-amber-400/50' />
						</span>
					</div>
				</div>
			</div>
		</Reveal>
	);
}

export function Features() {
	return (
		<section id='features' className='relative py-20 md:py-28'>
			<div className='-z-10 pointer-events-none absolute inset-0'>
				<StarField count={25} seed={5} className='absolute inset-0 opacity-30' />
			</div>
			<div className='mx-auto max-w-6xl px-4 md:px-6'>
				<Reveal className='mb-12 max-w-2xl'>
					<span className='mb-3 inline-flex items-center gap-2 font-mono text-primary text-xs uppercase tracking-wider'>
						Arquitectura y capacidades
					</span>
					<h2 className='font-bold font-display text-3xl text-foreground tracking-tight sm:text-4xl md:text-5xl'>
						No es un bot repetitivo.
						<br />
						<span className='bg-gradient-to-r from-primary via-[#B8AAFF] to-[#F28BD8] bg-clip-text text-transparent'>
							Es tu co-animadora en vivo.
						</span>
					</h2>
				</Reveal>

				<div className='grid grid-cols-6 gap-4'>
					{features.map((feature) => (
						<FeatureCard key={feature.title} feature={feature} />
					))}
				</div>
			</div>
		</section>
	);
}
