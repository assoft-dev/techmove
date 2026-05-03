import type { Corridas } from "../Models/Corridas.js";
import * as motoristasRepo from "../Repository/MotoristasRepository.js";
import { getSocketIO } from "../socket/instance.js";

const MAX_MOTORISTAS_NOTIFICAR = 15;

/**
 * Notifica por Socket.IO os motoristas disponíveis mais próximos do ponto de recolha.
 */
export async function notifyMotoristasProximos(corrida: Corridas): Promise<void> {
  if (corrida.status !== "requested") return;

  let io;
  try {
    io = getSocketIO();
  } catch {
    return;
  }

  const candidatos = await motoristasRepo.buscarDisponiveisPorProximidade(
    corrida.pickupLat,
    corrida.pickupLng,
    MAX_MOTORISTAS_NOTIFICAR,
  );

  for (const m of candidatos) {
    io.to(`driver:${m.id}`).emit("corrida:solicitada", { corrida });
  }
}
