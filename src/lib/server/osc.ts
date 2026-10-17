/**
 * Codificador nativo y ligero de OSC 1.0 para VMC Protocol (VirtualMotionCapture).
 * Sin dependencias externas.
 */

function padString(str: string): Buffer {
	const buf = Buffer.from(`${str}\0`, 'utf-8');
	const remainder = buf.length % 4;
	if (remainder === 0) return buf;
	const pad = 4 - remainder;
	return Buffer.concat([buf, Buffer.alloc(pad)]);
}

/**
 * Codifica un mensaje OSC 1.0 individual:
 * ej. /VMC/Ext/Blend/Val ["A", 0.75]
 */
export function encodeOscMessage(address: string, args: Array<string | number>): Buffer {
	const addressBuf = padString(address);

	let typeTags = ',';
	const argBuffers: Buffer[] = [];

	for (const arg of args) {
		if (typeof arg === 'string') {
			typeTags += 's';
			argBuffers.push(padString(arg));
		} else if (typeof arg === 'number') {
			typeTags += 'f';
			const floatBuf = Buffer.alloc(4);
			floatBuf.writeFloatBE(arg, 0);
			argBuffers.push(floatBuf);
		}
	}

	const typeTagsBuf = padString(typeTags);
	return Buffer.concat([addressBuf, typeTagsBuf, ...argBuffers]);
}

/**
 * Empaqueta múltiples mensajes OSC dentro de un paquete #bundle atómico.
 * Ideal para sincronizar blendshapes y emitir el Apply final en un solo datagrama UDP.
 */
export function encodeOscBundle(messages: Buffer[]): Buffer {
	const header = Buffer.from('#bundle\0', 'utf-8');
	const timetag = Buffer.alloc(8);
	timetag.writeUInt32BE(0, 0);
	timetag.writeUInt32BE(1, 4); // Ejecución inmediata

	const elements: Buffer[] = [];
	for (const msg of messages) {
		const sizeBuf = Buffer.alloc(4);
		sizeBuf.writeUInt32BE(msg.length, 0);
		elements.push(sizeBuf, msg);
	}

	return Buffer.concat([header, timetag, ...elements]);
}
