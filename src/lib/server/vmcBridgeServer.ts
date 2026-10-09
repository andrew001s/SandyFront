import dgram from 'node:dgram';
import { encodeOscBundle, encodeOscMessage } from '@/lib/server/osc';
import WebSocket from 'ws';

import { VMC_BRIDGE_PORT } from '@/lib/avatar/constants';

interface ClientSocket {
	send(data: string): void;
	on(event: 'message', listener: (data: { toString(): string }) => void): void;
	on(event: 'close' | 'error', listener: () => void): void;
}

interface BridgeServer {
	on(event: 'connection', listener: (ws: ClientSocket) => void): void;
	close(callback?: () => void): void;
}

declare global {
	var __sandy_vmc_bridge: BridgeServer | undefined;
	var __sandy_udp_client: dgram.Socket | undefined;
}

export function startVmcBridgeServer(): void {
	if (typeof window !== 'undefined') return;
	if (globalThis.__sandy_vmc_bridge) return;

	try {
		const udp = dgram.createSocket('udp4');
		globalThis.__sandy_udp_client = udp;

		const wsAny = WebSocket as unknown as {
			WebSocketServer?: new (opts: { port: number; host: string }) => BridgeServer;
			Server?: new (opts: { port: number; host: string }) => BridgeServer;
			default?: {
				WebSocketServer?: new (opts: { port: number; host: string }) => BridgeServer;
				Server?: new (opts: { port: number; host: string }) => BridgeServer;
			};
		};
		const ServerConstructor =
			wsAny.WebSocketServer ||
			wsAny.Server ||
			wsAny.default?.WebSocketServer ||
			wsAny.default?.Server;

		if (!ServerConstructor) {
			return;
		}

		const wss = new ServerConstructor({
			port: VMC_BRIDGE_PORT,
			host: '127.0.0.1',
		});

		globalThis.__sandy_vmc_bridge = wss;

		wss.on('connection', (ws: ClientSocket) => {
			ws.on('message', (rawData: { toString(): string }) => {
				try {
					const parsed = JSON.parse(rawData.toString());
					const host = (parsed.host as string) || '127.0.0.1';
					const port = Number(parsed.port) || 39539;

					if (parsed.ping) {
						ws.send(JSON.stringify({ pong: true, timestamp: Date.now() }));
						return;
					}

					const blendshapes = parsed.blendshapes as
						| Array<{ name: string; value: number }>
						| undefined;

					if (blendshapes && blendshapes.length > 0) {
						const oscMsgs: Buffer[] = [];
						for (const bs of blendshapes) {
							oscMsgs.push(encodeOscMessage('/VMC/Ext/Blend/Val', [bs.name, Number(bs.value)]));
						}
						if (parsed.apply !== false) {
							oscMsgs.push(encodeOscMessage('/VMC/Ext/Blend/Apply', []));
						}

						const bundle = encodeOscBundle(oscMsgs);
						udp.send(bundle, 0, bundle.length, port, host);
					}
				} catch {
					// Ignorar paquetes malformados
				}
			});
		});
	} catch {
		// Ignorar fallo al inicializar puente
	}
}
