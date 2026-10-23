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
		<Card className='rounded-xl border-border/60 bg-card'>
			<CardHeader className='space-y-4 border-border/50 border-b px-5 py-5 sm:px-6'>
				<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
					<div className='flex min-w-0 items-start gap-3.5'>
						<div className='flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background/60 text-primary'>
							<ShieldCheck className='size-5' />
						</div>
						<div className='space-y-1'>
							<CardTitle className='font-display font-semibold text-foreground text-lg'>
								Lista de bloqueos activos
							</CardTitle>
							<CardDescription className='max-w-xl font-sans text-muted-foreground text-xs leading-relaxed'>
								Palabras, patrones y enlaces bloqueados en el chat en tiempo real. Los cambios se
								sincronizan automáticamente con el backend.
							</CardDescription>
						</div>
					</div>
					<Button
						type='button'
						onClick={openAddSheet}
						size='sm'
						className='shrink-0 gap-2 rounded-lg bg-primary font-sans font-semibold text-primary-foreground text-xs shadow-xs hover:bg-primary/90'
					>
						<Plus className='size-3.5' />
						<span>Agregar regla</span>
					</Button>
				</div>
			</CardHeader>
			<CardContent className='space-y-4 px-5 py-5 sm:px-6'>
				{items.length === 0 ? (
					<div className='flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-border/60 border-dashed bg-background/30 px-4 py-8 text-center'>
						<ShieldCheck className='size-6 text-muted-foreground/60' />
						<p className='font-display font-medium text-foreground text-sm'>
							No hay bloqueos configurados
						</p>
						<p className='font-sans text-muted-foreground text-xs'>
							Agrega la primera regla con el botón &ldquo;Agregar regla&rdquo;.
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
