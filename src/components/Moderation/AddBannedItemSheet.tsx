'use client';

import type { BannedItem, BannedItemType } from '@/components/Moderation/moderation.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

type AddBannedItemSheetProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editingItem?: BannedItem | null;
	onAdd: (items: BannedItem[]) => void;
	onUpdate: (id: string, value: string, type: BannedItemType) => void;
};

const TYPE_OPTIONS: Array<{ value: BannedItemType; label: string }> = [
	{ value: 'word', label: 'Palabra' },
	{ value: 'symbol', label: 'Símbolo' },
	{ value: 'link', label: 'Link' },
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

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side='right' className='sm:max-w-md'>
				<SheetHeader>
					<SheetTitle>{editingItem ? 'Editar entrada' : 'Agregar entrada'}</SheetTitle>
					<SheetDescription>
						Palabra, símbolo o enlace que el backend bloqueará en los mensajes.
					</SheetDescription>
				</SheetHeader>
				<div className='space-y-5 px-4'>
					<div className='space-y-2'>
						<Label>Tipo</Label>
						<div className='grid grid-cols-3 gap-2'>
							{TYPE_OPTIONS.map((option) => (
								<button
									key={option.value}
									type='button'
									onClick={() => setType(option.value)}
									className={cn(
										'rounded-xl border px-3 py-2 font-medium text-sm transition-colors',
										type === option.value
											? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-[#A78BFA]'
											: 'border-border/60 bg-background/60 text-muted-foreground hover:border-border hover:text-foreground',
									)}
								>
									{option.label}
								</button>
							))}
						</div>
					</div>

					{!editingItem ? (
						<div className='space-y-2'>
							<Label>Modo</Label>
							<div className='grid grid-cols-2 gap-2'>
								<button
									type='button'
									onClick={() => setIsBulk(false)}
									className={cn(
										'rounded-xl border px-3 py-2 font-medium text-sm transition-colors',
										!isBulk
											? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-[#A78BFA]'
											: 'border-border/60 bg-background/60 text-muted-foreground hover:border-border hover:text-foreground',
									)}
								>
									Una entrada
								</button>
								<button
									type='button'
									onClick={() => setIsBulk(true)}
									className={cn(
										'rounded-xl border px-3 py-2 font-medium text-sm transition-colors',
										isBulk
											? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-[#A78BFA]'
											: 'border-border/60 bg-background/60 text-muted-foreground hover:border-border hover:text-foreground',
									)}
								>
									Varias (bulk)
								</button>
							</div>
						</div>
					) : null}

					{isBulk && !editingItem ? (
						<div className='space-y-2'>
							<Label htmlFor='bulk_text'>Lista</Label>
							<textarea
								id='bulk_text'
								rows={6}
								value={bulkText}
								onChange={(event) => setBulkText(event.target.value)}
								placeholder={'spam\npromo\nlink'}
								className='w-full resize-y rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/30'
							/>
							<p className='text-muted-foreground text-xs'>
								Una por línea, todas del tipo elegido.
							</p>
						</div>
					) : (
						<div className='space-y-2'>
							<Label htmlFor='item_value'>Valor</Label>
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
								placeholder={type === 'word' ? 'spam' : type === 'symbol' ? '🔞' : 'discord.gg/'}
							/>
						</div>
					)}
				</div>
				<SheetFooter>
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
						className='bg-[#8B5CF6] text-white hover:bg-[#7C3AED]'
					>
						{editingItem ? 'Guardar cambios' : 'Agregar'}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
