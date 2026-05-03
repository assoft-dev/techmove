import type { Server as IOServer } from "socket.io";

let ioRef: IOServer | null = null;

export function setSocketIO(server: IOServer): void {
  ioRef = server;
}

export function getSocketIO(): IOServer {
  if (!ioRef) {
    throw new Error("Socket.IO ainda não foi inicializado");
  }
  return ioRef;
}
