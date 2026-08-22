'use client';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import type { VoiceRequirement } from '@/lib/voice-requirements';
import { ArrowRight, Mic } from 'lucide-react';
import Link from 'next/link';

type VoiceSetupDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	requirements: VoiceRequirement[];
};

export function VoiceSetupDialog({ open, onOpenChange, requirements }: VoiceSetupDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-lg'>
				<DialogHeader>
					<div className='mb-2 flex size-11 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-[#A78BFA]'>
						<Mic className='size-5' />
					</div>
					<DialogTitle>Falta configurar el micrófono</DialogTitle>
					<DialogDescription>
						{requirements.length > 1
							? 'Antes de encender el micrófono necesitas completar estos pasos:'
							: 'Antes de encender el micrófono necesitas completar este paso:'}
					</DialogDescription>
				</DialogHeader>

				<ol className='space-y-3'>
					{requirements.map((requirement, index) => (
						<li
							key={requirement.id}
							className='flex gap-3 rounded-2xl border border-border/60 bg-background/60 p-4'
						>
							<span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-500/10 font-medium text-violet-600 text-xs dark:text-[#A78BFA]'>
								{index + 1}
							</span>
							<div className='min-w-0 space-y-2'>
								<p className='font-medium text-sm'>{requirement.title}</p>
								<p className='text-muted-foreground text-xs'>{requirement.description}</p>
								<Button asChild size='sm' variant='outline' className='mt-1'>
									<Link href={requirement.href} onClick={() => onOpenChange(false)}>
										{requirement.actionLabel}
										<ArrowRight className='size-3.5' />
									</Link>
								</Button>
							</div>
						</li>
					))}
				</ol>

				<DialogFooter>
					<Button variant='ghost' onClick={() => onOpenChange(false)}>
						Ahora no
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
