declare module 'ws' {
	import { EventEmitter } from 'node:events';

	export class WebSocket extends EventEmitter {
		static readonly CONNECTING: 0;
		static readonly OPEN: 1;
		static readonly CLOSING: 2;
		static readonly CLOSED: 3;

		readonly readyState: number;

		constructor(
			address: string | URL,
			options?: {
				headers?: Record<string, string>;
				[key: string]: unknown;
			},
		);

		send(data: unknown, cb?: (err?: Error) => void): void;
		close(code?: number, data?: string): void;
		terminate(): void;
	}

	export namespace WebSocket {
		export type RawData = Buffer | ArrayBuffer | Buffer[];
	}

	export default WebSocket;
}
