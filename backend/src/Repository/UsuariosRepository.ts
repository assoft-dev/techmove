import bcrypt from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "../database/pool.js";
import type { Usuarios, UserRole } from "../Models/Usuarios.js";

type UserRow = RowDataPacket & {
  id: number;
  name: string;
  phone: string;
  email: string;
  password: string;
  role: UserRole;
  created_at: Date;
};

export type UsuarioSemPassword = Omit<Usuarios, "password">;

export type UsuarioCriarInput = Pick<
  Usuarios,
  "name" | "phone" | "email" | "role"
> & {
  passwordPlano: string;
};

export type UsuarioAtualizarInput = Partial<
  Pick<Usuarios, "name" | "phone" | "email" | "role">
> & {
  passwordPlano?: string;
};

function mapRow(row: UserRow): Usuarios {
  const created =
    row.created_at instanceof Date
      ? row.created_at
      : new Date(row.created_at as string);
  return {
    id: Number(row.id),
    name: row.name,
    phone: row.phone,
    email: row.email,
    password: row.password,
    role: row.role,
    created_at: created,
  };
}

/** Insere utilizador (password em texto é guardada com hash). */
export async function guardar(input: UsuarioCriarInput): Promise<Usuarios> {
  const pool = getPool();
  const hash = await bcrypt.hash(input.passwordPlano, 12);
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO users (name, phone, email, password, role)
     VALUES (?, ?, ?, ?, ?)`,
    [input.name, input.phone, input.email.trim().toLowerCase(), hash, input.role],
  );
  const inserted = await buscar(result.insertId);
  if (!inserted) {
    throw new Error("Falha ao ler utilizador após inserção");
  }
  return inserted;
}

/** Atualiza por id; campos omitidos mantêm-se. `passwordPlano` opcional gera novo hash. */
export async function atualizar(
  id: number,
  dados: UsuarioAtualizarInput,
): Promise<Usuarios | null> {
  const pool = getPool();
  const existing = await buscar(id);
  if (!existing) return null;

  const sets: string[] = [];
  const values: Array<string | number | Date | boolean | null> = [];

  if (dados.name !== undefined) {
    sets.push("name = ?");
    values.push(dados.name);
  }
  if (dados.phone !== undefined) {
    sets.push("phone = ?");
    values.push(dados.phone);
  }
  if (dados.email !== undefined) {
    sets.push("email = ?");
    values.push(dados.email.trim().toLowerCase());
  }
  if (dados.role !== undefined) {
    sets.push("role = ?");
    values.push(dados.role);
  }
  if (dados.passwordPlano !== undefined) {
    sets.push("password = ?");
    values.push(await bcrypt.hash(dados.passwordPlano, 12));
  }

  if (sets.length === 0) {
    return existing;
  }

  values.push(id);
  await pool.execute(
    `UPDATE users SET ${sets.join(", ")} WHERE id = ?`,
    values,
  );
  return buscar(id);
}

/** Remove utilizador por id. Devolve true se uma linha foi apagada. */
export async function apagar(id: number): Promise<boolean> {
  const pool = getPool();
  const [result] = await pool.execute<ResultSetHeader>(
    "DELETE FROM users WHERE id = ?",
    [id],
  );
  return result.affectedRows > 0;
}

/** Lista todos os utilizadores (inclui hash de password; não expor em API pública). */
export async function buscarTodos(): Promise<Usuarios[]> {
  const pool = getPool();
  const [rows] = await pool.query<UserRow[]>(
    "SELECT id, name, phone, email, password, role, created_at FROM users ORDER BY id ASC",
  );
  return rows.map((r) => mapRow(r));
}

/** Obtém um utilizador por id. */
export async function buscar(id: number): Promise<Usuarios | null> {
  const pool = getPool();
  const [rows] = await pool.query<UserRow[]>(
    "SELECT id, name, phone, email, password, role, created_at FROM users WHERE id = ? LIMIT 1",
    [id],
  );
  const row = rows[0];
  return row ? mapRow(row) : null;
}

/**
 * Autentica por email + password em texto.
 * Devolve dados públicos (sem password) ou null se falhar.
 */
export async function login(
  email: string,
  passwordPlano: string,
): Promise<UsuarioSemPassword | null> {
  const pool = getPool();
  const normalized = email.trim().toLowerCase();
  const [rows] = await pool.query<UserRow[]>(
    "SELECT id, name, phone, email, password, role, created_at FROM users WHERE email = ? LIMIT 1",
    [normalized],
  );
  const row = rows[0];
  if (!row) return null;

  const ok = await bcrypt.compare(passwordPlano, row.password);
  if (!ok) return null;

  const u = mapRow(row);
  return {
    id: u.id,
    name: u.name,
    phone: u.phone,
    email: u.email,
    role: u.role,
    created_at: u.created_at,
  };
}
