// src/services/websocket.ts
export const createWebSocket = (url: string): WebSocket => {
  const socket = new WebSocket(url);

  socket.onopen = () => {
    console.log("✅ WebSocket conectado");
  };

  socket.onerror = (error) => {
    console.error("❌ WebSocket error:", error);
  };

  socket.onclose = (event) => {
    console.log("🔌 WebSocket cerrado", event.reason);
  };

  return socket;
};
