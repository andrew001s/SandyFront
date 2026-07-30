'use client';

import { getSettings, type SettingsPayload } from '@/api/settings';
import { useAuth } from '@clerk/nextjs';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type AppSettingsContextValue = {
	settings: SettingsPayload | null;
	isLoading: boolean;
	refreshSettings: () => Promise<void>;
};

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
	const { getToken, isLoaded, isSignedIn } = useAuth();
	const [settings, setSettings] = useState<SettingsPayload | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const refreshSettings = useCallback(async () => {
		if (!isLoaded || !isSignedIn) {
			setSettings(null);
			setIsLoading(false);
			return;
		}

		try {
			setIsLoading(true);
			const token = await getToken();
			const data = await getSettings({ token });
			setSettings(data.settings);
		} catch (error) {
			console.error('Error al cargar settings:', error);
			setSettings(null);
		} finally {
			setIsLoading(false);
		}
	}, [getToken, isLoaded, isSignedIn]);

	useEffect(() => {
		void refreshSettings();
	}, [refreshSettings]);

	const value = useMemo(
		() => ({
			settings,
			isLoading,
			refreshSettings,
		}),
		[isLoading, refreshSettings, settings],
	);

	return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings() {
	const context = useContext(AppSettingsContext);

	if (!context) {
		throw new Error('useAppSettings must be used within an AppSettingsProvider');
	}

	return context;
}
