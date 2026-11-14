'use client';

import { getOverlaySupportStatus } from '@/api/support';
import { WatermarkPermissionContext } from '@/context/SupportPurchaseContext';
import { connectOverlayRealtime } from '@/lib/overlayRealtime';
import {
	SUPPORT_OVERLAY_CHANNEL,
	SUPPORT_OVERLAY_OWNER_KEY,
	SUPPORT_OVERLAY_POLL_MS,
	SUPPORT_OVERLAY_REFRESH_KEY,
	SUPPORT_PERMISSION_GRACE_MS,
	type SupportOverlayMessage,
} from '@/lib/supportOverlay';
import { type ReactNode, useEffect, useState } from 'react';

export function OverlaySupportProvider({ children }: { children: ReactNode }) {
	const [allowed, setAllowed] = useState(false);
	useEffect(() => {
		let disposed = false;
		let timer: ReturnType<typeof setTimeout> | undefined;
		let expiryTimer: ReturnType<typeof setTimeout> | undefined;
		let requestTimeout: ReturnType<typeof setTimeout> | undefined;
		let controller: AbortController | undefined;
		let credential = '';
		const storageKey = `sandy:obs-support-key:${location.pathname}`;
		const legacyBindingKey = `sandy:obs-support-binding:${location.pathname}`;
		const channel =
			typeof BroadcastChannel === 'undefined'
				? null
				: new BroadcastChannel(SUPPORT_OVERLAY_CHANNEL);
		const applyPermission = (value: boolean, checkedAt: number) => {
			clearTimeout(expiryTimer);
			const remaining = SUPPORT_PERMISSION_GRACE_MS - (Date.now() - checkedAt);
			setAllowed(value && remaining > 0);
			if (value && remaining > 0) expiryTimer = setTimeout(() => setAllowed(false), remaining);
		};
		const adoptCredential = (next: string, legacy = false) => {
			if (!next || next === credential) return;
			credential = next;
			connectOverlayRealtime(next);
			clearTimeout(expiryTimer);
			setAllowed(false);
			try {
				sessionStorage.setItem(storageKey, next);
				if (legacy) localStorage.setItem(legacyBindingKey, next);
				const cached = JSON.parse(
					sessionStorage.getItem(`sandy:obs-support-status:${next}`) || 'null',
				);
				if (
					cached &&
					typeof cached.allowed === 'boolean' &&
					Number.isFinite(cached.checkedAt) &&
					cached.checkedAt <= Date.now()
				) {
					applyPermission(cached.allowed, cached.checkedAt);
				}
			} catch {
				// The capability in the original OBS URL also works when storage is unavailable.
			}
		};
		const readCredential = () => {
			const params = new URLSearchParams(window.location.hash.slice(1));
			const received = params.get('support');
			try {
				const stored =
					sessionStorage.getItem(storageKey) || sessionStorage.getItem('sandy:obs-support-key');
				const legacy =
					localStorage.getItem(legacyBindingKey) || localStorage.getItem(SUPPORT_OVERLAY_OWNER_KEY);
				adoptCredential(received || credential || stored || legacy || '', !received && !stored);
			} catch {
				if (received) adoptCredential(received);
			}
			if (received) {
				params.delete('support');
				history.replaceState(
					null,
					'',
					`${location.pathname}${location.search}${params.size ? `#${params}` : ''}`,
				);
			}
		};
		const sync = async () => {
			clearTimeout(timer);
			clearTimeout(requestTimeout);
			controller?.abort();
			const current = new AbortController();
			controller = current;
			readCredential();
			if (!credential) {
				channel?.postMessage({ type: 'request-credential' } satisfies SupportOverlayMessage);
				timer = setTimeout(() => void sync(), SUPPORT_OVERLAY_POLL_MS);
				return;
			}
			const timeout = setTimeout(() => current.abort(), 10_000);
			requestTimeout = timeout;
			try {
				const result = await getOverlaySupportStatus(credential, current.signal);
				if (!disposed && controller === current && !current.signal.aborted) {
					const checkedAt = Date.now();
					const value = result.watermark_free === true;
					applyPermission(value, checkedAt);
					try {
						sessionStorage.setItem(
							`sandy:obs-support-status:${credential}`,
							JSON.stringify({ allowed: value, checkedAt }),
						);
					} catch {
						/* In-memory grace still prevents flashing during connection errors. */
					}
				}
			} catch (error) {
				// Keep the last verified state until its bounded grace period expires.
				if (
					!disposed &&
					controller === current &&
					error &&
					typeof error === 'object' &&
					'status' in error &&
					[400, 401, 403].includes(Number(error.status))
				) {
					applyPermission(false, Date.now());
					try {
						sessionStorage.removeItem(`sandy:obs-support-status:${credential}`);
					} catch {
						/* The in-memory permission was already cleared. */
					}
				}
			} finally {
				clearTimeout(timeout);
			}
			if (!disposed && controller === current)
				timer = setTimeout(() => void sync(), SUPPORT_OVERLAY_POLL_MS);
		};
		const retry = () => {
			void sync();
		};
		const storageChanged = (event: StorageEvent) => {
			if ([SUPPORT_OVERLAY_OWNER_KEY, SUPPORT_OVERLAY_REFRESH_KEY].includes(event.key || ''))
				void sync();
		};
		if (channel)
			channel.onmessage = (event: MessageEvent<SupportOverlayMessage>) => {
				if (
					event.data?.type === 'credential' &&
					!credential &&
					typeof event.data.token === 'string'
				) {
					adoptCredential(event.data.token, true);
					void sync();
				} else if (event.data?.type === 'refresh') void sync();
			};
		void sync();
		window.addEventListener('hashchange', retry);
		window.addEventListener('online', retry);
		window.addEventListener('focus', retry);
		window.addEventListener('pageshow', retry);
		window.addEventListener('storage', storageChanged);
		document.addEventListener('visibilitychange', retry);
		return () => {
			disposed = true;
			clearTimeout(timer);
			clearTimeout(expiryTimer);
			clearTimeout(requestTimeout);
			controller?.abort();
			channel?.close();
			window.removeEventListener('hashchange', retry);
			window.removeEventListener('online', retry);
			window.removeEventListener('focus', retry);
			window.removeEventListener('pageshow', retry);
			window.removeEventListener('storage', storageChanged);
			document.removeEventListener('visibilitychange', retry);
		};
	}, []);
	return (
		<WatermarkPermissionContext.Provider value={allowed}>
			{children}
		</WatermarkPermissionContext.Provider>
	);
}
