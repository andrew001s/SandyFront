'use client';

import { useAppSettings } from '@/context/AppSettingsContext';
import { useAvatar } from '@/hooks/useAvatar';
import { useServiceStatus } from '@/hooks/useServiceStatus';
import { Bot, MessageSquare, Mic, Radio, Volume2 } from 'lucide-react';

export function PipelineConstellation() {
	const { serviceStatus, isRunning } = useServiceStatus();
	const { settings } = useAppSettings();
	const { connected: avatarConnected } = useAvatar();

	// Plataformas conectadas
	const twitchActive = Boolean(serviceStatus?.platforms?.twitch?.connected);
	const kickActive = Boolean(serviceStatus?.platforms?.kick?.connected);
	const youtubeActive = Boolean(serviceStatus?.platforms?.youtube?.connected);
	const anyPlatform = twitchActive || kickActive || youtubeActive;

	const chatLabel = anyPlatform
		? [twitchActive && 'Twitch', kickActive && 'Kick', youtubeActive && 'YouTube']
				.filter(Boolean)
				.join(' · ')
		: 'Sin canal';

	// Modelo IA
	const aiProvider = settings?.ai_provider === 'openrouter' ? 'OpenRouter' : 'Gemini';

	// Voz
	const ttsActive = settings?.feature_flags?.voice_replies !== false;

	const nodes = [
		{
			id: 'chat',
			label: 'Chat de emisión',
			value: chatLabel,
			icon: <Radio size={14} />,
			active: anyPlatform && isRunning,
			idle: anyPlatform && !isRunning,
		},
		{
			id: 'mic',
			label: 'Escucha micro',
			value: settings?.stt_provider === 'browser' ? 'Navegador' : 'Azure Speech',
			icon: <Mic size={14} />,
			active: isRunning,
			idle: !isRunning,
		},
		{
			id: 'ai',
			label: 'Cerebro IA',
			value: aiProvider,
			icon: <Bot size={14} />,
			active: isRunning,
			idle: !isRunning,
		},
		{
			id: 'tts',
			label: 'Síntesis de voz',
			value: ttsActive ? 'Fish Audio' : 'Silenciada',
			icon: <Volume2 size={14} />,
			active: isRunning && ttsActive,
			idle: !isRunning || !ttsActive,
		},
		{
			id: 'avatar',
			label: 'Avatar Live2D/3D',
			value: avatarConnected ? 'VMC Sincronizado' : 'En espera',
			icon: <MessageSquare size={14} />,
			active: avatarConnected,
			idle: !avatarConnected,
		},
	];

	return (
		<div className='relative mb-6 overflow-hidden rounded-xl border border-border bg-card p-3 shadow-xs sm:p-4'>
			<div className='mb-2.5 flex items-center justify-between px-1'>
				<span className='font-medium font-mono text-[11px] text-muted-foreground uppercase tracking-wider'>
					Pipeline en tiempo real
				</span>
				<span className='flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground'>
					<span
						className={`size-1.5 rounded-full ${
							isRunning ? 'animate-pulse bg-emerald-400' : 'bg-muted-foreground/60'
						}`}
					/>
					{isRunning ? 'MOTOR ON-AIR' : 'MOTOR EN ESPERA'}
				</span>
			</div>

			<div className='grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-2'>
				{nodes.map((node) => (
					<div
						key={node.id}
						className={`flex flex-col justify-between rounded-lg border p-2.5 transition-colors ${
							node.active
								? 'border-primary/40 bg-primary/[0.06]'
								: 'border-border/70 bg-background/50'
						}`}
					>
						<div className='flex items-center justify-between'>
							<span
								className={`flex size-7 items-center justify-center rounded-md border ${
									node.active
										? 'border-primary/30 bg-primary/10 text-primary'
										: 'border-border bg-card text-muted-foreground'
								}`}
							>
								{node.icon}
							</span>
							<span
								className={`size-1.5 rounded-full ${
									node.active
										? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
										: 'bg-muted-foreground/50'
								}`}
							/>
						</div>
						<div className='mt-2.5'>
							<p className='truncate font-mono text-[10px] text-muted-foreground uppercase tracking-wider'>
								{node.label}
							</p>
							<p className='truncate font-medium font-mono text-foreground text-xs'>{node.value}</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
