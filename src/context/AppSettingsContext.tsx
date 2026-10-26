'use client';

import { type SettingsPayload, getSettings } from '@/api/settings';
import { useAuth } from '@clerk/nextjs';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type AppSettingsContextValue = {
	settings: SettingsPayload | null;
	isLoading: boolean;
	refreshSettings: () => Promise<void>;
};

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
	const { getToken, isLoaded, isSignedIn, userId } = useAuth();
	const [settings, setSettings] = useState<SettingsPayload | null>(null);
	const [settingsOwnerId, setSettingsOwnerId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const refreshSettings = useCallback(async () => {
		if (!isLoaded || !isSignedIn || !userId) {
			setSettings(null);
			setSettingsOwnerId(null);
			setIsLoading(false);
			return;
		}

		try {
			setIsLoading(true);
			const token = await getToken();
			const data = await getSettings({ token });
			setSettings(data.settings);
			setSettingsOwnerId(userId);
		} catch (error) {
			// Se conserva lo que ya estaba cargado: un fallo pasajero de red o una
			// renovación de token no significa que el usuario haya perdido su
			// configuración. Vaciarla dejaba la voz como "no configurada" —y el
			// error.missing-config correspondiente— con las claves bien puestas.
			console.error('Error al cargar settings:', error);
		} finally {
			setIsLoading(false);
		}
	}, [getToken, isLoaded, isSignedIn, userId]);

	useEffect(() => {
		void refreshSettings();
	}, [refreshSettings]);

	const value = useMemo(
		() => ({
			settings: settingsOwnerId === userId ? settings : null,
			isLoading,
			refreshSettings,
		}),
		[isLoading, refreshSettings, settings, settingsOwnerId, userId],
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
