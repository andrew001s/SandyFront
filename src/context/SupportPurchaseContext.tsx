'use client';

import {
	type SupportStatus,
	createSupportOverlayKey,
	getSupportStatus,
	redeemSupportLicenseCode,
	startSupportCheckout,
} from '@/api/support';
import { connectOverlayRealtime } from '@/lib/overlayRealtime';
import {
	SUPPORT_OVERLAY_CHANNEL,
	SUPPORT_OVERLAY_OWNER_KEY,
	SUPPORT_OVERLAY_POLL_MS,
	SUPPORT_PERMISSION_GRACE_MS,
	type SupportOverlayMessage,
	notifyOverlaySupport,
} from '@/lib/supportOverlay';
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
	const overlayChannel = useRef<BroadcastChannel | null>(null);
	const overlayCredential = useRef('');
	const verifiedAt = useRef(0);
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
			verifiedAt.current = Date.now();
			setRecord({ owner: userId, status: result, error: null, loading: false });
			return result;
		} catch {
			if (request === sequence.current && owner.current === userId)
				setRecord((previous) => ({
					owner: userId,
					status:
						previous.owner === userId &&
						Date.now() - verifiedAt.current < SUPPORT_PERMISSION_GRACE_MS
							? previous.status
							: null,
					error: 'No se pudo comprobar tu compra. Reintenta cuando tengas conexión.',
					loading: false,
				}));
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
		if (!isLoaded || !isSignedIn || !userId) return;
		let disposed = false;
		overlayCredential.current = '';
		let pending = false;
		let retry: ReturnType<typeof setTimeout> | undefined;
		const channel =
			typeof BroadcastChannel === 'undefined'
				? null
				: new BroadcastChannel(SUPPORT_OVERLAY_CHANNEL);
		overlayChannel.current = channel;
		const publish = async () => {
			if (pending || disposed) return;
			pending = true;
			try {
				if (!overlayCredential.current) {
					const token = await tokenGetter.current();
					if (!token || disposed || owner.current !== userId) return;
					const result = await createSupportOverlayKey(token);
					if (disposed || owner.current !== userId) return;
					overlayCredential.current = result;
					connectOverlayRealtime(result);
				}
				try {
					localStorage.setItem(SUPPORT_OVERLAY_OWNER_KEY, overlayCredential.current);
				} catch {
					/* BroadcastChannel can still bind legacy overlays. */
				}
				channel?.postMessage({
					type: 'credential',
					token: overlayCredential.current,
				} satisfies SupportOverlayMessage);
			} catch {
				if (!disposed) retry = setTimeout(() => void publish(), SUPPORT_OVERLAY_POLL_MS);
			} finally {
				pending = false;
			}
		};
		if (channel)
			channel.onmessage = (event: MessageEvent<SupportOverlayMessage>) => {
				if (event.data?.type === 'request-credential') void publish();
			};
		void publish();
		return () => {
			disposed = true;
			clearTimeout(retry);
			channel?.close();
			overlayChannel.current = null;
			const credential = overlayCredential.current;
			overlayCredential.current = '';
			try {
				if (credential && localStorage.getItem(SUPPORT_OVERLAY_OWNER_KEY) === credential)
					localStorage.removeItem(SUPPORT_OVERLAY_OWNER_KEY);
			} catch {
				/* Existing overlay credentials remain valid after signing out. */
			}
		};
	}, [isLoaded, isSignedIn, userId]);
	useEffect(() => {
		if (status) notifyOverlaySupport(overlayChannel.current);
	}, [status]);
	useEffect(() => {
		if (!record.error || !status?.watermark_free) return;
		const remaining = Math.max(0, SUPPORT_PERMISSION_GRACE_MS - (Date.now() - verifiedAt.current));
		const timer = setTimeout(() => {
			setRecord((previous) =>
				previous.owner === userId ? { ...previous, status: null } : previous,
			);
		}, remaining);
		return () => clearTimeout(timer);
	}, [record.error, status, userId]);
	useEffect(() => {
		if (!validRecord) return;
		const delay = record.error
			? 15000
			: status?.state === 'pending'
				? polls.current < 40
					? 3000
					: 15000
				: SUPPORT_OVERLAY_POLL_MS;
		const timer = setTimeout(() => {
			polls.current++;
			void refresh();
		}, delay);
		return () => clearTimeout(timer);
	}, [record, refresh, validRecord]);

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
			verifiedAt.current = Date.now();
			setRecord({ owner: expectedOwner, status: result, error: null, loading: false });
			notifyOverlaySupport(overlayChannel.current);
		},
		createOverlayUrl: async (path) => {
			if (!['/overlay/avatar', '/overlay/avatar2d'].includes(path))
				throw new Error('Fuente OBS desconocida.');
			const url = new URL(path, window.location.origin);
			const { token, expectedOwner } = await authenticated();
			const key = await createSupportOverlayKey(token);
			if (owner.current !== expectedOwner) throw new Error('La sesión cambió.');
			url.hash = new URLSearchParams({ support: key }).toString();
			return url.toString();
		},
		rotateOverlayKey: async () => {
			const { token, expectedOwner } = await authenticated();
			const key = await createSupportOverlayKey(token, true);
			if (owner.current !== expectedOwner) throw new Error('La sesión cambió.');
			overlayCredential.current = key;
			connectOverlayRealtime(key);
			try {
				localStorage.setItem(SUPPORT_OVERLAY_OWNER_KEY, key);
			} catch {
				/* Rotation still invalidates old credentials on the server. */
			}
			notifyOverlaySupport(overlayChannel.current);
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
