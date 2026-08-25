import {
	type SettingsPayload,
	type SettingsUpdate,
	TTS_PROVIDER,
	saveSettings,
} from '@/api/settings';
import type { BannedItem, BannedItemType } from '@/components/Moderation/moderation.types';
import { useAppSettings } from '@/context/AppSettingsContext';
import {
	type BannedContent,
	normalizeBannedContent,
	toBannedContentPayload,
} from '@/lib/banned-content';
import { useAuth } from '@clerk/nextjs';
import posthog from 'posthog-js';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const flattenBannedItems = (settings: SettingsPayload | null): BannedItem[] => {
	const { words = [], symbols = [], links = [] } = normalizeBannedContent(settings);

	return [
		...words.map((value, index) => ({ id: `word-${index}`, value, type: 'word' as const })),
		...symbols.map((value, index) => ({ id: `symbol-${index}`, value, type: 'symbol' as const })),
		...links.map((value, index) => ({ id: `link-${index}`, value, type: 'link' as const })),
	];
};

const groupBannedItems = (items: BannedItem[]): BannedContent => ({
	// Se mandan arrays aunque queden vacíos: es la única forma de borrar la
	// última regla de una categoría.
	words: items.filter((item) => item.type === 'word').map((item) => item.value),
	symbols: items.filter((item) => item.type === 'symbol').map((item) => item.value),
	links: items.filter((item) => item.type === 'link').map((item) => item.value),
});

export function useModerationPanel() {
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

	const persist = async (next: BannedItem[], action: 'added' | 'updated' | 'deleted') => {
		try {
			const token = await getToken();
			const payload: SettingsUpdate = {
				...(settings ?? {}),
				// Igual que en los flags: el spread no debe devolver el valor heredado.
				tts_provider: TTS_PROVIDER,
				...toBannedContentPayload(groupBannedItems(next)),
			};
			await saveSettings(payload, { token });
			await refreshSettings();
			posthog.capture('moderation_rules_updated', { action, rule_count: next.length });
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
		void persist(next, 'added');
	};

	const handleUpdate = (id: string, value: string, type: BannedItemType) => {
		const next = items.map((item) => (item.id === id ? { ...item, value, type } : item));
		setItems(next);
		void persist(next, 'updated');
	};

	const handleDelete = (id: string) => {
		const next = items.filter((item) => item.id !== id);
		setItems(next);
		void persist(next, 'deleted');
	};

	return {
		items,
		isSheetOpen,
		setIsSheetOpen,
		editingItem,
		openAddSheet,
		openEditSheet,
		handleAdd,
		handleUpdate,
		handleDelete,
	};
}
