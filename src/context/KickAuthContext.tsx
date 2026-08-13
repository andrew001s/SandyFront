'use client';

import { useKickAuth } from '@/hooks/useKickAuth';
import type { ProfileModel } from '@/interfaces/profileInterface';
import type { ServiceStatus } from '@/api/sandycore';
import { type ReactNode, createContext, useContext } from 'react';

interface KickAuthContextType {
	isLoading: boolean;
	isBusy: boolean;
	isRefreshing: boolean;
	setIsLoading: (value: boolean) => void;
	profile: ProfileModel | null;
	status: boolean;
	tokensSaved: boolean;
	serviceStatus: ServiceStatus | null;
	handleConnect: () => Promise<void>;
	handleDisconnect: () => Promise<void>;
	handleToggleService: () => Promise<void>;
	fetchProfile: () => Promise<void>;
	refreshStatus: () => Promise<void>;
}

const KickAuthContext = createContext<KickAuthContextType | null>(null);

export const KickAuthProvider = ({
	children,
	disableInitialStatusLoad = false,
}: {
	children: ReactNode;
	disableInitialStatusLoad?: boolean;
}) => {
	const auth = useKickAuth({ disableInitialStatusLoad });

	return <KickAuthContext.Provider value={auth}>{children}</KickAuthContext.Provider>;
};

export const useKickAuthContext = () => {
	const context = useContext(KickAuthContext);
	if (!context) {
		throw new Error('useKickAuthContext must be used within a KickAuthProvider');
	}
	return context;
};

