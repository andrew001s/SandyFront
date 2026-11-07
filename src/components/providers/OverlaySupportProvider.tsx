'use client';

import { getOverlaySupportStatus } from '@/api/support';
import { WatermarkPermissionContext } from '@/context/SupportPurchaseContext';
import { type ReactNode, useEffect, useState } from 'react';

export function OverlaySupportProvider({ children }: { children: ReactNode }) {
	const [allowed, setAllowed] = useState(false);
	useEffect(() => {
		let disposed = false;
		let timer: ReturnType<typeof setTimeout>;
		let controller: AbortController | undefined;
		let credential = '';
		const storageKey = 'sandy:obs-support-key';
		const readCredential = () => {
			const previous = credential;
			const params = new URLSearchParams(window.location.hash.slice(1));
			const received = params.get('support');
			try {
				credential = received ?? sessionStorage.getItem(storageKey) ?? '';
				if (received) sessionStorage.setItem(storageKey, received);
			} catch {
				credential = received ?? credential;
			}
			if (credential !== previous) setAllowed(false);
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
			controller?.abort();
			const current = new AbortController();
			controller = current;
			readCredential();
			if (!credential) {
				setAllowed(false);
				return;
			}
			try {
				const result = await getOverlaySupportStatus(credential, current.signal);
				if (!disposed && !current.signal.aborted) setAllowed(result.watermark_free === true);
			} catch {
				if (!disposed && !current.signal.aborted) setAllowed(false);
			}
			if (!disposed && !current.signal.aborted) timer = setTimeout(() => void sync(), 60000);
		};
		const retry = () => {
			if (document.visibilityState === 'visible') void sync();
		};
		void sync();
		window.addEventListener('hashchange', retry);
		window.addEventListener('online', retry);
		window.addEventListener('focus', retry);
		return () => {
			disposed = true;
			clearTimeout(timer);
			controller?.abort();
			window.removeEventListener('hashchange', retry);
			window.removeEventListener('online', retry);
			window.removeEventListener('focus', retry);
		};
	}, []);
	return (
		<WatermarkPermissionContext.Provider value={allowed}>
			{children}
		</WatermarkPermissionContext.Provider>
	);
}
