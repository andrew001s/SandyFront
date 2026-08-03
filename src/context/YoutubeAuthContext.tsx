'use client';

import { useYoutubeAuth } from '@/hooks/useYoutubeAuth';
import type {
	YoutubeBroadcastPayload,
	YoutubeProfile,
	YoutubeServiceStatus,
} from '@/interfaces/youtubeInterface';
import { type ReactNode, createContext, useContext } from 'react';

interface YoutubeAuthContextType {
	profile: YoutubeProfile | null;
	status: boolean;
	tokensAuthenticated: boolean;
	serviceStatus: YoutubeServiceStatus | null;
	isLoading: boolean;
	isBusy: boolean;
	isRefreshing: boolean;
	fetchProfile: () => Promise<void>;
	refreshStatus: () => Promise<boolean>;
	handleConnect: () => Promise<void>;
	handleDisconnect: () => Promise<void>;
	handleToggleService: () => Promise<void>;
	handleSendTestMessage: (message: string) => Promise<void>;
	handleUpdateBroadcast: (payload: YoutubeBroadcastPayload) => Promise<void>;
}

const YoutubeAuthContext = createContext<YoutubeAuthContextType | null>(null);

export const YoutubeAuthProvider = ({ children }: { children: ReactNode }) => {
	const auth = useYoutubeAuth();

	return <YoutubeAuthContext.Provider value={auth}>{children}</YoutubeAuthContext.Provider>;
};

export const useYoutubeAuthContext = () => {
	const context = useContext(YoutubeAuthContext);
	if (!context) {
		throw new Error('useYoutubeAuthContext must be used within a YoutubeAuthProvider');
	}
	return context;
};
