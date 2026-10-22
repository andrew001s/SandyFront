'use client';

import type { BannedItem, BannedItemType } from '@/components/Moderation/moderation.types';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Link2, MessageSquare, ShieldCheck, Smile } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type AddBannedItemSheetProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editingItem?: BannedItem | null;
	onAdd: (items: BannedItem[]) => void;
	onUpdate: (id: string, value: string, type: BannedItemType) => void;
};

const TYPE_OPTIONS: Array<{
	value: BannedItemType;
	label: string;
	description: string;
	icon: typeof MessageSquare;
}> = [
	{
		value: 'word',
		label: 'Palabra',
		description: 'Texto o frase',
		icon: MessageSquare,
	},
	{
		value: 'symbol',
		label: 'Símbolo',
		description: 'Emojis o signos',
		icon: Smile,
	},
	{
		value: 'link',
		label: 'Enlace',
		description: 'URLs o dominios',
		icon: Link2,
	},
];

export function AddBannedItemSheet({
	open,
	onOpenChange,
	editingItem,
	onAdd,
	onUpdate,
}: AddBannedItemSheetProps) {
	const [type, setType] = useState<BannedItemType>('word');
	const [value, setValue] = useState('');
	const [isBulk, setIsBulk] = useState(false);
	const [bulkText, setBulkText] = useState('');
	const idCounterRef = useRef(0);

	useEffect(() => {
		if (!open) {
			return;
		}
		if (editingItem) {
			setType(editingItem.type);
			setValue(editingItem.value);
			setIsBulk(false);
			setBulkText('');
		} else {
			setType('word');
			setValue('');
			setIsBulk(false);
			setBulkText('');
		}
	}, [open, editingItem]);

	const handleSubmit = () => {
		if (editingItem) {
			if (value.trim()) {
				onUpdate(editingItem.id, value.trim(), type);
				onOpenChange(false);
			}
			return;
		}

		const entries: BannedItem[] = [];
		if (isBulk) {
			const lines = bulkText
				.split(/\r?\n/)
				.map((line) => line.trim())
				.filter((line) => line.length > 0);
			for (const line of lines) {
				idCounterRef.current += 1;
				entries.push({ id: `new-${idCounterRef.current}`, value: line, type });
			}
		} else if (value.trim()) {
			idCounterRef.current += 1;
			entries.push({ id: `new-${idCounterRef.current}`, value: value.trim(), type });
		}

		if (entries.length > 0) {
			onAdd(entries);
			onOpenChange(false);
		}
	};

	const placeholder =
		type === 'word'
			? 'ej: spam, spoiler, insulto'
			: type === 'symbol'
				? 'ej: 🔞, 💀, $$$'
				: 'ej: discord.gg, bit.ly, canal-spam.com';

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='w-[min(92vw,30rem)] border-border/80 bg-card p-6 shadow-2xl'>
				<DialogHeader className='gap-2 p-0 text-left'>
					<div className='flex size-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary'>
						<ShieldCheck className='size-5' />
					</div>
					<div>
						<DialogTitle className='font-display font-semibold text-foreground text-lg'>
							{editingItem ? 'Editar regla de bloqueo' : 'Nueva regla de bloqueo'}
						</DialogTitle>
						<DialogDescription className='mt-1 font-sans text-muted-foreground text-xs leading-relaxed'>
							Sandy filtrará los mensajes del chat que coincidan con este patrón antes de que
							lleguen a la transmisión.
						</DialogDescription>
					</div>
				</DialogHeader>

				<div className='mt-2 space-y-4'>
					{/* Tipo de Bloqueo */}
					<div className='space-y-1.5'>
						<Label className='font-medium font-mono text-[11px] text-muted-foreground uppercase tracking-wider'>
							Tipo de Regla
						</Label>
						<div className='grid grid-cols-3 gap-2'>
							{TYPE_OPTIONS.map((option) => {
								const Icon = option.icon;
								const isSelected = type === option.value;
								return (
									<button
										key={option.value}
										type='button'
										onClick={() => setType(option.value)}
										className={cn(
											'flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition-all',
											isSelected
												? 'border-primary/60 bg-primary/10 text-primary shadow-xs'
												: 'border-border/70 bg-card/60 text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground',
										)}
									>
										<Icon className='size-4' />
										<span className='font-display font-semibold text-xs'>{option.label}</span>
										<span className='font-sans text-[10px] text-muted-foreground'>
											{option.description}
										</span>
									</button>
								);
							})}
						</div>
					</div>

					{/* Modo (única vs bulk) solo para nuevo */}
					{!editingItem && (
						<div className='space-y-1.5'>
							<Label className='font-medium font-mono text-[11px] text-muted-foreground uppercase tracking-wider'>
								Método de Captura
							</Label>
							<div className='grid grid-cols-2 gap-2 rounded-lg border border-border/70 bg-background/50 p-1'>
								<button
									type='button'
									onClick={() => setIsBulk(false)}
									className={cn(
										'rounded-md py-1.5 font-medium font-sans text-xs transition-colors',
										!isBulk
											? 'border border-primary/30 bg-primary/10 font-semibold text-primary shadow-xs'
											: 'text-muted-foreground hover:text-foreground',
									)}
								>
									Entrada individual
								</button>
								<button
									type='button'
									onClick={() => setIsBulk(true)}
									className={cn(
										'rounded-md py-1.5 font-medium font-sans text-xs transition-colors',
										isBulk
											? 'border border-primary/30 bg-primary/10 font-semibold text-primary shadow-xs'
											: 'text-muted-foreground hover:text-foreground',
									)}
								>
									Lista múltiple (Bulk)
								</button>
							</div>
						</div>
					)}

					{/* Campo de valor o textarea */}
					{isBulk && !editingItem ? (
						<div className='space-y-1.5'>
							<Label
								htmlFor='bulk_text'
								className='font-medium font-mono text-[11px] text-muted-foreground uppercase tracking-wider'
							>
								Lista de términos (uno por línea)
							</Label>
							<textarea
								id='bulk_text'
								rows={5}
								value={bulkText}
								onChange={(event) => setBulkText(event.target.value)}
								placeholder={'spam\nspoiler\ndiscord.gg/'}
								className='w-full resize-none rounded-xl border border-border/80 bg-background/80 p-3 font-mono text-foreground text-xs placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
							/>
							<p className='font-sans text-[11px] text-muted-foreground'>
								Cada línea se agregará como una regla independiente del tipo seleccionado.
							</p>
						</div>
					) : (
						<div className='space-y-1.5'>
							<Label
								htmlFor='item_value'
								className='font-medium font-mono text-[11px] text-muted-foreground uppercase tracking-wider'
							>
								Término o Patrón
							</Label>
							<Input
								id='item_value'
								value={value}
								onChange={(event) => setValue(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === 'Enter') {
										event.preventDefault();
										handleSubmit();
									}
								}}
								placeholder={placeholder}
								className='h-10 rounded-xl border-border/80 bg-background/80 font-mono text-xs'
							/>
						</div>
					)}
				</div>

				<DialogFooter className='mt-6 flex flex-row items-center justify-end gap-2.5 p-0'>
					<Button
						type='button'
						variant='outline'
						onClick={() => onOpenChange(false)}
						className='h-9 rounded-lg px-4 font-sans text-xs'
					>
						Cancelar
					</Button>
					<Button
						type='button'
						onClick={handleSubmit}
						disabled={
							editingItem
								? value.trim().length === 0
								: isBulk
									? bulkText.trim().length === 0
									: value.trim().length === 0
						}
						className='h-9 rounded-lg bg-primary px-4 font-sans font-semibold text-primary-foreground text-xs shadow-xs hover:bg-primary/90'
					>
						{editingItem ? 'Guardar cambios' : 'Agregar regla'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
