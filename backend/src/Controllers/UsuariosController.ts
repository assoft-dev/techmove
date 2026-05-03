import { Router } from "express";
import type { Usuarios } from "../Models/Usuarios.js";
import type { UsuarioSemPassword } from "../Repository/UsuariosRepository.js";
import * as repo from "../Repository/UsuariosRepository.js";
import { signToken } from "../lib/jwt.js";
import { created, fail, ok } from "./Helps/apiResponse.js";
import { parseIdParam } from "./Helps/parseId.js";

function semPassword(u: Usuarios): UsuarioSemPassword {
  const { password: _p, ...rest } = u;
  return rest;
}

const router = Router();

router.post("/", async (req, res) => {
  const b = req.body as Partial<repo.UsuarioCriarInput> & { password?: string };
  const passwordPlano = b.passwordPlano ?? b.password;
  if (
    !b.name ||
    !b.phone ||
    !b.email ||
    !b.role ||
    typeof passwordPlano !== "string"
  ) {
    return fail(
      res,
      "Campos obrigatórios: name, phone, email, role e password (ou passwordPlano)",
      400,
    );
  }

  try {
    const u = await repo.guardar({
      name: b.name,
      phone: b.phone,
      email: b.email,
      role: b.role,
      passwordPlano,
    });
    const publicUser = semPassword(u);
    const token = signToken({
      sub: String(u.id),
      email: u.email,
    });
    return created(res, { token, user: publicUser });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "ER_DUP_ENTRY") {
      return fail(res, "Email ou telefone já registado", 409);
    }
    console.error(e);
    return fail(res, "Erro ao criar utilizador", 500);
  }
});

router.put("/:id", async (req, res) => {
  const id = parseIdParam(req.params.id);
  if (id === null) return fail(res, "Id inválido", 400);

  const b = req.body as Partial<
    Pick<Usuarios, "name" | "phone" | "email" | "role">
  > & { password?: string; passwordPlano?: string };
  const dados: repo.UsuarioAtualizarInput = {};
  if (b.name !== undefined) dados.name = b.name;
  if (b.phone !== undefined) dados.phone = b.phone;
  if (b.email !== undefined) dados.email = b.email;
  if (b.role !== undefined) dados.role = b.role;
  const pwd = b.passwordPlano ?? b.password;
  if (pwd !== undefined) dados.passwordPlano = pwd;

  try {
    const u = await repo.atualizar(id, dados);
    if (!u) return fail(res, "Utilizador não encontrado", 404);
    return ok(res, semPassword(u));
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "ER_DUP_ENTRY") {
      return fail(res, "Email ou telefone já em uso", 409);
    }
    console.error(e);
    return fail(res, "Erro ao atualizar utilizador", 500);
  }
});

router.delete("/:id", async (req, res) => {
  const id = parseIdParam(req.params.id);
  if (id === null) return fail(res, "Id inválido", 400);

  const removed = await repo.apagar(id);
  if (!removed) return fail(res, "Utilizador não encontrado", 404);
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

  const u = await repo.login(email, passwordPlano);
  if (!u) return fail(res, "Credenciais inválidas", 401);
  const token = signToken({ sub: String(u.id), email: u.email });
  return ok(res, { token, user: u });
});

router.get("/", async (_req, res) => {
  const lista = await repo.buscarTodos();
  return ok(res, lista.map(semPassword));
});

router.get("/:id", async (req, res) => {
  const id = parseIdParam(req.params.id);
  if (id === null) return fail(res, "Id inválido", 400);

  const u = await repo.buscar(id);
  if (!u) return fail(res, "Utilizador não encontrado", 404);
  return ok(res, semPassword(u));
});

export default router;
