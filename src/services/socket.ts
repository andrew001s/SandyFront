// src/services/websocket.ts
interface WebSocketHandlers {
  onMessage?: (data: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onReconnectAttempt?: (attempt: number, maxAttempts: number) => void;
  onMaxRetriesExceeded?: () => void;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private url: string;
  private handlers: WebSocketHandlers = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; 
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(url: string) {
    this.url = url;
  }

  public connect(handlers: WebSocketHandlers): void {
    this.handlers = handlers;
    this.createConnection();
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  public send(message: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(message);
    } else {
      throw new Error('WebSocket connection is not open');
    }
  }

  private createConnection(): void {
    try {
      this.socket = new WebSocket(this.url);
      this.setupEventListeners();
    } catch (_error) {
      this.handleReconnect();
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

    this.socket.onclose = () => {
      this.handlers.onDisconnect?.();
      this.handleReconnect();
    };
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.handlers.onMaxRetriesExceeded?.();
      return;
    }

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.handlers.onReconnectAttempt?.(this.reconnectAttempts, this.maxReconnectAttempts);
      this.reconnectDelay *= 2; // Exponential backoff
      this.createConnection();
    }, this.reconnectDelay);
  }
}

// Singleton instance
let websocketInstance: WebSocketService | null = null;

export const getWebSocketService = (url: string): WebSocketService => {
  if (!websocketInstance) {
    websocketInstance = new WebSocketService(url);
  }
  return websocketInstance;
};
