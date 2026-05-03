import { Router } from "express";
import { notifyMotoristasProximos } from "../services/corridaNotify.js";
import { emitCorridaAtualizada } from "../socket/emitRide.js";
import * as repo from "../Repository/CorridasRepository.js";
import { created, fail, ok } from "./Helps/apiResponse.js";
import { parseIdParam } from "./Helps/parseId.js";

function num(v: unknown): number | undefined {
  if (v === undefined || v === null) return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

const router = Router();

router.post("/", async (req, res) => {
  const b = req.body as Partial<repo.CorridaCriarInput>;
  const clientId = num(b.clientId);
  const pickupLat = num(b.pickupLat);
  const pickupLng = num(b.pickupLng);
  const dropLat = num(b.dropLat);
  const dropLng = num(b.dropLng);
  const price = num(b.price);

  if (
    clientId === undefined ||
    pickupLat === undefined ||
    pickupLng === undefined ||
    dropLat === undefined ||
    dropLng === undefined ||
    price === undefined
  ) {
    return fail(
      res,
      "Campos obrigatórios: clientId, pickupLat, pickupLng, dropLat, dropLng, price",
      400,
    );
  }

  const input: repo.CorridaCriarInput = {
    clientId,
    pickupLat,
    pickupLng,
    dropLat,
    dropLng,
    price,
  };
  if (b.driverId !== undefined) {
    input.driverId = b.driverId === null ? null : Number(b.driverId);
  }
  if (b.status !== undefined) input.status = b.status;

  try {
    const c = await repo.guardar(input);
    void notifyMotoristasProximos(c).catch((err) =>
      console.error("[corrida] notify motoristas", err),
    );
    return created(res, c);
  } catch (e) {
    console.error(e);
    return fail(res, "Erro ao criar corrida", 500);
  }
});

router.put("/:id", async (req, res) => {
  const id = parseIdParam(req.params.id);
  if (id === null) return fail(res, "Id inválido", 400);

  const b = req.body as repo.CorridaAtualizarInput;
  const dados: repo.CorridaAtualizarInput = {};
  if (b.clientId !== undefined) dados.clientId = Number(b.clientId);
  if (b.driverId !== undefined) {
    dados.driverId = b.driverId === null ? null : Number(b.driverId);
  }
  if (b.pickupLat !== undefined) {
    const v = num(b.pickupLat);
    if (v === undefined) return fail(res, "pickupLat inválido", 400);
    dados.pickupLat = v;
  }
  if (b.pickupLng !== undefined) {
    const v = num(b.pickupLng);
    if (v === undefined) return fail(res, "pickupLng inválido", 400);
    dados.pickupLng = v;
  }
  if (b.dropLat !== undefined) {
    const v = num(b.dropLat);
    if (v === undefined) return fail(res, "dropLat inválido", 400);
    dados.dropLat = v;
  }
  if (b.dropLng !== undefined) {
    const v = num(b.dropLng);
    if (v === undefined) return fail(res, "dropLng inválido", 400);
    dados.dropLng = v;
  }
  if (b.price !== undefined) {
    const v = num(b.price);
    if (v === undefined) return fail(res, "price inválido", 400);
    dados.price = v;
  }
  if (b.status !== undefined) dados.status = b.status;

  try {
    const c = await repo.atualizar(id, dados);
    if (!c) return fail(res, "Corrida não encontrada", 404);
    emitCorridaAtualizada(c);
    return ok(res, c);
  } catch (e) {
    console.error(e);
    return fail(res, "Erro ao atualizar corrida", 500);
  }
});

router.delete("/:id", async (req, res) => {
  const id = parseIdParam(req.params.id);
  if (id === null) return fail(res, "Id inválido", 400);

  const removed = await repo.apagar(id);
  if (!removed) return fail(res, "Corrida não encontrada", 404);
  return ok(res, { id, removido: true });
});

router.post("/login", async (req, res) => {
  const body = req.body as {
    email?: string;
    password?: string;
    passwordPlano?: string;
  };
  const email = body.email;
  const passwordPlano = body.passwordPlano ?? body.password ?? "";
  if (!email || !passwordPlano) {
    return fail(res, "email e password são obrigatórios", 400);
  }

  const c = await repo.login(email, passwordPlano);
  if (!c) {
    return fail(
      res,
      "Credenciais inválidas ou sem corridas registadas",
      401,
    );
  }
  return ok(res, c);
});

router.get("/", async (_req, res) => {
  const lista = await repo.buscarTodos();
  return ok(res, lista);
});

router.get("/:id", async (req, res) => {
  const id = parseIdParam(req.params.id);
  if (id === null) return fail(res, "Id inválido", 400);

  const c = await repo.buscar(id);
  if (!c) return fail(res, "Corrida não encontrada", 404);
  return ok(res, c);
});

export default router;
