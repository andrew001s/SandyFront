import { getBackendUrl } from '@/api/backendClient';

type WireMessage = { type: string; payload?: unknown };
const channels = new Map<string, BroadcastChannel>();
const sockets = new Map<string, WebSocket>();
const reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();
let overlayKey = '';
let connectionRole: 'studio' | 'viewer' = 'studio';
let applyingRemoteMessage = false;

export function connectOverlayRealtime(key: string, role: 'studio' | 'viewer' = 'studio') {
	if (!key || key === overlayKey) return;
	overlayKey = key;
	connectionRole = role;
	for (const timer of reconnectTimers.values()) clearTimeout(timer);
	reconnectTimers.clear();
	for (const socket of sockets.values()) socket.close();
	sockets.clear();
	for (const [name, channel] of channels) connect(name, channel);
}

export function bridgeOverlayChannel(channel: BroadcastChannel, name: string) {
	channels.set(name, channel);
	const originalPost = channel.postMessage.bind(channel);
	channel.postMessage = (message: unknown) => {
		originalPost(message);
		const isStateReply = Boolean(
			message && typeof message === 'object' && 'type' in message && message.type === 'fullState',
		);
		if (overlayKey && (!applyingRemoteMessage || isStateReply)) send(name, message);
	};
	const handler = channel.onmessage;
	channel.onmessage = (event) => {
		applyingRemoteMessage = true;
		try {
			handler?.call(channel, event);
		} finally {
			applyingRemoteMessage = false;
		}
	};
	if (overlayKey) connect(name, channel);
}

function connect(name: string, channel: BroadcastChannel) {
	if (
		!overlayKey ||
		sockets.get(name)?.readyState === WebSocket.OPEN ||
		sockets.get(name)?.readyState === WebSocket.CONNECTING
	)
		return;
	const credential = overlayKey;
	void fetch(`${getBackendUrl()}/support/overlay-stream-token`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'omit',
		cache: 'no-store',
		body: JSON.stringify({
			token: credential,
			role: connectionRole === 'studio' ? 'publisher' : 'viewer',
		}),
	})
		.then(async (response) => {
			if (!response.ok) throw new Error('Overlay relay unavailable');
			return (await response.json()) as { token: string };
		})
		.then(({ token }) => {
			if (overlayKey !== credential || !channels.has(name)) return;
			const url = new URL('/ws', getBackendUrl());
			url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
			url.searchParams.set('token', token);
			const socket = new WebSocket(url);
			sockets.set(name, socket);
			socket.onmessage = (event) => {
				try {
					const message = JSON.parse(String(event.data)) as WireMessage;
					if (message.type === `overlay_${name}` && message.payload) {
						applyingRemoteMessage = true;
						try {
							channel.onmessage?.(new MessageEvent('message', { data: message.payload }));
						} finally {
							applyingRemoteMessage = false;
						}
					}
				} catch {
					/* Ignore unrelated realtime events. */
				}
			};
			socket.onopen = () => {
				if (connectionRole === 'viewer') send(name, { type: 'requestState' });
				else {
					applyingRemoteMessage = true;
					try {
						channel.onmessage?.(new MessageEvent('message', { data: { type: 'requestState' } }));
					} finally {
						applyingRemoteMessage = false;
					}
				}
			};
			socket.onclose = () => {
				if (sockets.get(name) === socket) sockets.delete(name);
				if (overlayKey === credential)
					reconnectTimers.set(
						name,
						setTimeout(() => connect(name, channel), 3000),
					);
			};
		})
		.catch(() => {
			if (overlayKey === credential)
				reconnectTimers.set(
					name,
					setTimeout(() => connect(name, channel), 5000),
				);
		});
}

function send(name: string, payload: unknown) {
	if (
		connectionRole === 'viewer' &&
		(!payload ||
			typeof payload !== 'object' ||
			!('type' in payload) ||
			payload.type !== 'requestState')
	)
		return;
	const socket = sockets.get(name);
	if (socket?.readyState !== WebSocket.OPEN) return;
	let outgoing = payload;
	let imageUrl: string | null = null;
	let imageMime = 'image/png';
	if (name === 'sandy_vrm_sync' && payload && typeof payload === 'object' && 'type' in payload) {
		const message = payload as Record<string, unknown>;
		if (message.type === 'background' && message.state && typeof message.state === 'object') {
			const state = message.state as Record<string, unknown>;
			if (typeof state.imageUrl === 'string' && state.imageUrl.startsWith('data:')) {
				imageUrl = state.imageUrl;
				outgoing = { ...message, state: { ...state, imageUrl: null } };
			}
		} else if (
			message.type === 'fullState' &&
			message.background &&
			typeof message.background === 'object'
		) {
			const background = message.background as Record<string, unknown>;
			if (typeof background.imageUrl === 'string' && background.imageUrl.startsWith('data:')) {
				imageUrl = background.imageUrl;
				outgoing = { ...message, background: { ...background, imageUrl: null } };
			}
		}
	}
	socket.send(JSON.stringify({ type: `overlay_${name}`, payload: outgoing }));
	if (imageUrl) {
		const separator = imageUrl.indexOf(',');
		const header = imageUrl.slice(0, separator);
		imageMime = header.slice(5).split(';')[0] || imageMime;
		const binary = atob(imageUrl.slice(separator + 1));
		const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
		sendOverlayTransfer(
			name,
			`vrm-background-${crypto.randomUUID()}`,
			{ kind: 'vrm-background-image', mime: imageMime },
			bytes.buffer,
		);
	}
}

export function sendOverlayTransfer(
	name: string,
	transferId: string,
	meta: Record<string, unknown>,
	buffer: ArrayBuffer,
) {
	const chunkSize = 48 * 1024;
	const totalChunks = Math.ceil(buffer.byteLength / chunkSize);
	send(name, { type: 'assetTransferStart', transferId, totalChunks, meta });
	const bytes = new Uint8Array(buffer);
	for (let index = 0; index < totalChunks; index++) {
		const chunk = bytes.subarray(
			index * chunkSize,
			Math.min((index + 1) * chunkSize, bytes.length),
		);
		let binary = '';
		for (let offset = 0; offset < chunk.length; offset += 1)
			binary += String.fromCharCode(chunk[offset]);
		send(name, {
			type: 'assetTransferChunk',
			transferId,
			index,
			data: btoa(binary),
		});
	}
	send(name, { type: 'assetTransferEnd', transferId });
}
