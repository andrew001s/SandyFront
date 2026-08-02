import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2 } from 'lucide-react';
import type { BannedItem, BannedItemType } from '@/components/Moderation/moderation.types';

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
		<div className='flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 px-4 py-3'>
			<Badge variant='outline' className={BANNED_TYPE_META[item.type].className}>
				{BANNED_TYPE_META[item.type].label}
			</Badge>
			<span className='min-w-0 flex-1 truncate font-medium text-sm'>{item.value}</span>
			<button
				type='button'
				onClick={() => onEdit(item)}
				aria-label={`Editar ${item.value}`}
				className='flex size-8 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground transition-colors hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-[#A78BFA]'
			>
				<Pencil className='size-4' />
			</button>
			<button
				type='button'
				onClick={() => onDelete(item.id)}
				aria-label={`Eliminar ${item.value}`}
				className='flex size-8 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-500'
			>
				<Trash2 className='size-4' />
			</button>
		</div>
	);
}
