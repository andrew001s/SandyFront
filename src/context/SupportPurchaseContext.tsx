'use client';

import {
	type SupportStatus,
	createSupportOverlayKey,
	getSupportStatus,
	redeemSupportLicenseCode,
	startSupportCheckout,
} from '@/api/support';
import { useAuth } from '@clerk/nextjs';
import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from 'react';

export const WatermarkPermissionContext = createContext(false);
export const useWatermarkFree = () => useContext(WatermarkPermissionContext);
type OverlayPath = '/overlay/avatar' | '/overlay/avatar2d';
type PurchaseContext = {
	ownerId: string | null | undefined;
	status: SupportStatus | null;
	loading: boolean;
	error: string | null;
	refresh: () => Promise<SupportStatus | undefined>;
	checkout: () => Promise<Awaited<ReturnType<typeof startSupportCheckout>>>;
	redeem: (code: string) => Promise<void>;
	createOverlayUrl: (path: OverlayPath) => Promise<string>;
	rotateOverlayKey: () => Promise<void>;
};
const SupportPurchaseContext = createContext<PurchaseContext | null>(null);
export const useSupportPurchase = () => useContext(SupportPurchaseContext);

export function SupportPurchaseProvider({ children }: { children: ReactNode }) {
	const { isLoaded, isSignedIn, userId, getToken } = useAuth();
	const tokenGetter = useRef(getToken);
	tokenGetter.current = getToken;
	const owner = useRef(userId);
	owner.current = userId;
	const sequence = useRef(0);
	const invalidateRequests = useCallback(() => {
		sequence.current++;
	}, []);
	const polls = useRef(0);
	const [record, setRecord] = useState<{
		owner?: string | null;
		status: SupportStatus | null;
		error: string | null;
		loading: boolean;
	}>({ status: null, error: null, loading: true });
	const validRecord = isSignedIn && record.owner === userId;
	const status = validRecord ? record.status : null;
	const refresh = useCallback(async () => {
		const request = ++sequence.current;
		if (!isLoaded || !isSignedIn || !userId) return;
		try {
			const token = await tokenGetter.current();
			if (!token) throw new Error('Sin sesión');
			const result = await getSupportStatus(token);
			if (request !== sequence.current || owner.current !== userId) return;
			setRecord({ owner: userId, status: result, error: null, loading: false });
			return result;
		} catch {
			if (request === sequence.current && owner.current === userId)
				setRecord({
					owner: userId,
					status: null,
					error: 'No se pudo comprobar tu compra. Reintenta cuando tengas conexión.',
					loading: false,
				});
		}
	}, [isLoaded, isSignedIn, userId]);

	useEffect(() => {
		polls.current = 0;
		void refresh();
		const sync = () => {
			if (document.visibilityState === 'visible') void refresh();
		};
		window.addEventListener('focus', sync);
		window.addEventListener('online', sync);
		return () => {
			invalidateRequests();
			window.removeEventListener('focus', sync);
			window.removeEventListener('online', sync);
		};
	}, [refresh, invalidateRequests]);
	useEffect(() => {
		if (!validRecord || (status?.state !== 'pending' && !status?.watermark_free && !record.error))
			return;
		const delay = record.error
			? 15000
			: status?.state === 'pending'
				? polls.current < 40
					? 3000
					: 15000
				: 60000;
		const timer = setTimeout(() => {
			polls.current++;
			void refresh();
		}, delay);
		return () => clearTimeout(timer);
	}, [status, refresh, validRecord, record.error]);

	const authenticated = async () => {
		const expectedOwner = userId;
		if (!expectedOwner || !isSignedIn) throw new Error('Inicia sesión para gestionar tu compra.');
		const token = await tokenGetter.current();
		if (!token || owner.current !== expectedOwner)
			throw new Error('La sesión cambió. Inténtalo de nuevo.');
		return { token, expectedOwner };
	};
	const value: PurchaseContext = {
		ownerId: userId,
		status,
		loading: !isLoaded || Boolean(isSignedIn && (!validRecord || record.loading)),
		error: validRecord ? record.error : null,
		refresh,
		checkout: async () => {
			const { token, expectedOwner } = await authenticated();
			const result = await startSupportCheckout(token);
			if (owner.current !== expectedOwner) throw new Error('La sesión cambió.');
			await refresh();
			return result;
		},
		redeem: async (code) => {
			const { token, expectedOwner } = await authenticated();
			const result = await redeemSupportLicenseCode(token, code);
			if (owner.current !== expectedOwner) throw new Error('La sesión cambió.');
			sequence.current++;
			setRecord({ owner: expectedOwner, status: result, error: null, loading: false });
		},
		createOverlayUrl: async (path) => {
			if (!['/overlay/avatar', '/overlay/avatar2d'].includes(path))
				throw new Error('Fuente OBS desconocida.');
			const url = new URL(path, window.location.origin);
			const current = status ?? (await refresh());
			if (current?.available) {
				const { token, expectedOwner } = await authenticated();
				const key = await createSupportOverlayKey(token);
				if (owner.current !== expectedOwner) throw new Error('La sesión cambió.');
				url.hash = new URLSearchParams({ support: key }).toString();
			}
			if (!current && isSignedIn)
				throw new Error('No se pudo verificar tu cuenta para generar el enlace.');
			return url.toString();
		},
		rotateOverlayKey: async () => {
			const { token } = await authenticated();
			await createSupportOverlayKey(token, true);
		},
	};
	return (
		<SupportPurchaseContext.Provider value={value}>
			<WatermarkPermissionContext.Provider value={Boolean(status?.watermark_free)}>
				{children}
			</WatermarkPermissionContext.Provider>
		</SupportPurchaseContext.Provider>
	);
}
