'use client';

import { Button } from '@/components/ui/button';
import { avatar2dManager } from '@/lib/avatar2d/avatar2dManager';
import { type Live2dPackage, live2dStore } from '@/lib/avatar2d/live2dStore';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Box, Smile, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface Props {
	onClose: () => void;
	onOpenModelSelect?: () => void;
}

export interface DetectedLive2dExpression {
	id: string;
	label: string;
	file?: string;
}

export function formatLive2dExpressionLabel(rawName: string): string {
	const basename = rawName.split(/[/\\]/).pop() ?? rawName;
	const withoutExt = basename.replace(/\.(exp3|exp)?\.json$/i, '').replace(/\.json$/i, '');
	const cleaned = withoutExt
		.replace(/^(exp|expression)[-_]?(\d+)?[-_]?/i, '')
		.replace(/^f\d+[-_]?/i, '')
		.replace(/^\d+[-_]+/, '')
		.replace(/[-_]+/g, ' ')
		.trim();

	if (!cleaned) {
		return withoutExt.charAt(0).toUpperCase() + withoutExt.slice(1);
	}

	return cleaned
		.split(' ')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
}

export function extractLive2dExpressions(
	modelSettingsJson: unknown,
	fileMap?: Record<string, string>,
): DetectedLive2dExpression[] {
	const list: DetectedLive2dExpression[] = [];
	const seenIds = new Set<string>();

	if (modelSettingsJson && typeof modelSettingsJson === 'object') {
		const ms = modelSettingsJson as Record<string, unknown>;
		const fileRefs = (ms.FileReferences || ms.fileReferences || ms.file_references) as
			| Record<string, unknown>
			| undefined;

		const rawList =
			(fileRefs?.Expressions as unknown[]) ||
			(fileRefs?.expressions as unknown[]) ||
			(ms.Expressions as unknown[]) ||
			(ms.expressions as unknown[]);

		if (Array.isArray(rawList)) {
			for (let index = 0; index < rawList.length; index++) {
				const item = rawList[index];
				if (!item) continue;
				if (typeof item === 'string') {
					const fileBasename =
						item
							.split(/[/\\]/)
							.pop()
							?.replace(/\.(exp3|exp)?\.json$/i, '') ?? '';
					const id = fileBasename || String(index);
					if (!seenIds.has(id)) {
						seenIds.add(id);
						list.push({
							id,
							label: formatLive2dExpressionLabel(fileBasename || `Expresión ${index + 1}`),
							file: item,
						});
					}
				} else if (typeof item === 'object') {
					const entry = item as Record<string, unknown>;
					const rawName = (entry.Name || entry.name || '') as string;
					const file = (entry.File || entry.file || '') as string;
					const fileBasename = file
						? (file
								.split(/[/\\]/)
								.pop()
								?.replace(/\.(exp3|exp)?\.json$/i, '') ?? '')
						: '';
					const id = rawName || fileBasename || String(index);
					if (!seenIds.has(id)) {
						seenIds.add(id);
						list.push({
							id,
							label: formatLive2dExpressionLabel(
								rawName || fileBasename || `Expresión ${index + 1}`,
							),
							file,
						});
					}
				}
			}
		}
	}

	// Fallback o complemento con fileMap si el ZIP contenía archivos de expresiones no declarados en model3.json (ej. modelos VTS)
	if (fileMap && typeof fileMap === 'object') {
		for (const path of Object.keys(fileMap)) {
			const lower = path.toLowerCase();
			if (
				(lower.endsWith('.exp3.json') || lower.endsWith('.exp.json')) &&
				!lower.includes('__macosx')
			) {
				const fileName = path.split(/[/\\]/).pop() || '';
				const basenameWithoutExt = fileName.replace(/\.(exp3|exp)?\.json$/i, '');
				if (basenameWithoutExt && !seenIds.has(basenameWithoutExt)) {
					seenIds.add(basenameWithoutExt);
					list.push({
						id: basenameWithoutExt,
						label: formatLive2dExpressionLabel(basenameWithoutExt),
						file: path,
					});
				}
			}
		}
	}

	return list;
}

export function Live2dExpressionsPanel({ onClose, onOpenModelSelect }: Props) {
	const [pkg, setPkg] = useState<Live2dPackage | null>(live2dStore.getPackage());
	const [activeExpressions, setActiveExpressions] = useState<string[]>(
		avatar2dManager.getState().live2d.activeExpressions || [],
	);

	useEffect(() => {
		const unsubStore = live2dStore.subscribe((next) => setPkg(next));
		const unsubManager = avatar2dManager.subscribe((state) => {
			setActiveExpressions(state.live2d.activeExpressions || []);
		});
		return () => {
			unsubStore();
			unsubManager();
		};
	}, []);

	const expressions = useMemo(() => {
		return extractLive2dExpressions(pkg?.modelSettingsJson, pkg?.fileMap);
	}, [pkg?.modelSettingsJson, pkg?.fileMap]);

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.96, x: 20 }}
			animate={{ opacity: 1, scale: 1, x: 0 }}
			exit={{ opacity: 0, scale: 0.96, x: 20 }}
			transition={{ duration: 0.2, ease: 'easeOut' }}
			className='pointer-events-auto absolute top-4 right-20 z-30 max-h-[calc(100%-2rem)] overflow-y-auto'
		>
			<div className='flex w-80 max-w-[calc(100vw-5rem)] flex-col gap-3 rounded-2xl border border-border/80 bg-background/90 p-3.5 shadow-2xl backdrop-blur-xl sm:w-84'>
				{/* Cabecera del Panel */}
				<div className='flex items-center justify-between border-border/60 border-b pb-2'>
					<div className='flex items-center gap-2'>
						<div className='flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary'>
							<Sparkles className='size-3.5' />
						</div>
						<span className='font-semibold text-foreground text-xs'>Expresiones Live2D</span>
					</div>
					<Button
						variant='ghost'
						size='icon'
						onClick={onClose}
						aria-label='Cerrar'
						className='size-6 text-muted-foreground hover:text-foreground'
					>
						<X className='size-3.5' />
					</Button>
				</div>

				{/* Estado vacío cuando no hay modelo cargado */}
				{!pkg ? (
					<div className='flex flex-col items-center justify-center gap-2.5 rounded-xl border border-border/60 border-dashed bg-muted/20 p-5 text-center'>
						<div className='flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary'>
							<Box className='size-4.5' />
						</div>
						<div className='space-y-1'>
							<p className='font-semibold text-foreground text-xs'>Sin modelo Live2D activo</p>
							<p className='text-[11px] text-muted-foreground leading-relaxed'>
								Carga un modelo .zip o .model3.json para descubrir y activar sus expresiones
								nativas.
							</p>
						</div>
						{onOpenModelSelect && (
							<Button
								type='button'
								size='sm'
								onClick={onOpenModelSelect}
								className='mt-1 h-7 px-3 text-xs'
							>
								Cargar modelo
							</Button>
						)}
					</div>
				) : (
					<div className='space-y-3'>
						<div className='flex items-center justify-between text-[11px]'>
							<div className='flex min-w-0 items-center gap-1.5'>
								<span className='text-muted-foreground'>Modelo:</span>
								<span className='max-w-[130px] truncate font-medium text-foreground'>
									{pkg.modelName}
								</span>
							</div>
							{activeExpressions.length > 0 && (
								<button
									type='button'
									onClick={() => avatar2dManager.setLive2dExpression(null)}
									className='font-medium text-[11px] text-primary transition-colors hover:text-primary/80 hover:underline'
								>
									Apagar todas ({activeExpressions.length})
								</button>
							)}
						</div>

						{expressions.length > 0 ? (
							<div className='grid grid-cols-2 gap-1.5'>
								{expressions.map((exp) => {
									const isActive = activeExpressions.includes(exp.id);
									return (
										<button
											key={exp.id}
											type='button'
											role='switch'
											aria-checked={isActive}
											onClick={() => avatar2dManager.toggleLive2dExpression(exp.id)}
											className={cn(
												'group flex items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-left text-xs transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
												isActive
													? 'border-primary/80 bg-primary/15 font-semibold text-primary shadow-xs'
													: 'border-border/60 bg-muted/30 text-foreground hover:bg-muted/70',
											)}
										>
											<div className='flex min-w-0 items-center gap-1.5'>
												<Smile
													className={cn(
														'size-3.5 shrink-0 transition-colors',
														isActive
															? 'text-primary'
															: 'text-muted-foreground group-hover:text-primary',
													)}
												/>
												<span className='truncate'>{exp.label}</span>
											</div>
											{/* Indicador visual de interruptor / toggle */}
											<div
												className={cn(
													'relative inline-flex h-3.5 w-6 shrink-0 items-center rounded-full p-0.5 transition-colors',
													isActive ? 'bg-primary' : 'bg-muted-foreground/30',
												)}
											>
												<span
													className={cn(
														'block size-2.5 rounded-full bg-white shadow-xs transition-transform',
														isActive ? 'translate-x-2.5' : 'translate-x-0',
													)}
												/>
											</div>
										</button>
									);
								})}
							</div>
						) : (
							<div className='flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border/60 border-dashed bg-muted/20 p-4 text-center'>
								<p className='font-semibold text-foreground text-xs'>
									Sin expresiones preconfiguradas
								</p>
								<p className='text-[11px] text-muted-foreground leading-relaxed'>
									Este modelo Live2D no define archivos de expresiones en su configuración.
								</p>
							</div>
						)}
					</div>
				)}
			</div>
		</motion.div>
	);
}
