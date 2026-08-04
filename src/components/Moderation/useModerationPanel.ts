import { type SettingsPayload, saveSettings } from '@/api/settings';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useAuth } from '@clerk/nextjs';
import posthog from 'posthog-js';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { BannedItem, BannedItemType } from '@/components/Moderation/moderation.types';

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
