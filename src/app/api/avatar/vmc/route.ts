import dgram from 'node:dgram';
import { encodeOscBundle, encodeOscMessage } from '@/lib/server/osc';
import { startVmcBridgeServer } from '@/lib/server/vmcBridgeServer';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

let cachedSocket: dgram.Socket | null = null;

function getUdpSocket(): dgram.Socket {
	if (!cachedSocket) {
		cachedSocket = dgram.createSocket('udp4');
	}
	return cachedSocket;
}

export async function POST(req: NextRequest) {
	try {
		startVmcBridgeServer();

		const body = await req.json();
		const { host = '127.0.0.1', port = 39539, blendshapes, ping = false, apply = true } = body;

		if (ping) {
			return NextResponse.json({ ok: true, status: 'vmc_ready' });
		}

		if (!Array.isArray(blendshapes) || blendshapes.length === 0) {
			return NextResponse.json({ error: 'Parámetro blendshapes requerido' }, { status: 400 });
		}

		const oscMsgs: Buffer[] = [];
		for (const bs of blendshapes) {
			if (typeof bs.name === 'string' && typeof bs.value === 'number') {
				oscMsgs.push(encodeOscMessage('/VMC/Ext/Blend/Val', [bs.name, Number(bs.value)]));
			}
		}

		if (apply) {
			oscMsgs.push(encodeOscMessage('/VMC/Ext/Blend/Apply', []));
		}

		const bundle = encodeOscBundle(oscMsgs);
		const socket = getUdpSocket();

		await new Promise<void>((resolve, reject) => {
			socket.send(bundle, 0, bundle.length, Number(port), host, (err) => {
				if (err) reject(err);
				else resolve();
			});
		});

		return NextResponse.json({ ok: true, sent: oscMsgs.length });
	} catch (err) {
		return NextResponse.json(
			{
				error: err instanceof Error ? err.message : 'Error enviando datagrama VMC',
			},
			{ status: 500 },
		);
	}
}
