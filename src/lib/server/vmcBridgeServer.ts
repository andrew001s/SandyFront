import dgram from 'node:dgram';
import { VMC_BRIDGE_PORT } from '@/lib/avatar/constants';
import { encodeOscBundle, encodeOscMessage, parseOscBlendshape } from '@/lib/server/osc';
import WebSocket from 'ws';

// biome-ignore lint/suspicious/noExplicitAny: ws typing bridge
type WsClient = any;
// biome-ignore lint/suspicious/noExplicitAny: ws typing bridge
type WsServerInstance = any;

// Soporta entornos Node ESM y CommonJS para instanciar WebSocketServer
const WebSocketServerConstructor =
	(WebSocket as unknown as { WebSocketServer?: new (...args: unknown[]) => WsServerInstance })
		.WebSocketServer ||
	(WebSocket as unknown as { Server?: new (...args: unknown[]) => WsServerInstance }).Server ||
	(WebSocket as unknown as new (
		...args: unknown[]
	) => WsServerInstance);

const discoveredBlendshapes = new Set<string>();

export function getDiscoveredBlendshapes(): string[] {
	return Array.from(discoveredBlendshapes);
}

declare global {
	var __sandy_vmc_bridge: WsServerInstance | undefined;
	var __sandy_udp_client: dgram.Socket | undefined;
	var __sandy_vmc_receiver: dgram.Socket | undefined;
}

export function startVmcBridgeServer(): void {
	if (typeof window !== 'undefined') return;
	if (globalThis.__sandy_vmc_bridge) return;

	try {
		// Socket UDP emisor para VSeeFace (por defecto hacia 127.0.0.1:39539)
		const udp = dgram.createSocket('udp4');
		globalThis.__sandy_udp_client = udp;

		// Socket UDP receptor pasivo para descubrir blendshapes si VSeeFace tiene VMC Out activo (39540)
		try {
			const receiver = dgram.createSocket('udp4');
			globalThis.__sandy_vmc_receiver = receiver;
			receiver.on('message', (msg) => {
				const bs = parseOscBlendshape(msg);
				if (bs?.name) {
					discoveredBlendshapes.add(bs.name);
				}
			});
			receiver.bind(39540, '127.0.0.1', () => {
				// biome-ignore lint/suspicious/noConsole: server init logging
				console.log('[VMC Bridge] Receptor VMC Out escuchando en 127.0.0.1:39540');
			});
		} catch {
			// Puerto 39540 ocupado o no disponible
		}

		// Servidor WebSocket local de ultra-baja latencia (<1ms)
		const wss = new WebSocketServerConstructor({
			port: VMC_BRIDGE_PORT,
		});

		globalThis.__sandy_vmc_bridge = wss;
		// biome-ignore lint/suspicious/noConsole: server init logging
		console.log(`[VMC Bridge] Servidor WebSocket activo en ws://127.0.0.1:${VMC_BRIDGE_PORT}`);

		wss.on('connection', (ws: WsClient) => {
			ws.on('message', (rawData: { toString(): string }) => {
				try {
					const parsed = JSON.parse(rawData.toString());
					const host = (parsed.host as string) || '127.0.0.1';
					const port = Number(parsed.port) || 39539;

					if (parsed.ping) {
						ws.send(JSON.stringify({ pong: true, timestamp: Date.now() }));
						return;
					}

					if (parsed.getBlendshapes || parsed.type === 'get_blendshapes') {
						ws.send(
							JSON.stringify({
								type: 'blendshapes',
								blendshapes: Array.from(discoveredBlendshapes),
							}),
						);
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
	} catch (err) {
		console.error('[VMC Bridge] Error iniciando servidor:', err);
	}
}
