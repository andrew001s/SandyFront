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
import { parseAutomaticReactionConfig } from '@/lib/avatar/reactionMappings';
import type { AutomaticReactionConfig } from '@/lib/avatar/reactionMappings';
import { Check, Eye, Sparkles, X } from 'lucide-react';
import { useState } from 'react';

const REACTIONS = [
	['neutral', 'Expresión base'],
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
	scope?: string;
	allowMultiple?: boolean;
	showIntensity?: boolean;
	onMappingChange: (reaction: string, config: AutomaticReactionConfig | null) => void;
	onPreview?: (reaction: string, config: AutomaticReactionConfig) => void;
	onPreviewEnd?: () => void;
};

export function AutomaticReactionsCard({
	expressions,
	mappings,
	scope = '',
	allowMultiple = false,
	showIntensity = false,
	onMappingChange,
	onPreview,
	onPreviewEnd,
	onClose,
}: AutomaticReactionSelection & { onClose?: () => void }) {
	const [editingReaction, setEditingReaction] = useState<string | null>(null);
	const [draft, setDraft] = useState<AutomaticReactionConfig>({ expressions: [], intensity: 1 });
	const [isPreviewing, setIsPreviewing] = useState(false);
	const [isMinimized, setIsMinimized] = useState(false);

	const openEditor = (reaction: string) => {
		setEditingReaction(reaction);
		setDraft(parseAutomaticReactionConfig(mappings[`${scope}:${reaction}`] ?? mappings[reaction]));
		setIsPreviewing(false);
		setIsMinimized(false);
	};

	const closeEditor = () => {
		if (isPreviewing) onPreviewEnd?.();
		setIsPreviewing(false);
		setIsMinimized(false);
		setEditingReaction(null);
	};

	const clearPreview = () => {
		if (isPreviewing) onPreviewEnd?.();
		setIsPreviewing(false);
	};

	const toggleExpression = (id: string) => {
		clearPreview();
		setDraft((current) => {
			const selected = current.expressions.includes(id);
			const nextExpressions = selected
				? current.expressions.filter((expression) => expression !== id)
				: allowMultiple
					? [...current.expressions, id]
					: [id];
			return { ...current, expressions: nextExpressions };
		});
	};

	const saveDraft = () => {
		if (!editingReaction) return;
		onMappingChange(editingReaction, draft.expressions.length ? draft : null);
		if (isPreviewing) onPreviewEnd?.();
		setIsPreviewing(false);
		setIsMinimized(false);
		setEditingReaction(null);
	};

	const previewDraft = () => {
		if (!editingReaction || draft.expressions.length === 0) return;
		onPreview?.(editingReaction, draft);
		setIsPreviewing(true);
		setIsMinimized(true);
	};

	const reopenEditor = () => setIsMinimized(false);

	return (
		<div className='w-full rounded-xl border border-border/80 bg-background/95 text-foreground shadow-xl md:w-[22rem]'>
			<div className='flex items-center justify-between border-border/70 border-b px-4 py-3'>
				<div className='flex items-center gap-2.5'>
					<span className='flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary'>
						<Sparkles className='size-4' aria-hidden='true' />
					</span>
					<div>
						<h2 className='font-semibold text-sm'>Reacciones de IA</h2>
						<p className='text-muted-foreground text-xs'>
							Configura una o varias expresiones por reacción.
						</p>
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
				{REACTIONS.map(([reaction, label]) => {
					const config = parseAutomaticReactionConfig(
						mappings[`${scope}:${reaction}`] ?? mappings[reaction],
					);
					const count = config.expressions.length;
					return (
						<div
							key={reaction}
							className='grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-2 rounded-md px-1 py-1 text-sm'
						>
							<span className='font-medium text-xs'>{label}</span>
							<button
								type='button'
								aria-label={`${label}: editar expresiones`}
								disabled={expressions.length === 0}
								onClick={() => openEditor(reaction)}
								className='flex h-9 min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-background px-2.5 text-left text-xs outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
							>
								<span className='truncate'>
									{count === 0
										? 'Sin expresión'
										: `${count} ${count === 1 ? 'expresión' : 'expresiones'}`}
								</span>
								<span className='shrink-0 text-muted-foreground'>Editar</span>
							</button>
						</div>
					);
				})}
			</div>

			<Dialog
				open={editingReaction !== null && !isMinimized}
				onOpenChange={(open) => {
					if (!open) closeEditor();
				}}
			>
				<DialogContent
					overlayClassName='bg-black/15 backdrop-blur-none'
					className='top-1/2 right-auto left-1/2 flex max-h-[82vh] w-[calc(100vw-2rem)] translate-x-[-50%] translate-y-[-50%] flex-col gap-0 overflow-hidden p-0 sm:w-[min(34vw,26rem)]'
				>
					<DialogHeader className='border-border/70 border-b px-5 py-4'>
						<DialogTitle>
							{REACTIONS.find(([key]) => key === editingReaction)?.[1] ?? 'Configurar reacción'}
						</DialogTitle>
						<DialogDescription>
							Elige las expresiones que se combinarán y pruébalas sobre el avatar.
						</DialogDescription>
					</DialogHeader>

					<div className='min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4'>
						<div className='grid gap-1.5 sm:grid-cols-2'>
							{expressions.map((expression) => {
								const selected = draft.expressions.includes(expression.id);
								return (
									<label
										key={expression.id}
										className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-ring ${selected ? 'border-primary/70 bg-primary/10 text-foreground' : 'border-border/70 bg-background hover:bg-muted/50'}`}
									>
										<input
											type='checkbox'
											checked={selected}
											onChange={() => toggleExpression(expression.id)}
											className='sr-only'
										/>
										<span
											aria-hidden='true'
											className={`flex size-4 shrink-0 items-center justify-center rounded border ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/60'}`}
										>
											{selected && <Check className='size-3' />}
										</span>
										<span className='min-w-0 flex-1 truncate'>{expression.label}</span>
									</label>
								);
							})}
						</div>

						{showIntensity && (
							<div className='space-y-2 border-border/70 border-t pt-4'>
								<div className='flex items-center justify-between gap-3 text-sm'>
									<label htmlFor='reaction-intensity' className='font-medium'>
										Intensidad
									</label>
									<output
										htmlFor='reaction-intensity'
										className='font-mono text-primary tabular-nums'
									>
										{Math.round(draft.intensity * 100)}%
									</output>
								</div>
								<input
									id='reaction-intensity'
									type='range'
									min='0'
									max='1'
									step='0.05'
									value={draft.intensity}
									onChange={(event) => {
										clearPreview();
										setDraft((current) => ({ ...current, intensity: Number(event.target.value) }));
									}}
									className='h-2 w-full cursor-pointer accent-primary'
								/>
							</div>
						)}
					</div>

					<DialogFooter className='items-stretch border-border/70 border-t px-5 py-4 sm:flex-col sm:justify-start'>
						<Button
							type='button'
							variant='outline'
							onClick={previewDraft}
							disabled={draft.expressions.length === 0 || !onPreview}
							className='w-full gap-2 sm:w-fit'
						>
							<Eye className='size-4' />
							{isPreviewing ? 'Actualizar vista previa' : 'Vista previa'}
						</Button>
						<div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
							<Button type='button' variant='ghost' onClick={closeEditor}>
								Cancelar
							</Button>
							<Button type='button' onClick={saveDraft}>
								Guardar selección
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{isMinimized && editingReaction && (
				<div className='fixed bottom-4 left-4 z-[60] w-[min(92vw,24rem)] rounded-lg border border-primary/50 bg-background p-3 text-foreground shadow-xl sm:bottom-6 sm:left-6'>
					<div className='flex items-start justify-between gap-3'>
						<div className='min-w-0'>
							<p className='font-semibold text-sm'>Vista previa activa</p>
							<p className='truncate text-muted-foreground text-xs'>
								{REACTIONS.find(([key]) => key === editingReaction)?.[1]} ·{' '}
								{draft.expressions.length}{' '}
								{draft.expressions.length === 1 ? 'expresión' : 'expresiones'}
								{showIntensity && ` · ${Math.round(draft.intensity * 100)}%`}
							</p>
						</div>
						<button
							type='button'
							onClick={reopenEditor}
							className='shrink-0 rounded-md px-2 py-1 font-medium text-primary text-xs hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
						>
							Volver a editar
						</button>
					</div>
					<div className='mt-3 flex justify-end gap-2 border-border/70 border-t pt-3'>
						<Button type='button' size='sm' variant='ghost' onClick={closeEditor}>
							Cancelar
						</Button>
						<Button type='button' size='sm' onClick={saveDraft}>
							Guardar selección
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
