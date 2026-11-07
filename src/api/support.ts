import { backendClient, getBackendUrl } from './backendClient';

export type PurchaseState =
	| 'unavailable'
	| 'free'
	| 'pending'
	| 'active'
	| 'review'
	| 'expired'
	| 'revoked';
export type SupportStatus = {
	available: boolean;
	amount_cents: number;
	currency: 'USD';
	watermark_free: boolean;
	state: PurchaseState;
	granted_at?: string | null;
};
export type SupportCheckout = {
	checkout_url?: string;
	checkout_email?: string;
	already_owned?: boolean;
	amount_cents: number;
	currency: 'USD';
	state: PurchaseState;
};
const options = (token: string, signal?: AbortSignal) => ({
	headers: { Authorization: `Bearer ${token}` },
	signal,
});
export const getSupportStatus = async (
	token: string,
	signal?: AbortSignal,
): Promise<SupportStatus> =>
	(await backendClient.get('/support/status', options(token, signal))).data;
export const startSupportCheckout = async (token: string): Promise<SupportCheckout> =>
	(await backendClient.post('/support/checkout', {}, options(token))).data;
export const createSupportOverlayKey = async (token: string, rotate = false): Promise<string> =>
	(await backendClient.post('/support/overlay-key', { rotate }, options(token))).data.token;
export const getOverlaySupportStatus = async (
	token: string,
	signal?: AbortSignal,
): Promise<{ watermark_free: boolean }> => {
	const response = await fetch(`${getBackendUrl()}/support/overlay-status`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'omit',
		signal,
		body: JSON.stringify({ token }),
	});
	if (!response.ok) throw new Error('No se pudo comprobar el permiso de OBS.');
	return response.json();
};
