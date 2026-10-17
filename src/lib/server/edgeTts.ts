import crypto from 'node:crypto';
import WebSocket from 'ws';

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const WIN_EPOCH = 11644473600;
const S_TO_NS = 1e9;
const CHROMIUM_FULL_VERSION = '143.0.3650.75';
const CHROMIUM_MAJOR_VERSION = '143';
const SEC_MS_GEC_VERSION = `2-${CHROMIUM_FULL_VERSION}`;

const _U32_MASK = 0xffffffff;

const _SHA256_INITIAL: number[] = [
	0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
];
const _SHA256_STATE: number[] = [
	0xfd9fbea2, 0x91243ce7, 0xbe499094, 0xcd2e1e0a, 0x6c006f49, 0x04bd35ab, 0xfeb0a7e4, 0x03effbd2,
];
const _SHA256_SCHEDULE: number[] = [
	0xeb24bf9e, 0x1558691f, 0xa0c09ee2, 0x0cfa32ba, 0xa622ee8c, 0xd1dd9491, 0xc0dd25a0, 0xf9e70ab6,
	0xf0c31573, 0x7058ce4e, 0x7188e606, 0x00e5ab33, 0xd258b060, 0x72766564,
];
const _SHA256_ROUND_CONSTANTS: number[] = [
	0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
	0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
	0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
	0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
	0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
	0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
	0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
	0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];
const _SHA256_ADJUSTMENT = 0xc9dc06a7;
const _SHA256_BLOCK_CONSTANTS: number[] = [
	..._SHA256_ROUND_CONSTANTS.slice(0, 14),
	_SHA256_ADJUSTMENT,
	..._SHA256_ROUND_CONSTANTS.slice(15),
];
const _SHA256_SIGMA0_ADJUSTMENT = 0x059c0b80;
const _SHA256_SIGMA1_ADJUSTMENT = 0x000b92c0;

const _CS64_COEFFICIENTS: Array<[number, number]> = [
	[0xe82e91b1, 0xb32700d0],
	[0x44de24c6, 0x88dff51d],
	[0x3beb65bc, 0x29514038],
	[0xc89c5933, 0xb328cbdf],
	[0x8d1ec211, 0xd405b4d5],
	[0x314ef5d5, 0x26e55f3c],
	[0xe92491b1, 0x607801c6],
	[0xf0a5b9d5, 0x82b2c1fb],
	[0x06064cf3, 0xfa51a3da],
	[0xda79fa60, 0x207cc464],
	[0xbed20560, 0x3c3c74f3],
	[0x89f9c9f8, 0xd2d14b61],
	[0x35fa38c6, 0xbb04a2c1],
	[0xcb49e3c6, 0xc5626167],
];
const _CS64_FACTOR = 0x82893933;
const _CS64_ADJUSTMENT0 = 0xf2f90b1a;
const _CS64_ADJUSTMENT1 = 0x0b1a0000;

function _rol16(v: number): number {
	const val = (v & _U32_MASK) >>> 0;
	return (((val << 16) | (val >>> 16)) & _U32_MASK) >>> 0;
}

function _words_le4_even(data: Buffer): number[] {
	const remainder = -data.length % 4;
	const padLen = remainder < 0 ? remainder + 4 : remainder;
	const padded = Buffer.concat([data, Buffer.alloc(padLen)]);
	if (padded.length === 0) return [];
	const words: number[] = [];
	for (let i = 0; i < padded.length; i += 4) {
		words.push(padded.readUInt32LE(i));
	}
	if (words.length % 2 !== 0) {
		words.push(0);
	}
	return words;
}

function _sigma0(v: number): number {
	const val = (v & _U32_MASK) >>> 0;
	return (((val >>> 7) ^ (val << 25) ^ (val >>> 18) ^ (val << 14) ^ (val >>> 3)) & _U32_MASK) >>> 0;
}

function _sigma1(v: number): number {
	const val = (v & _U32_MASK) >>> 0;
	return (
		(((val >>> 17) ^ (val << 15) ^ (val >>> 19) ^ (val << 13) ^ (val >>> 10)) & _U32_MASK) >>> 0
	);
}

const BIGINT_MASK = BigInt(0xffffffff);
const BIGINT_REPEAT = BigInt('0x100000001');
const BIGINT_6 = BigInt(6);
const BIGINT_11 = BigInt(11);
const BIGINT_25 = BigInt(25);
const BIGINT_2 = BigInt(2);
const BIGINT_13 = BigInt(13);
const BIGINT_22 = BigInt(22);

function mul32(a: number, b: number): number {
	return Number((BigInt(a >>> 0) * BigInt(b >>> 0)) & BIGINT_MASK) >>> 0;
}

function _expand_sha256_schedule(words: number[], firstWord = 16): void {
	for (let index = firstWord; index < 64; index++) {
		const x = words[index - 2] >>> 0;
		const y = words[index - 15] >>> 0;
		const s1 = _sigma1(x);
		const s0 = _sigma0(y);
		const sum =
			Number(
				(BigInt(s1) + BigInt(words[index - 7]) + BigInt(s0) + BigInt(words[index - 16])) &
					BIGINT_MASK,
			) >>> 0;
		words.push(sum);
	}
}

function _sha256_rounds(state: number[], words: number[], firstRound = 0): number[] {
	let [a, b, c, d, e, f, g, h] = state.map((x) => BigInt(x >>> 0));
	const constants = (firstRound === 14 ? _SHA256_BLOCK_CONSTANTS : _SHA256_ROUND_CONSTANTS).map(
		(x) => BigInt(x >>> 0),
	);
	const wordsBig = words.map((x) => BigInt(x >>> 0));

	for (let index = firstRound; index < 64; index++) {
		const rot_e = e * BIGINT_REPEAT;
		const rot_a = a * BIGINT_REPEAT;
		const s1 = (rot_e >> BIGINT_6) ^ (rot_e >> BIGINT_11) ^ (rot_e >> BIGINT_25);
		const ch = g ^ (e & (f ^ g));
		const t1 = h + s1 + ch + constants[index] + wordsBig[index];
		const s0 = (rot_a >> BIGINT_2) ^ (rot_a >> BIGINT_13) ^ (rot_a >> BIGINT_22);
		const maj = (a & b) | (c & (a | b));
		const t2 = s0 + maj;

		h = g;
		g = f;
		f = e;
		e = (d + t1) & BIGINT_MASK;
		d = c;
		c = b;
		b = a;
		a = (t1 + t2) & BIGINT_MASK;
	}
	return [a, b, c, d, e, f, g, h].map((x) => Number(x & BIGINT_MASK) >>> 0);
}

function _sha256_init(data: Buffer): number[] {
	const words: number[] = new Array(14).fill(0);
	const w14 = (data[0] << 16) | (data[1] << 8) | data[2];
	const w15 = ((data[3] << 24) | (data[4] << 16) | (data[5] << 8) | data[6]) >>> 0;
	words.push(w14 >>> 0, w15 >>> 0);

	for (let index = 16; index < 30; index++) {
		let value = BigInt(_SHA256_SCHEDULE[index - 16]);
		if (index - 2 >= 14) {
			const adj = index === 16 ? _SHA256_SIGMA1_ADJUSTMENT : 0;
			value += BigInt(_sigma1(words[index - 2]) ^ adj);
		}
		if (index - 7 >= 14) {
			value += BigInt(words[index - 7]);
		}
		if (index - 15 >= 14) {
			const adj = index === 29 ? _SHA256_SIGMA0_ADJUSTMENT : 0;
			value += BigInt(_sigma0(words[index - 15]) ^ adj);
		}
		words.push(Number(value & BIGINT_MASK) >>> 0);
	}

	const w30Val =
		BigInt(_sigma1(words[28])) +
		BigInt(words[23]) +
		BigInt(_sigma0(words[15])) +
		BigInt(words[14]) +
		BigInt(_SHA256_ADJUSTMENT) -
		BigInt(_SHA256_ROUND_CONSTANTS[14]);
	words.push(Number(w30Val & BIGINT_MASK) >>> 0);

	_expand_sha256_schedule(words, 31);
	const working = _sha256_rounds(_SHA256_STATE, words, 14);
	return _SHA256_INITIAL.map(
		(x, i) => Number((BigInt(x) + BigInt(working[i])) & BIGINT_MASK) >>> 0,
	);
}

function _sha256_digest(data: Buffer): Buffer {
	if (data.length < 7) throw new Error('Token salt must contain at least seven bytes');
	const length = 57 + data.length;
	const rem = (55 - length) % 64;
	const padZeroLen = rem < 0 ? rem + 64 : rem;
	const lenBuf = Buffer.alloc(8);
	lenBuf.writeBigUInt64BE(BigInt(length * 8));

	const padded = Buffer.concat([
		data.subarray(7),
		Buffer.from([0x80]),
		Buffer.alloc(padZeroLen),
		lenBuf,
	]);

	let state = _sha256_init(data.subarray(0, 7));
	for (let offset = 0; offset < padded.length; offset += 64) {
		const words: number[] = [];
		for (let i = 0; i < 64; i += 4) {
			words.push(padded.readUInt32BE(offset + i));
		}
		_expand_sha256_schedule(words);
		const working = _sha256_rounds(state, words);
		state = state.map((x, i) => Number((BigInt(x) + BigInt(working[i])) & BIGINT_MASK) >>> 0);
	}

	const digestBuf = Buffer.alloc(32);
	for (let i = 0; i < 8; i++) {
		digestBuf.writeUInt32BE(state[i], i * 4);
	}
	return digestBuf;
}

function _cs64_digest(data: Buffer, digest: Buffer): [number, number] {
	const key_a = (digest.readUInt32LE(0) | 1) >>> 0;
	const key_b = (digest.readUInt32LE(4) | 1) >>> 0;
	const factor_a = mul32(key_a, _CS64_FACTOR);
	const factor_b = mul32(key_b, _CS64_FACTOR);
	const factors = [factor_a, factor_b];

	const terms: number[] = _CS64_COEFFICIENTS.map(([coeff]) => {
		return mul32(coeff, factors[0]);
	});
	for (let i = 0; i < _CS64_COEFFICIENTS.length; i++) {
		terms[i] = mul32(_CS64_COEFFICIENTS[i][0], factors[i % 2]);
	}
	const offsets: number[] = _CS64_COEFFICIENTS.map(([, off]) => off >>> 0);

	const words = _words_le4_even(Buffer.concat([Buffer.from([0]), data]));
	for (let index = 0; index < words.length; index++) {
		const word = words[index];
		let term = mul32(word, index % 2 === 0 ? key_a : key_b);
		let offset = mul32(_rol16(word), index % 2 === 0 ? 0xef0569fb : 0xc31713db);
		if (index === 0) {
			term = ((term + mul32(_CS64_ADJUSTMENT0, factors[0])) & _U32_MASK) >>> 0;
			offset = ((offset + _CS64_ADJUSTMENT1) & _U32_MASK) >>> 0;
		}
		terms.push(term);
		offsets.push(offset);
	}

	let swap_acc = 0;
	let swap_last = 0;
	let state = 0;
	let acc = 0;

	for (let index = 0; index < terms.length; index += 2) {
		const x = terms[index];
		const y = terms[index + 1];

		let t = _rol16(((offsets[index] + x) & _U32_MASK) >>> 0);
		let q = mul32(t, 0x76f50f34);
		swap_acc = ((swap_acc + mul32(_rol16(q), 0xc3efea97) + q) & _U32_MASK) >>> 0;

		t = _rol16(((offsets[index + 1] + y) & _U32_MASK) >>> 0);
		q = mul32(t, 0x1881ce3c);
		swap_last = ((mul32(_rol16(q), 0x35bd1ec9) + q) & _U32_MASK) >>> 0;
		swap_acc = ((swap_acc + swap_last) & _U32_MASK) >>> 0;

		state = ((mul32(state, key_a) + x) & _U32_MASK) >>> 0;
		state = mul32(_rol16(state), 0xcf98b111);
		state = mul32(_rol16(state), 0x87085b9f);
		state = mul32(_rol16(state), 0x12ceb96d);
		state = mul32(_rol16(state), 0x257e1d83);
		acc = ((acc + state) & _U32_MASK) >>> 0;

		t = ((mul32(state, key_b) + y) & _U32_MASK) >>> 0;
		t = mul32(_rol16(t), 0xa27416f5);
		t = mul32(_rol16(t), 0xd38396ff);
		state = mul32(_rol16(mul32(_rol16(t), 0x7c932b89)), 0xbfa49f69);
		acc = ((acc + state) & _U32_MASK) >>> 0;
	}

	return [((swap_last ^ state) & _U32_MASK) >>> 0, ((swap_acc ^ acc) & _U32_MASK) >>> 0];
}

function generateSecMsGecV2(unixTimestamp?: number): string {
	let ticks = unixTimestamp === undefined ? Date.now() / 1000 : Number(unixTimestamp);
	ticks += WIN_EPOCH;
	ticks -= ticks % 300;
	ticks *= S_TO_NS / 100;
	const strToHash = Buffer.from(`${Math.floor(ticks)}${TRUSTED_CLIENT_TOKEN}`, 'ascii');
	const digest = _sha256_digest(strToHash);
	const [cs0, cs1] = _cs64_digest(strToHash, digest);
	const csBuf = Buffer.alloc(8);
	csBuf.writeUInt32LE(cs0, 0);
	csBuf.writeUInt32LE(cs1, 4);
	const cs64 = csBuf.toString('hex').toUpperCase();
	const sha256 = digest.toString('hex').toUpperCase();
	return `${cs64}-${sha256}`;
}

function generateMuid(): string {
	return crypto.randomBytes(16).toString('hex').toUpperCase();
}

export type EdgeSynthesizeOptions = {
	text: string;
	voice?: string;
	rate?: string;
	pitch?: string;
	timeoutMs?: number;
};

function escapeXml(unsafe: string): string {
	return unsafe
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function executeEdgeSynthesis({
	text,
	voice = 'es-ES-ElviraNeural',
	rate = '+0%',
	pitch = '+0Hz',
	timeoutMs = 10000,
}: EdgeSynthesizeOptions): Promise<Buffer> {
	const trimmedText = text.trim();
	if (!trimmedText) {
		return Promise.resolve(Buffer.alloc(0));
	}

	const connectionId = crypto.randomUUID().replace(/-/g, '');
	const secMsGec = generateSecMsGecV2();
	const muid = generateMuid();
	const url = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}&ConnectionId=${connectionId}`;

	return new Promise<Buffer>((resolve, reject) => {
		const ws = new WebSocket(url, {
			headers: {
				'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_MAJOR_VERSION}.0.0.0 Safari/537.36 Edg/${CHROMIUM_MAJOR_VERSION}.0.0.0`,
				Origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
				Cookie: `muid=${muid};`,
				'Accept-Encoding': 'gzip, deflate, br, zstd',
				'Accept-Language': 'en-US,en;q=0.9',
				Pragma: 'no-cache',
				'Cache-Control': 'no-cache',
			},
		});

		const chunks: Buffer[] = [];
		const requestId = crypto.randomUUID().replace(/-/g, '');
		let isSettled = false;

		const settle = (isSuccess: boolean, result: Buffer | Error) => {
			if (isSettled) return;
			isSettled = true;
			clearTimeout(timer);
			try {
				if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
					ws.close();
				}
			} catch {
				// Socket ya cerrado o en estado inválido
			}
			if (isSuccess) {
				resolve(result as Buffer);
			} else {
				reject(result as Error);
			}
		};

		const timer = setTimeout(() => {
			try {
				ws.terminate();
			} catch {
				// Socket ya terminado
			}
			settle(false, new Error(`Timeout de síntesis de Edge TTS tras ${timeoutMs}ms`));
		}, timeoutMs);

		ws.on('unexpected-response', (_req, res) => {
			let body = '';
			res.on('data', (chunk: Buffer) => {
				body += chunk;
			});
			res.on('end', () => {
				settle(
					false,
					new Error(
						`Edge TTS rechazó la conexión (HTTP ${res.statusCode}: ${body || res.statusMessage})`,
					),
				);
			});
		});

		ws.on('open', () => {
			const date = new Date().toUTCString();

			// 1. Enviar configuración de audio (MP3 a 24kHz)
			const configJson = JSON.stringify({
				context: {
					synthesis: {
						audio: {
							metadataoptions: {
								sentenceBoundaryEnabled: 'false',
								wordBoundaryEnabled: 'false',
							},
							outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
						},
					},
				},
			});
			const configMsg = `X-Timestamp:${date}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n${configJson}`;
			ws.send(configMsg);

			// 2. Enviar petición SSML
			const cleanText = escapeXml(trimmedText);
			const lang = voice.slice(0, 5) || 'es-ES';
			const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${lang}'><voice name='${voice}'><prosody pitch='${pitch}' rate='${rate}' volume='+0%'>${cleanText}</prosody></voice></speak>`;
			const ssmlMsg = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${date}\r\nPath:ssml\r\n\r\n${ssml}`;
			ws.send(ssmlMsg);
		});

		ws.on('message', (data: WebSocket.RawData) => {
			// ws v7 y v8 pueden entregar data como Buffer, ArrayBuffer o string
			const buf = Buffer.isBuffer(data)
				? data
				: typeof data === 'string'
					? Buffer.from(data)
					: Buffer.from(data as ArrayBuffer);

			// Las tramas binarias de audio tienen un encabezado de 2 bytes indicando la longitud de los headers de texto
			if (buf.length >= 2) {
				const headerLen = buf.readUInt16BE(0);
				if (headerLen > 0 && buf.length > 2 + headerLen) {
					const headerStr = buf.subarray(2, 2 + headerLen).toString('utf-8');
					if (headerStr.includes('Path:audio')) {
						const audioData = buf.subarray(2 + headerLen);
						if (audioData.length > 0) {
							chunks.push(audioData);
						}
						return;
					}
				}
			}

			// Tramas de texto y control
			const msgText = buf.toString('utf-8');
			if (msgText.includes('Path:turn.end')) {
				settle(true, Buffer.concat(chunks));
			}
		});

		ws.on('error', (err: unknown) => {
			settle(false, err instanceof Error ? err : new Error(String(err)));
		});

		ws.on('close', (code: number, reason: Buffer) => {
			if (chunks.length > 0) {
				settle(true, Buffer.concat(chunks));
			} else {
				settle(
					false,
					new Error(
						`Conexión cerrada prematuramente por Edge TTS (código: ${code}, motivo: ${reason?.toString() || 'desconocido'})`,
					),
				);
			}
		});
	});
}

export async function synthesizeEdgeSpeech(options: EdgeSynthesizeOptions): Promise<Buffer> {
	const maxRetries = 2;
	let lastError: unknown;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			return await executeEdgeSynthesis(options);
		} catch (err) {
			lastError = err;
			console.error(
				`[Edge TTS] Intento ${attempt}/${maxRetries} falló:`,
				err instanceof Error ? err.message : err,
			);
			if (attempt < maxRetries) {
				await new Promise((r) => setTimeout(r, 400));
			}
		}
	}

	throw lastError;
}
