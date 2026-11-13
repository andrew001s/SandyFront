import { afterEach, expect, it, vi } from 'vitest';
import { getOverlaySupportStatus } from './support';

vi.mock('./backendClient', () => ({
	backendClient: {},
	getBackendUrl: () => 'https://backend.example',
}));
afterEach(() => vi.unstubAllGlobals());

it('checks an OBS permission without cookies, bearer session or a credential in the URL', async () => {
	const fetcher = vi
		.fn()
		.mockResolvedValue({ ok: true, json: async () => ({ watermark_free: true }) });
	vi.stubGlobal('fetch', fetcher);
	expect(await getOverlaySupportStatus('readonly-secret')).toEqual({ watermark_free: true });
	expect(fetcher).toHaveBeenCalledWith(
		'https://backend.example/support/overlay-status',
		expect.objectContaining({
			method: 'POST',
			credentials: 'omit',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ token: 'readonly-secret' }),
		}),
	);
});
