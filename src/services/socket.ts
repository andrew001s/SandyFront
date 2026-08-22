// src/services/socket.ts
import { getBackendWsUrl } from '@/api/backendClient';
import { fetchStreamToken } from '@/api/streamToken';

/** Código con el que el backend cierra `/ws` si el token falta, es inválido o venció. */
export const WS_AUTH_CLOSE_CODE = 1008;

export type StreamTokenProvider = () => Promise<string>;

/** Pide un token efímero usando la sesión de Clerk del navegador. */
export const defaultStreamTokenProvider: StreamTokenProvider = async () => {
	const { token } = await fetchStreamToken();
	return token;
};

export const getDefaultWebSocketUrl = () => `${getBackendWsUrl()}/ws`;

interface WebSocketHandlers {
	onMessage?: (data: string) => void;
	onConnect?: () => void;
	onDisconnect?: (event: CloseEvent) => void;
	onReconnectAttempt?: (attempt: number, maxAttempts: number) => void;
	onMaxRetriesExceeded?: () => void;
	/** Se dispara cuando el servidor cierra con 1008 (token ausente, inválido o vencido). */
	onAuthError?: () => void;
}

class WebSocketService {
	private socket: WebSocket | null = null;
	private url: string;
	private handlers: WebSocketHandlers = {};
	private getStreamToken: StreamTokenProvider = defaultStreamTokenProvider;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectDelay = 1000;
	private reconnectTimeout: NodeJS.Timeout | null = null;
	private isConnecting = false;
	private closedByClient = false;

	constructor(url: string) {
		this.url = url;
	}

	public connect(handlers: WebSocketHandlers, getStreamToken?: StreamTokenProvider): void {
		this.handlers = handlers;
		if (getStreamToken) {
			this.getStreamToken = getStreamToken;
		}
		this.closedByClient = false;

		if (this.isConnecting) {
			return;
		}
		if (
			this.socket &&
			(this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)
		) {
			return;
		}
		void this.createConnection();
	}

	public disconnect(): void {
		this.closedByClient = true;
		this.clearReconnectTimeout();
		if (this.socket) {
			this.socket.close();
			this.socket = null;
		}
	}

	public send(message: string): void {
		if (this.socket?.readyState === WebSocket.OPEN) {
			this.socket.send(message);
		} else {
			throw new Error('WebSocket connection is not open');
		}
	}

	private buildUrl(token: string): string {
		const separator = this.url.includes('?') ? '&' : '?';
		return `${this.url}${separator}token=${encodeURIComponent(token)}`;
	}

	private async createConnection(): Promise<void> {
		if (this.isConnecting) {
			return;
		}
		if (
			this.socket &&
			(this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)
		) {
			return;
		}

		this.isConnecting = true;
		try {
			// El token solo se valida al abrir la conexión, así que se pide uno fresco
			// en cada intento en lugar de reutilizar uno guardado (vencería a los 300s).
			const token = await this.getStreamToken();
			if (this.closedByClient) {
				return;
			}
			this.socket = new WebSocket(this.buildUrl(token));
			this.setupEventListeners();
		} catch {
			this.handleReconnect();
		} finally {
			this.isConnecting = false;
		}
	}

	private setupEventListeners(): void {
		if (!this.socket) return;

		this.socket.onopen = () => {
			this.reconnectAttempts = 0;
			this.reconnectDelay = 1000;
			this.handlers.onConnect?.();
		};

		this.socket.onmessage = (event) => {
			this.handlers.onMessage?.(event.data);
		};

		this.socket.onclose = (event) => {
			this.socket = null;
			this.handlers.onDisconnect?.(event);

			if (this.closedByClient) {
				return;
			}

			if (event.code === WS_AUTH_CLOSE_CODE) {
				this.handlers.onAuthError?.();
			}

			this.handleReconnect();
		};
	}

	private clearReconnectTimeout(): void {
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}
	}

	private handleReconnect(): void {
		if (this.reconnectTimeout) {
			return;
		}

		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			this.handlers.onMaxRetriesExceeded?.();
			return;
		}

		this.reconnectTimeout = setTimeout(() => {
			this.reconnectTimeout = null;
			this.reconnectAttempts++;
			this.handlers.onReconnectAttempt?.(this.reconnectAttempts, this.maxReconnectAttempts);
			this.reconnectDelay *= 2; // Exponential backoff
			void this.createConnection();
		}, this.reconnectDelay);
	}
}

const websocketInstances = new Map<string, WebSocketService>();

export const getWebSocketService = (url: string = getDefaultWebSocketUrl()): WebSocketService => {
	const normalizedUrl = url.trim();
	const existingInstance = websocketInstances.get(normalizedUrl);

	if (existingInstance) {
		return existingInstance;
	}

	const websocketInstance = new WebSocketService(normalizedUrl);
	websocketInstances.set(normalizedUrl, websocketInstance);
	return websocketInstance;
};
