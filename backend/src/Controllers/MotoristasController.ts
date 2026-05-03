import { Router } from "express";
import * as repo from "../Repository/MotoristasRepository.js";
import { created, fail, ok } from "./Helps/apiResponse.js";
import { parseIdParam } from "./Helps/parseId.js";

const router = Router();

router.post("/", async (req, res) => {
  const b = req.body as Partial<repo.MotoristaCriarInput>;
  if (b.userId === undefined || !b.plate || !b.carModel) {
    return fail(res, "Campos obrigatórios: userId, plate, carModel", 400);
  }

  try {
    const input: repo.MotoristaCriarInput = {
      userId: Number(b.userId),
      plate: String(b.plate),
      carModel: String(b.carModel),
    };
    if (b.status !== undefined) input.status = b.status;
    if (b.lat !== undefined) input.lat = Number(b.lat);
    if (b.lng !== undefined) input.lng = Number(b.lng);

    const m = await repo.guardar(input);
    return created(res, m);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "ER_DUP_ENTRY") {
      return fail(res, "Matrícula ou vínculo duplicado", 409);
    }
    console.error(e);
    return fail(res, "Erro ao criar motorista", 500);
  }
});

router.put("/:id", async (req, res) => {
  const id = parseIdParam(req.params.id);
  if (id === null) return fail(res, "Id inválido", 400);

  const b = req.body as repo.MotoristaAtualizarInput;
  const dados: repo.MotoristaAtualizarInput = {};
  if (b.userId !== undefined) dados.userId = Number(b.userId);
  if (b.plate !== undefined) dados.plate = b.plate;
  if (b.carModel !== undefined) dados.carModel = b.carModel;
  if (b.status !== undefined) dados.status = b.status;
  if (b.lat !== undefined) dados.lat = b.lat === null ? null : Number(b.lat);
  if (b.lng !== undefined) dados.lng = b.lng === null ? null : Number(b.lng);

  try {
    const m = await repo.atualizar(id, dados);
    if (!m) return fail(res, "Motorista não encontrado", 404);
    return ok(res, m);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "ER_DUP_ENTRY") {
      return fail(res, "Matrícula ou vínculo duplicado", 409);
    }
    console.error(e);
    return fail(res, "Erro ao atualizar motorista", 500);
  }
});

router.delete("/:id", async (req, res) => {
  const id = parseIdParam(req.params.id);
  if (id === null) return fail(res, "Id inválido", 400);

  const removed = await repo.apagar(id);
  if (!removed) return fail(res, "Motorista não encontrado", 404);
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

  const m = await repo.login(email, passwordPlano);
  if (!m) return fail(res, "Credenciais inválidas", 401);
  return ok(res, m);
});

router.get("/", async (_req, res) => {
  const lista = await repo.buscarTodos();
  return ok(res, lista);
});

router.get("/:id", async (req, res) => {
  const id = parseIdParam(req.params.id);
  if (id === null) return fail(res, "Id inválido", 400);

  const m = await repo.buscar(id);
  if (!m) return fail(res, "Motorista não encontrado", 404);
  return ok(res, m);
});

export default router;
