import crypto from 'node:crypto';
import WebSocket from 'ws';

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const WIN_EPOCH = BigInt(11644473600);
const CHROMIUM_FULL_VERSION = '143.0.3650.75';
const CHROMIUM_MAJOR_VERSION = '143';
const SEC_MS_GEC_VERSION = `1-${CHROMIUM_FULL_VERSION}`;

export type EdgeSynthesizeOptions = {
	text: string;
	voice?: string;
	rate?: string;
	pitch?: string;
	timeoutMs?: number;
};

function generateSecMsGec(): string {
	const unixSeconds = BigInt(Math.floor(Date.now() / 1000));
	const ticksPerSecond = BigInt(10000000);
	const window = BigInt(300) * ticksPerSecond; // Ventana de 5 minutos
	let ticks = (unixSeconds + WIN_EPOCH) * ticksPerSecond;
	ticks -= ticks % window;
	const strToHash = `${ticks}${TRUSTED_CLIENT_TOKEN}`;
	return crypto.createHash('sha256').update(strToHash, 'ascii').digest('hex').toUpperCase();
}

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
	const secMsGec = generateSecMsGec();
	const url = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}&ConnectionId=${connectionId}`;

	return new Promise<Buffer>((resolve, reject) => {
		const ws = new WebSocket(url, {
			headers: {
				'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_MAJOR_VERSION}.0.0.0 Safari/537.36 Edg/${CHROMIUM_MAJOR_VERSION}.0.0.0`,
				Origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
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
			res.on('data', (chunk) => {
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
