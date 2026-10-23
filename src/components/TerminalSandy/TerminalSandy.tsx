'use client';

import { useMessages } from '@/context/MessagesContext';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Radio, Terminal as TerminalIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

function formatTimestamp(isoString: string) {
	try {
		const date = new Date(isoString);
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
	} catch {
		return '--:--:--';
	}
}

const typeStyles: Record<string, { label: string; tone: string }> = {
	chat: { label: 'CHAT', tone: 'border-[#9146FF]/30 bg-[#9146FF]/10 text-[#A78BFA]' },
	transcription: { label: 'VOZ', tone: 'border-primary/30 bg-primary/10 text-primary' },
	reaction: { label: 'ACCIÓN', tone: 'border-[#F28BD8]/30 bg-[#F28BD8]/10 text-[#F28BD8]' },
	system: { label: 'SISTEMA', tone: 'border-border bg-muted/50 text-muted-foreground' },
};

export const TerminalSandy = () => {
	const { messages } = useMessages();
	const [isMinimized, setIsMinimized] = useState(false);
	const contentRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (contentRef.current && !isMinimized) {
			contentRef.current.scrollTop = contentRef.current.scrollHeight;
		}
	}, [messages, isMinimized]);

	return (
		<div className='overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-all'>
			<div className='flex items-center justify-between border-border border-b bg-card/90 px-4 py-2.5'>
				<div className='flex items-center gap-2'>
					<span className='flex size-6 items-center justify-center rounded border border-border bg-background text-primary'>
						<TerminalIcon size={13} />
					</span>
					<span className='font-display font-semibold text-foreground text-xs'>
						Bitácora de Emisión
					</span>
					<span className='flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.2 font-mono text-[9px] text-emerald-400'>
						<span className='size-1 animate-pulse rounded-full bg-emerald-400' />
						STREAM LOG
					</span>
				</div>

				<div className='flex items-center gap-3'>
					<span className='font-mono text-[11px] text-muted-foreground'>
						{messages.length} {messages.length === 1 ? 'evento' : 'eventos'}
					</span>
					<button
						type='button'
						onClick={() => setIsMinimized((v) => !v)}
						className='flex size-6 items-center justify-center rounded border border-border/60 bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground'
						title={isMinimized ? 'Expandir bitácora' : 'Minimizar bitácora'}
						aria-label={isMinimized ? 'Expandir bitácora' : 'Minimizar bitácora'}
					>
						{isMinimized ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
					</button>
				</div>
			</div>

			{!isMinimized && (
				<div ref={contentRef} className='h-60 overflow-y-auto p-3 font-sans text-xs'>
					{messages.length === 0 ? (
						<div className='flex h-full flex-col items-center justify-center text-center text-muted-foreground'>
							<Radio size={22} className='mb-1.5 text-primary opacity-40' />
							<p className='font-mono text-xs'>Esperando actividad en directo...</p>
							<p className='mt-0.5 text-[11px] text-muted-foreground/80'>
								Los mensajes del chat, comandos de voz y respuestas de Sandy aparecerán aquí en
								tiempo real.
							</p>
						</div>
					) : (
						<div className='space-y-1.5'>
							{messages.map((msg, index) => {
								const style = typeStyles[msg.type] ?? typeStyles.system;
								return (
									<div
										key={`msg-${index}-${msg.timestamp}`}
										className='flex items-start gap-2.5 rounded-md border border-border/40 bg-background/40 p-2 transition-colors hover:bg-background/80'
									>
										<span className='shrink-0 font-mono text-[10px] text-muted-foreground/70'>
											{formatTimestamp(msg.timestamp)}
										</span>
										<span
											className={cn(
												'inline-flex shrink-0 items-center rounded border px-1.5 py-0.2 font-bold font-mono text-[8px] uppercase tracking-wider',
												style.tone,
											)}
										>
											{style.label}
										</span>
										<span className='flex-1 text-foreground/90 leading-relaxed'>{msg.content}</span>
									</div>
								);
							})}
						</div>
					)}
				</div>
			)}
		</div>
	);
};
