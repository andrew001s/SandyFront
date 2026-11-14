import { getBackendUrl } from '@/api/backendClient';

type WireMessage = { type: string; payload?: unknown };
const channels = new Map<string, BroadcastChannel>();
const sockets = new Map<string, WebSocket>();
const reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();
let overlayKey = '';

export function connectOverlayRealtime(key: string) {
	if (!key || key === overlayKey) return;
	overlayKey = key;
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
		if (overlayKey) send(name, message);
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
		body: JSON.stringify({ token: credential }),
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
					if (message.type === `overlay_${name}` && message.payload)
						channel.onmessage?.(new MessageEvent('message', { data: message.payload }));
				} catch {
					/* Ignore unrelated realtime events. */
				}
			};
			socket.onopen = () => {
				send(name, { type: 'requestState' });
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
	const socket = sockets.get(name);
	if (socket?.readyState === WebSocket.OPEN)
		socket.send(JSON.stringify({ type: `overlay_${name}`, payload }));
}
