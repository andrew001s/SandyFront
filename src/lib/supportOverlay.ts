export const SUPPORT_OVERLAY_POLL_MS = 15_000;
export const SUPPORT_PERMISSION_GRACE_MS = 5 * 60_000;
export const SUPPORT_OVERLAY_CHANNEL = 'sandy_support_sync';
export const SUPPORT_OVERLAY_OWNER_KEY = 'sandy:obs-support-owner';
export const SUPPORT_OVERLAY_REFRESH_KEY = 'sandy:obs-support-refresh';

export type SupportOverlayMessage =
	| { type: 'request-credential' }
	| { type: 'credential'; token: string }
	| { type: 'refresh' };

export function notifyOverlaySupport(channel: BroadcastChannel | null) {
	channel?.postMessage({ type: 'refresh' } satisfies SupportOverlayMessage);
	try {
		localStorage.setItem(SUPPORT_OVERLAY_REFRESH_KEY, String(Date.now()));
	} catch {
		// OBS can disable persistent browser storage; polling still synchronizes the source.
	}
}
