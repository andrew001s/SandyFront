'use client';

import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';

const REACTIONS = [
	['happy', 'Alegría'],
	['sad', 'Tristeza'],
	['angry', 'Enojo'],
	['surprised', 'Sorpresa'],
	['excited', 'Emoción'],
	['sleepy', 'Sueño'],
	['thinking', 'Pensamiento'],
	['confused', 'Confusión'],
	['shy', 'Timidez'],
] as const;

type ExpressionOption = { id: string; label: string };

export type AutomaticReactionSelection = {
	expressions: ExpressionOption[];
	mappings: Record<string, string>;
	onMappingChange: (reaction: string, expressionId: string | null) => void;
};

export function AutomaticReactionsCard({
	expressions,
	mappings,
	onMappingChange,
	onClose,
}: {
	expressions: ExpressionOption[];
	mappings: Record<string, string>;
	onMappingChange: (reaction: string, expressionId: string | null) => void;
	onClose?: () => void;
}) {
	return (
		<div className='w-full rounded-xl border border-border/80 bg-background/95 text-foreground shadow-xl md:w-[22rem]'>
			<div className='flex items-center justify-between border-border/70 border-b px-4 py-3'>
				<div className='flex items-center gap-2.5'>
					<span className='flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary'>
						<Sparkles className='size-4' aria-hidden='true' />
					</span>
					<div>
						<h2 className='font-semibold text-sm'>Reacciones de IA</h2>
						<p className='text-muted-foreground text-xs'>Asigna una expresión a cada reacción.</p>
					</div>
				</div>
				{onClose && (
					<Button
						variant='ghost'
						size='icon'
						onClick={onClose}
						aria-label='Cerrar reacciones de IA'
					>
						<X className='size-4' />
					</Button>
				)}
			</div>
			{expressions.length === 0 && (
				<output className='border-border/70 border-b px-4 py-2 text-muted-foreground text-xs'>
					No hay expresiones disponibles para este avatar.
				</output>
			)}
			<div className='grid max-h-[min(55vh,28rem)] gap-1 overflow-y-auto p-3'>
				{REACTIONS.map(([reaction, label]) => (
					<label
						key={reaction}
						className='grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-2 rounded-md px-1 py-1 text-sm'
					>
						<span className='font-medium text-xs'>{label}</span>
						<select
							aria-label={label}
							className='h-9 min-w-0 rounded-md border border-input bg-background px-2.5 text-xs shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring'
							value={mappings[reaction] ?? ''}
							onChange={(event) => onMappingChange(reaction, event.target.value || null)}
						>
							<option value=''>Sin expresión</option>
							{expressions.map((expression) => (
								<option key={expression.id} value={expression.id}>
									{expression.label}
								</option>
							))}
						</select>
					</label>
				))}
			</div>
		</div>
	);
}
