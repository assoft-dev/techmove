import bcrypt from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "../database/pool.js";
import type { Corridas, RideStatus } from "../Models/Corridas.js";

type RideRow = RowDataPacket & {
  id: number;
  clientId: number;
  driverId: number | null;
  pickupLat: unknown;
  pickupLng: unknown;
  dropLat: unknown;
  dropLng: unknown;
  price: unknown;
  status: RideStatus;
  requested_at: Date | string;
};

export type CorridaCriarInput = Pick<
  Corridas,
  "clientId" | "pickupLat" | "pickupLng" | "dropLat" | "dropLng" | "price"
> &
  Partial<Pick<Corridas, "driverId" | "status">>;

export type CorridaAtualizarInput = Partial<
  Pick<
    Corridas,
    | "clientId"
    | "driverId"
    | "pickupLat"
    | "pickupLng"
    | "dropLat"
    | "dropLng"
    | "price"
    | "status"
  >
>;

function parseDecimal(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  return parseFloat(String(v));
}

function mapRow(row: RideRow): Corridas {
  const req =
    row.requested_at instanceof Date
      ? row.requested_at
      : new Date(String(row.requested_at));
  return {
    id: Number(row.id),
    clientId: Number(row.clientId),
    driverId: row.driverId == null ? null : Number(row.driverId),
    pickupLat: parseDecimal(row.pickupLat),
    pickupLng: parseDecimal(row.pickupLng),
    dropLat: parseDecimal(row.dropLat),
    dropLng: parseDecimal(row.dropLng),
    price: parseDecimal(row.price),
    status: row.status,
    requested_at: req,
  };
}

/** Insere corrida na tabela `rides`. */
export async function guardar(input: CorridaCriarInput): Promise<Corridas> {
  const pool = getPool();
  const status = input.status ?? "requested";
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO rides (clientId, driverId, pickupLat, pickupLng, dropLat, dropLng, price, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.clientId,
      input.driverId ?? null,
      input.pickupLat,
      input.pickupLng,
      input.dropLat,
      input.dropLng,
      input.price,
      status,
    ],
  );
  const inserted = await buscar(result.insertId);
  if (!inserted) {
    throw new Error("Falha ao ler corrida após inserção");
  }
  return inserted;
}

/** Atualiza corrida por id. */
export async function atualizar(
  id: number,
  dados: CorridaAtualizarInput,
): Promise<Corridas | null> {
  const pool = getPool();
  const existing = await buscar(id);
  if (!existing) return null;

  const sets: string[] = [];
  const values: Array<string | number | Date | boolean | null> = [];

  if (dados.clientId !== undefined) {
    sets.push("`clientId` = ?");
    values.push(dados.clientId);
  }
  if (dados.driverId !== undefined) {
    sets.push("`driverId` = ?");
    values.push(dados.driverId);
  }
  if (dados.pickupLat !== undefined) {
    sets.push("`pickupLat` = ?");
    values.push(dados.pickupLat);
  }
  if (dados.pickupLng !== undefined) {
    sets.push("`pickupLng` = ?");
    values.push(dados.pickupLng);
  }
  if (dados.dropLat !== undefined) {
    sets.push("`dropLat` = ?");
    values.push(dados.dropLat);
  }
  if (dados.dropLng !== undefined) {
    sets.push("`dropLng` = ?");
    values.push(dados.dropLng);
  }
  if (dados.price !== undefined) {
    sets.push("price = ?");
    values.push(dados.price);
  }
  if (dados.status !== undefined) {
    sets.push("status = ?");
    values.push(dados.status);
  }

  if (sets.length === 0) return existing;

  values.push(id);
  await pool.execute(
    `UPDATE rides SET ${sets.join(", ")} WHERE id = ?`,
    values,
  );
  return buscar(id);
}

/** Remove corrida por id. */
export async function apagar(id: number): Promise<boolean> {
  const pool = getPool();
  const [result] = await pool.execute<ResultSetHeader>(
    "DELETE FROM rides WHERE id = ?",
    [id],
  );
  return result.affectedRows > 0;
}

/** Lista todas as corridas. */
export async function buscarTodos(): Promise<Corridas[]> {
  const pool = getPool();
  const [rows] = await pool.query<RideRow[]>(
    `SELECT id, clientId, driverId, pickupLat, pickupLng, dropLat, dropLng, price, status, requested_at
     FROM rides ORDER BY id ASC`,
  );
  return rows.map((r) => mapRow(r));
}

/** Obtém corrida por id. */
export async function buscar(id: number): Promise<Corridas | null> {
  const pool = getPool();
  const [rows] = await pool.query<RideRow[]>(
    `SELECT id, clientId, driverId, pickupLat, pickupLng, dropLat, dropLng, price, status, requested_at
     FROM rides WHERE id = ? LIMIT 1`,
    [id],
  );
  const row = rows[0];
  return row ? mapRow(row) : null;
}

/**
 * Autentica cliente (`users.role = 'client'`) e devolve a corrida mais recente
 * desse utilizador, ou null se as credenciais falharem ou não existir nenhuma corrida.
 */
export async function login(
  email: string,
  passwordPlano: string,
): Promise<Corridas | null> {
  const pool = getPool();
  const normalized = email.trim().toLowerCase();

  type UserAuthRow = RowDataPacket & { id: number; password: string };

  const [users] = await pool.query<UserAuthRow[]>(
    "SELECT id, password FROM users WHERE email = ? AND role = 'client' LIMIT 1",
    [normalized],
  );
  const u = users[0];
  if (!u) return null;

  const ok = await bcrypt.compare(passwordPlano, u.password);
  if (!ok) return null;

  const clientId = Number(u.id);

  const [rides] = await pool.query<RideRow[]>(
    `SELECT id, clientId, driverId, pickupLat, pickupLng, dropLat, dropLng, price, status, requested_at
     FROM rides WHERE clientId = ? ORDER BY requested_at DESC LIMIT 1`,
    [clientId],
  );

  const ride = rides[0];
  return ride ? mapRow(ride) : null;
}
