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

export async function synthesizeEdgeSpeech({
	text,
	voice = 'es-ES-ElviraNeural',
	rate = '+0%',
	pitch = '+0Hz',
	timeoutMs = 15000,
}: EdgeSynthesizeOptions): Promise<Buffer> {
	const trimmedText = text.trim();
	if (!trimmedText) {
		return Buffer.alloc(0);
	}

	const connectionId = crypto.randomUUID().replace(/-/g, '');
	const secMsGec = generateSecMsGec();
	const url = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}&ConnectionId=${connectionId}`;

	return new Promise<Buffer>((resolve, reject) => {
		const ws = new WebSocket(url, {
			headers: {
				'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_MAJOR_VERSION}.0.0.0 Safari/537.36 Edg/${CHROMIUM_MAJOR_VERSION}.0.0.0`,
				Origin: 'chrome-extension://jdiccldimpdaibmpdkgikdelajnnfcfa',
				'Accept-Encoding': 'gzip, deflate, br, zstd',
				'Accept-Language': 'en-US,en;q=0.9',
				Pragma: 'no-cache',
				'Cache-Control': 'no-cache',
			},
		});

		const chunks: Buffer[] = [];
		const requestId = crypto.randomUUID().replace(/-/g, '');

		const timer = setTimeout(() => {
			ws.terminate();
			reject(new Error(`Timeout de síntesis de Edge TTS tras ${timeoutMs}ms`));
		}, timeoutMs);

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

		ws.on('message', (data: WebSocket.RawData, isBinary: boolean) => {
			if (!isBinary) {
				const msgText = data.toString('utf-8');
				if (msgText.includes('Path:turn.end')) {
					clearTimeout(timer);
					ws.close();
					resolve(Buffer.concat(chunks));
				}
			} else {
				const buf = Buffer.from(data as Buffer);
				if (buf.length >= 2) {
					const headerLen = buf.readUInt16BE(0);
					if (buf.length > 2 + headerLen) {
						const headerStr = buf.subarray(2, 2 + headerLen).toString('utf-8');
						if (headerStr.includes('Path:audio')) {
							const audioData = buf.subarray(2 + headerLen);
							chunks.push(audioData);
						}
					}
				}
			}
		});

		ws.on('error', (err: unknown) => {
			clearTimeout(timer);
			reject(err);
		});

		ws.on('close', () => {
			clearTimeout(timer);
		});
	});
}
