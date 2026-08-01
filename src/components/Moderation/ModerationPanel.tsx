'use client';

import { type SettingsPayload, saveSettings } from '@/api/settings';
import { AddBannedItemSheet } from '@/components/Moderation/AddBannedItemSheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useAuth } from '@clerk/nextjs';
import { Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export type BannedItemType = 'word' | 'symbol' | 'link';

export type BannedItem = {
	id: string;
	value: string;
	type: BannedItemType;
};

const BANNED_TYPE_META: Record<BannedItemType, { label: string; className: string }> = {
	word: {
		label: 'Palabra',
		className: 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400',
	},
	symbol: {
		label: 'Símbolo',
		className: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
	},
	link: {
		label: 'Link',
		className: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
	},
};

const flattenBannedItems = (settings: SettingsPayload | null): BannedItem[] => {
	const words = (settings?.custom_banned_words ?? []).map((value, index) => ({
		id: `word-${index}`,
		value,
		type: 'word' as const,
	}));
	const symbols = (settings?.custom_banned_symbols ?? []).map((value, index) => ({
		id: `symbol-${index}`,
		value,
		type: 'symbol' as const,
	}));
	const links = (settings?.custom_banned_links ?? []).map((value, index) => ({
		id: `link-${index}`,
		value,
		type: 'link' as const,
	}));

	return [...words, ...symbols, ...links];
};

export function ModerationPanel() {
	const { getToken } = useAuth();
	const { settings, refreshSettings } = useAppSettings();
	const [items, setItems] = useState<BannedItem[]>([]);
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<BannedItem | null>(null);

	useEffect(() => {
		if (settings) {
			setItems(flattenBannedItems(settings));
		}
	}, [settings]);

	const persist = async (next: BannedItem[]) => {
		try {
			const token = await getToken();
			const payload: SettingsPayload = {
				...(settings ?? {}),
				custom_banned_words: next.filter((item) => item.type === 'word').map((item) => item.value),
				custom_banned_symbols: next
					.filter((item) => item.type === 'symbol')
					.map((item) => item.value),
				custom_banned_links: next.filter((item) => item.type === 'link').map((item) => item.value),
			};
			await saveSettings(payload, { token });
			await refreshSettings();
			toast.success('Moderación guardada');
		} catch (error) {
			console.error('Error al guardar moderación:', error);
			toast.error('No se pudo guardar la moderación');
			await refreshSettings();
		}
	};

	const openAddSheet = () => {
		setEditingItem(null);
		setIsSheetOpen(true);
	};

	const openEditSheet = (item: BannedItem) => {
		setEditingItem(item);
		setIsSheetOpen(true);
	};

	const handleAdd = (entries: BannedItem[]) => {
		const next = [...items, ...entries];
		setItems(next);
		void persist(next);
	};

	const handleUpdate = (id: string, value: string, type: BannedItemType) => {
		const next = items.map((item) => (item.id === id ? { ...item, value, type } : item));
		setItems(next);
		void persist(next);
	};

	const handleDelete = (id: string) => {
		const next = items.filter((item) => item.id !== id);
		setItems(next);
		void persist(next);
	};

	return (
		<Card className='border-border/60 bg-card/90 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.18)] backdrop-blur-xl'>
			<CardHeader className='space-y-4 border-border/50 border-b px-5 py-5 sm:px-6'>
				<div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
					<div className='flex min-w-0 items-start gap-4'>
						<div className='flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-background/80 text-violet-600 shadow-sm'>
							<ShieldCheck className='size-5' />
						</div>
						<div className='space-y-1'>
							<CardTitle className='text-xl'>Lista de bloqueos</CardTitle>
							<CardDescription className='max-w-xl'>
								Palabras, símbolos y enlaces que el backend bloqueará en los mensajes del chat. Los
								cambios se guardan automáticamente.
							</CardDescription>
						</div>
					</div>
					<Button type='button' variant='outline' onClick={openAddSheet}>
						<Plus className='size-4' />
						Agregar entrada
					</Button>
				</div>
			</CardHeader>
			<CardContent className='space-y-4 px-5 py-5 sm:px-6'>
				{items.length === 0 ? (
					<div className='flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-border/60 border-dashed px-4 text-center'>
						<ShieldCheck className='size-6 text-muted-foreground' />
						<p className='font-medium'>No hay bloqueos configurados</p>
						<p className='text-muted-foreground text-sm'>
							Agrega la primera entrada con el botón &ldquo;Agregar entrada&rdquo;.
						</p>
					</div>
				) : (
					<div className='grid gap-2'>
						{items.map((item) => (
							<div
								key={item.id}
								className='flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 px-4 py-3'
							>
								<Badge variant='outline' className={BANNED_TYPE_META[item.type].className}>
									{BANNED_TYPE_META[item.type].label}
								</Badge>
								<span className='min-w-0 flex-1 truncate font-medium text-sm'>{item.value}</span>
								<button
									type='button'
									onClick={() => openEditSheet(item)}
									aria-label={`Editar ${item.value}`}
									className='flex size-8 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground transition-colors hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-[#A78BFA]'
								>
									<Pencil className='size-4' />
								</button>
								<button
									type='button'
									onClick={() => handleDelete(item.id)}
									aria-label={`Eliminar ${item.value}`}
									className='flex size-8 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-500'
								>
									<Trash2 className='size-4' />
								</button>
							</div>
						))}
					</div>
				)}
			</CardContent>
			<AddBannedItemSheet
				open={isSheetOpen}
				onOpenChange={setIsSheetOpen}
				editingItem={editingItem}
				onAdd={handleAdd}
				onUpdate={handleUpdate}
			/>
		</Card>
	);
}
