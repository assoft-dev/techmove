import { io, type Socket } from "socket.io-client";
import { getBaseUrl } from "./apiClient.js";

let socket: Socket | null = null;
let lastToken: string | null = null;

/** Mantém uma única ligação Socket.IO por token (reconecta se o token mudar). */
export function ensureSocket(token: string): Socket {
  if (!socket || lastToken !== token) {
    socket?.disconnect();
    socket = io(getBaseUrl(), {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    lastToken = token;
  }
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
  lastToken = null;
}

export function getSocketIfConnected(): Socket | null {
  return socket?.connected ? socket : null;
}
