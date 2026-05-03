import type { Corridas } from "../Models/Corridas.js";
import { getSocketIO } from "./instance.js";

/** Notifica clientes/motoristas na sala `ride:{id}` sobre alterações à corrida. */
export function emitCorridaAtualizada(corrida: Corridas): void {
  try {
    const io = getSocketIO();
    io.to(`ride:${corrida.id}`).emit("corrida:atualizada", { corrida });
  } catch (e) {
    console.warn("[socket] emit corrida:atualizada", e);
  }
}
