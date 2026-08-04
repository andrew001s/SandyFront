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
		{ user: 'maria_celeste', color: '#FF75A0', text: 'hola Sandy! 👋' },
		{ user: 'ElTioPancho', color: '#7AC943', badge: 'MOD', text: 'Buenas! 🎉' },
		{ user: 'kitsunefan', color: '#1E90FF', badge: 'VIP', text: 'dile algo al chat' },
	];

	return (
		<div className='relative overflow-hidden rounded-2xl border border-[#26262C] bg-[#18181B] shadow-[0_16px_60px_rgba(0,0,0,0.45)]'>
			<div className='flex items-center justify-between border-b border-[#26262C] px-3 py-2'>
				<div className='flex items-center gap-1.5 text-xs font-semibold text-[#EFEFF1]'>
					<SiTwitch size={13} className='text-[#9146FF]' />
					<SiKick size={13} className='text-[#53FC18]' />
					<SiYoutube size={13} className='text-[#FF0000]' />
					<span className='ml-1'>Chat en vivo</span>
				</div>
				<span className='flex items-center gap-1.5 rounded bg-[#9146FF]/15 px-2 py-0.5 text-[10px] font-bold text-[#BF94FF]'>
					<span className='h-1.5 w-1.5 animate-pulse rounded-full bg-[#9146FF]' />
					LIVE
				</span>
			</div>

			<div className='space-y-1.5 px-3 py-3 text-left'>
				<div className='flex items-center gap-1 rounded bg-[#9146FF]/10 px-2 py-1 text-[12px] font-medium text-[#BF94FF]'>
					<Sparkles size={12} />
					¡Bienvenidos a la transmisión!
				</div>
				{messages.map((m) => (
					<p key={m.user} className='px-1 py-0.5 text-[12px] leading-snug'>
						{m.badge && (
							<span className='mr-1 inline-flex h-[13px] items-center rounded-[3px] bg-[#E005B9] px-1 text-[7px] font-bold text-white'>
								{m.badge}
							</span>
						)}
						<span className='mr-1 font-semibold' style={{ color: m.color }}>
							{m.user}
						</span>
						<span className='text-[#EFEFF1]'>{m.text}</span>
					</p>
				))}
				<div className='flex items-center gap-1 px-1 py-1'>
					<span className='mr-1 text-[12px] font-semibold text-[#9146FF]'>Sandy</span>
					{['', '', ''].map((_, i) => (
						<span
							key={i}
							style={{ animationDelay: `${i * 0.2}s` }}
							className='h-1.5 w-1.5 animate-[mouth_1s_ease-in-out_infinite] rounded-full bg-[#9146FF]'
						/>
					))}
				</div>
			</div>

			<div className='flex items-center gap-2 border-t border-[#26262C] px-3 py-2'>
				<div className='flex flex-1 items-center gap-2 rounded-md bg-[#1F1F23] px-2.5 py-1.5 text-[12px] text-[#ADADB8]'>
					<MessageSquare size={12} />
					Enviar un mensaje...
				</div>
				<Send size={13} className='text-[#9146FF]' />
			</div>
		</div>
	);
}

function AvatarMock() {
	return (
		<div className='relative overflow-hidden rounded-2xl border border-[#26262C] bg-gradient-to-b from-[#221C33] to-[#18181B] shadow-[0_16px_60px_rgba(0,0,0,0.45)]'>
			<div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(139,92,246,0.35),transparent_60%)]' />
			<div className='relative flex items-center justify-between px-3 py-2'>
				<div className='flex items-center gap-1.5 text-xs font-semibold text-[#EFEFF1]'>
					<Sparkles size={13} className='text-[#BF94FF]' />
					Lip sync
				</div>
				<span className='flex items-center gap-1.5 rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400'>
					<span className='h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400' />
					SYNC
				</span>
			</div>

			<div className='relative flex flex-col items-center py-6'>
				<div className='relative'>
					<div className='absolute -inset-4 rounded-full bg-[#8B5CF6]/30 blur-2xl' />
					<div className='relative flex size-20 flex-col items-center justify-center rounded-full border border-white/10 bg-gradient-to-b from-[#C4B5FD]/40 to-[#8B5CF6]/20'>
						<div className='mb-1 flex gap-1.5'>
							<span className='size-2 rounded-full bg-[#1A1630]' />
							<span className='size-2 rounded-full bg-[#1A1630]' />
						</div>
						<div className='flex h-3 w-8 items-center justify-center gap-[3px]'>
							{['', '', '', '', ''].map((_, i) => (
								<span
									key={i}
									style={{ animationDelay: `${i * 0.09}s` }}
									className='h-full w-[3px] origin-center animate-[mouth_0.9s_ease-in-out_infinite] rounded-full bg-[#EFEFF1]'
								/>
							))}
						</div>
					</div>
				</div>
				<p className='mt-4 text-[11px] font-medium text-[#ADADB8]'>
					Cada palabra se convierte en movimiento
				</p>
				<div className='mt-2 flex items-center gap-1.5 rounded-full bg-[#9146FF]/15 px-2.5 py-1 text-[10px] font-semibold text-[#BF94FF]'>
					<Zap size={11} />
					VTube Studio
				</div>
			</div>
		</div>
	);
}

function VoiceMock() {
	return (
		<div className='relative overflow-hidden rounded-2xl border border-[#26262C] bg-[#18181B] shadow-[0_16px_60px_rgba(0,0,0,0.45)]'>
			<div className='flex items-center justify-between border-b border-[#26262C] px-3 py-2'>
				<div className='flex items-center gap-1.5 text-xs font-semibold text-[#EFEFF1]'>
					<Mic size={13} className='text-[#8B5CF6]' />
					Entiende tu voz
				</div>
				<span className='flex items-center gap-1 rounded bg-[#8B5CF6]/15 px-2 py-0.5 text-[10px] font-bold text-[#BF94FF]'>
					<span className='h-1.5 w-1.5 animate-pulse rounded-full bg-[#8B5CF6]' />
					LIVE
				</span>
			</div>

			<div className='flex flex-col items-center gap-4 py-7'>
				<div className='relative flex size-14 items-center justify-center rounded-full border border-[#8B5CF6]/40 bg-[#8B5CF6]/15 text-[#A78BFA]'>
					<span className='absolute inset-0 animate-ping rounded-full bg-[#8B5CF6]/20' />
					<Mic size={22} />
				</div>
				<div className='flex h-10 items-end gap-1'>
					{[28, 44, 20, 60, 36, 72, 48, 30, 56, 24, 64, 40].map((h, i) => (
						<span
							key={i}
							style={{ height: `${h}%`, animationDelay: `${i * 0.11}s` }}
							className='w-1 origin-bottom animate-[eq_1.4s_ease-in-out_infinite] rounded-full bg-gradient-to-t from-[#8B5CF6] to-[#22D3EE]'
						/>
					))}
				</div>
				<p className='text-[11px] font-medium text-[#ADADB8]'>“Saluda al chat” → Sandy actúa</p>
			</div>
		</div>
	);
}

function AudioMock() {
	return (
		<div className='relative overflow-hidden rounded-2xl border border-[#26262C] bg-[#18181B] shadow-[0_16px_60px_rgba(0,0,0,0.45)]'>
			<div className='flex items-center justify-between border-b border-[#26262C] px-3 py-2'>
				<div className='flex items-center gap-1.5 text-xs font-semibold text-[#EFEFF1]'>
					<AudioLines size={13} className='text-[#22D3EE]' />
					Voz natural
				</div>
				<span className='rounded bg-[#22D3EE]/15 px-2 py-0.5 text-[10px] font-bold text-[#67E8F9]'>
					Fish Audio
				</span>
			</div>

			<div className='px-3 py-5'>
				<div className='mb-3 flex items-center gap-2'>
					<span className='flex size-8 items-center justify-center rounded-full bg-[#22D3EE] text-[#0B0A12]'>
						<Play size={13} className='ml-0.5 fill-[#0B0A12]' />
					</span>
					<div className='flex-1'>
						<p className='text-[12px] font-semibold text-[#EFEFF1]'>Sandy Studio</p>
						<p className='text-[10px] text-[#ADADB8]'>Con voz propia · 0:24</p>
					</div>
				</div>
				<div className='flex h-9 items-center gap-[2px]'>
					{[
						14, 30, 48, 70, 52, 84, 40, 62, 30, 18, 44, 70, 56, 90, 38, 24, 58, 34, 12, 46, 72, 28,
						20, 50, 66, 30,
					].map((h, i) => (
						<span
							key={i}
							style={{ height: `${h}%` }}
							className={`flex-1 origin-bottom rounded-full ${
								i < 14 ? 'bg-[#22D3EE]' : 'bg-gradient-to-t from-[#22D3EE]/50 to-[#22D3EE]/10'
							}`}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

function PlatformMock() {
	const platforms = [
		{ icon: <SiTwitch size={16} />, name: 'Twitch', color: '#9146FF' },
		{ icon: <SiKick size={16} />, name: 'Kick', color: '#53FC18' },
		{ icon: <SiYoutube size={16} />, name: 'YouTube', color: '#FF0000' },
	];

	return (
		<div className='relative overflow-hidden rounded-2xl border border-[#26262C] bg-[#18181B] shadow-[0_16px_60px_rgba(0,0,0,0.45)]'>
			<div className='flex items-center justify-between border-b border-[#26262C] px-3 py-2'>
				<div className='flex items-center gap-1.5 text-xs font-semibold text-[#EFEFF1]'>
					<Zap size={13} className='text-[#53FC18]' />
					Tus plataformas
				</div>
				<span className='rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400'>
					Conectado
				</span>
			</div>

			<div className='space-y-2 px-3 py-4'>
				{platforms.map((p) => (
					<div
						key={p.name}
						className='flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.04] px-2.5 py-2'
					>
						<div className='flex items-center gap-2'>
							<span style={{ color: p.color }}>{p.icon}</span>
							<span className='text-[12px] font-semibold text-[#EFEFF1]'>{p.name}</span>
						</div>
						<span className='flex items-center gap-1 text-[10px] font-semibold text-emerald-400'>
							<Check size={11} />
							En línea
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
			name: 'Gemini',
			desc: 'Rápido y sin costo',
			active: true,
		},
		{
			icon: <SiOpenrouter size={13} />,
			name: 'OpenRouter',
			desc: 'Cientos de modelos',
			active: false,
		},
	];

	return (
		<div className='relative overflow-hidden rounded-2xl border border-[#26262C] bg-[#18181B] shadow-[0_16px_60px_rgba(0,0,0,0.45)]'>
			<div className='flex items-center justify-between border-b border-[#26262C] px-3 py-2'>
				<div className='flex items-center gap-1.5 text-xs font-semibold text-[#EFEFF1]'>
					<Zap size={13} className='text-[#8B5CF6]' />
					El cerebro que elijas
				</div>
			</div>

			<div className='px-3 py-3'>
				<div className='flex items-center justify-between rounded-lg border border-[#8B5CF6]/40 bg-[#8B5CF6]/10 px-3 py-2'>
					<div className='flex items-center gap-2'>
						<span className='text-[#BF94FF]'>{models[0].icon}</span>
						<div>
							<p className='text-[12px] font-semibold text-[#EFEFF1]'>{models[0].name}</p>
							<p className='text-[10px] text-[#ADADB8]'>{models[0].desc}</p>
						</div>
					</div>
					<div className='flex items-center gap-1.5'>
						<span className='flex size-3 items-center justify-center rounded-full bg-[#9146FF]'>
							<Check size={9} className='text-white' />
						</span>
						<ChevronDown size={13} className='text-[#ADADB8]' />
					</div>
				</div>

				<div className='mt-2 flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.04] px-3 py-2 opacity-90'>
					<div className='flex items-center gap-2'>
						<span className='text-[#ADADB8]'>{models[1].icon}</span>
						<div>
							<p className='text-[12px] font-semibold text-[#EFEFF1]'>{models[1].name}</p>
							<p className='text-[10px] text-[#ADADB8]'>{models[1].desc}</p>
						</div>
					</div>
					<ChevronDown size={13} className='text-[#ADADB8]' />
				</div>
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
			'Sandy lee el chat de Twitch, Kick y YouTube en tiempo real y responde con contexto: saluda, sigue comandos y mantiene la conversación encendida mientras tú juegas.',
		mockup: <ChatMock />,
		span: 'lg:col-span-4',
	},
	{
		title: 'Lip sync en VTube Studio',
		description: 'El avatar mueve la boca sincronizado con cada palabra que dice Sandy.',
		mockup: <AvatarMock />,
		span: 'lg:col-span-2',
	},
	{
		title: 'Entiende tu voz',
		description:
			'Reconocimiento de voz con Azure Speech: habla por el micrófono y Sandy lo convierte en acción.',
		mockup: <VoiceMock />,
		span: 'lg:col-span-2',
	},
	{
		title: 'Voz natural',
		description:
			'Síntesis de voz con Fish Audio para que Sandy suene real, con personalidad y tono propio.',
		mockup: <AudioMock />,
		span: 'lg:col-span-2',
	},
	{
		title: 'Twitch, Kick y YouTube',
		description:
			'Conecta tu canal con OAuth, escucha los mensajes y reacciona al instante sin tocar tu setup.',
		mockup: <PlatformMock />,
		span: 'lg:col-span-2',
	},
	{
		title: 'El modelo que tú elijas',
		description:
			'Usa Gemini u OpenRouter para decidir cómo piensa Sandy: desde respuestas rápidas hasta el modelo de IA más capaz del mercado.',
		mockup: <ModelMock />,
		span: 'lg:col-span-6',
	},
];

function FeatureCard({ feature }: { feature: Feature }) {
	return (
		<Reveal className={`${feature.span} col-span-6`}>
			<div className='group hover:-translate-y-1 relative h-full overflow-hidden rounded-3xl border border-[#1B1536]/10 bg-white p-6 transition-all duration-300 hover:border-[#8B5CF6]/40 hover:shadow-[0_0_40px_rgba(139,92,246,0.15)] dark:border-white/10 dark:bg-[#100F1B]'>
				<div className='-top-16 -right-16 pointer-events-none absolute h-40 w-40 rounded-full bg-[#8B5CF6]/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100' />
				<div className='relative'>
					{feature.mockup}
					<div className='mt-5 flex items-start justify-between gap-4'>
						<div>
							<h3 className='mb-1.5 font-semibold text-lg text-zinc-900 [font-family:var(--font-unbounded)] dark:text-zinc-50'>
								{feature.title}
							</h3>
							<p className='max-w-xl text-sm text-zinc-600 leading-relaxed dark:text-zinc-400'>
								{feature.description}
							</p>
						</div>
						<span className='hidden shrink-0 animate-[twinkle_3s_ease-in-out_infinite] text-amber-400/80 md:block dark:text-[#FDE68A]/80'>
							<Star size={16} className='fill-amber-400/50 dark:fill-[#FDE68A]/50' />
						</span>
					</div>
				</div>
			</div>
		</Reveal>
	);
}

export function Features() {
	return (
		<section id='features' className='relative py-24 md:py-32'>
			<div className='-z-10 pointer-events-none absolute inset-0'>
				<StarField count={30} seed={5} className='absolute inset-0 opacity-40' />
			</div>
			<div className='mx-auto max-w-7xl px-5 md:px-8'>
				<Reveal className='mb-14 max-w-2xl'>
					<span className='mb-4 flex items-center gap-2 font-semibold text-violet-600 text-xs uppercase tracking-[0.25em] dark:text-[#A78BFA]'>
						Funciones
					</span>
					<h2 className='font-bold text-3xl text-zinc-900 [font-family:var(--font-unbounded)] sm:text-4xl md:text-5xl dark:text-zinc-50'>
						No es un bot más.
						<br />
						<span className='bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent dark:from-[#A78BFA] dark:to-[#22D3EE]'>
							Es tu co-animadora.
						</span>
					</h2>
				</Reveal>

				<div className='grid grid-cols-6 gap-5'>
					{features.map((feature) => (
						<FeatureCard key={feature.title} feature={feature} />
					))}
				</div>
			</div>
		</section>
	);
}
