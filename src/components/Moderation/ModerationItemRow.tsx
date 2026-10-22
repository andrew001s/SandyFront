import type { BannedItem, BannedItemType } from '@/components/Moderation/moderation.types';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2 } from 'lucide-react';

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

type ModerationItemRowProps = {
	item: BannedItem;
	onEdit: (item: BannedItem) => void;
	onDelete: (id: string) => void;
};

export function ModerationItemRow({ item, onEdit, onDelete }: ModerationItemRowProps) {
	return (
		<div className='flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 transition-colors hover:border-border'>
			<Badge
				variant='outline'
				className={`rounded-md font-mono text-[11px] ${BANNED_TYPE_META[item.type].className}`}
			>
				{BANNED_TYPE_META[item.type].label}
			</Badge>
			<span className='min-w-0 flex-1 truncate font-mono text-foreground text-xs'>
				{item.value}
			</span>
			<button
				type='button'
				onClick={() => onEdit(item)}
				aria-label={`Editar ${item.value}`}
				className='flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary'
			>
				<Pencil className='size-3.5' />
			</button>
			<button
				type='button'
				onClick={() => onDelete(item.id)}
				aria-label={`Eliminar ${item.value}`}
				className='flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive'
			>
				<Trash2 className='size-3.5' />
			</button>
		</div>
	);
}
