'use client';

import { AddBannedItemSheet } from '@/components/Moderation/AddBannedItemSheet';
import { ModerationItemRow } from '@/components/Moderation/ModerationItemRow';
import { useModerationPanel } from '@/components/Moderation/useModerationPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ShieldCheck } from 'lucide-react';

export function ModerationPanel() {
	const {
		items,
		isSheetOpen,
		setIsSheetOpen,
		editingItem,
		openAddSheet,
		openEditSheet,
		handleAdd,
		handleUpdate,
		handleDelete,
	} = useModerationPanel();

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
							<ModerationItemRow
								key={item.id}
								item={item}
								onEdit={openEditSheet}
								onDelete={handleDelete}
							/>
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
