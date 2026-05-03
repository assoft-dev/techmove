import type { Server as HttpServer } from "node:http";
import { Server as IOServer } from "socket.io";
import { verifyToken } from "../lib/jwt.js";
import * as corridasRepo from "../Repository/CorridasRepository.js";
import * as motoristasRepo from "../Repository/MotoristasRepository.js";
import { setSocketIO } from "./instance.js";

export function attachSocketIO(httpServer: HttpServer): IOServer {
  const io = new IOServer(httpServer, {
    cors: { origin: true, credentials: true },
  });

  io.use((socket, next) => {
    const token =
      typeof socket.handshake.auth.token === "string"
        ? socket.handshake.auth.token
        : undefined;
    if (!token) {
      next(new Error("Token JWT ausente no handshake"));
      return;
    }
    try {
      const payload = verifyToken(token);
      const uid = Number(payload.sub);
      if (!Number.isFinite(uid)) {
        next(new Error("Token JWT inválido (sub)"));
        return;
      }
      socket.data.userId = uid;
      next();
    } catch {
      next(new Error("Token JWT inválido"));
    }
  });

  io.on("connection", (socket) => {
    console.info(`Socket.IO autenticado: ${socket.id} user=${socket.data.userId}`);
    socket.emit("ready", { ok: true });

    socket.on("ping", (cb) => {
      if (typeof cb === "function") cb("pong");
    });

    socket.on(
      "driver:join",
      async (
        payload: { driverId?: unknown },
        cb?: (r: { ok: boolean; error?: string }) => void,
      ) => {
        const driverId =
          typeof payload?.driverId === "number"
            ? payload.driverId
            : Number(payload?.driverId);
        if (!Number.isFinite(driverId)) {
          cb?.({ ok: false, error: "driverId inválido" });
          return;
        }
        const row = await motoristasRepo.buscar(driverId);
        const uid = socket.data.userId;
        if (!row || row.userId !== uid) {
          cb?.({ ok: false, error: "Motorista não autorizado" });
          return;
        }
        await socket.join(`driver:${driverId}`);
        cb?.({ ok: true });
      },
    );

    socket.on(
      "ride:join",
      async (
        payload: { rideId?: unknown },
        cb?: (r: { ok: boolean; error?: string }) => void,
      ) => {
        const rideId =
          typeof payload?.rideId === "number"
            ? payload.rideId
            : Number(payload?.rideId);
        if (!Number.isFinite(rideId)) {
          cb?.({ ok: false, error: "rideId inválido" });
          return;
        }
        const ride = await corridasRepo.buscar(rideId);
        if (!ride) {
          cb?.({ ok: false, error: "Corrida não encontrada" });
          return;
        }
        const uid = socket.data.userId as number;
        if (ride.clientId === uid) {
          await socket.join(`ride:${rideId}`);
          cb?.({ ok: true });
          return;
        }
        const motorista = await motoristasRepo.buscarPorUserId(uid);
        if (motorista && ride.driverId === motorista.id) {
          await socket.join(`ride:${rideId}`);
          cb?.({ ok: true });
          return;
        }
        cb?.({ ok: false, error: "Sem permissão para esta corrida" });
      },
    );

    socket.on(
      "driver:location",
      async (
        payload: { rideId?: unknown; lat?: unknown; lng?: unknown },
        cb?: (r: { ok: boolean; error?: string }) => void,
      ) => {
        const rideId =
          typeof payload?.rideId === "number"
            ? payload.rideId
            : Number(payload?.rideId);
        const lat =
          typeof payload?.lat === "number"
            ? payload.lat
            : Number(payload?.lat);
        const lng =
          typeof payload?.lng === "number"
            ? payload.lng
            : Number(payload?.lng);
        if (
          !Number.isFinite(rideId) ||
          !Number.isFinite(lat) ||
          !Number.isFinite(lng)
        ) {
          cb?.({ ok: false, error: "Coordenadas inválidas" });
          return;
        }
        const uid = socket.data.userId as number;
        const motorista = await motoristasRepo.buscarPorUserId(uid);
        if (!motorista) {
          cb?.({ ok: false, error: "Perfil motorista não encontrado" });
          return;
        }
        const ride = await corridasRepo.buscar(rideId);
        if (!ride || ride.driverId !== motorista.id) {
          cb?.({ ok: false, error: "Corrida não atribuída a este motorista" });
          return;
        }
        if (ride.status !== "accepted" && ride.status !== "in_progress") {
          cb?.({
            ok: false,
            error: "Corrida não está ativa para rastreamento",
          });
          return;
        }
        await motoristasRepo.atualizar(motorista.id, { lat, lng });
        io.to(`ride:${rideId}`).emit("driver:location", {
          rideId,
          lat,
          lng,
          driverId: motorista.id,
        });
        cb?.({ ok: true });
      },
    );
  });

  setSocketIO(io);
  return io;
}
