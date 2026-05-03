import bcrypt from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "../database/pool.js";
import { haversineKm } from "../lib/geo.js";
import type { DriverStatus, Motoristas } from "../Models/Motoristas.js";

type DriverRecord = {
  id: number;
  userId: number;
  plate: string;
  carModel: string;
  status: DriverStatus;
  lat: unknown;
  lng: unknown;
};

type DriverRow = RowDataPacket & DriverRecord;

export type MotoristaCriarInput = Pick<
  Motoristas,
  "userId" | "plate" | "carModel"
> &
  Partial<Pick<Motoristas, "status" | "lat" | "lng">>;

export type MotoristaAtualizarInput = Partial<
  Pick<
    Motoristas,
    "userId" | "plate" | "carModel" | "status" | "lat" | "lng"
  >
>;

function parseDecimal(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  return parseFloat(String(v));
}

function mapRow(row: DriverRecord): Motoristas {
  return {
    id: Number(row.id),
    userId: Number(row.userId),
    plate: row.plate,
    carModel: row.carModel,
    status: row.status,
    lat: row.lat == null ? null : parseDecimal(row.lat),
    lng: row.lng == null ? null : parseDecimal(row.lng),
  };
}

/** Insere motorista na tabela `drivers`. */
export async function guardar(input: MotoristaCriarInput): Promise<Motoristas> {
  const pool = getPool();
  const status = input.status ?? "offline";
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO drivers (userId, plate, carModel, status, lat, lng)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.userId,
      input.plate,
      input.carModel,
      status,
      input.lat ?? null,
      input.lng ?? null,
    ],
  );
  const inserted = await buscar(result.insertId);
  if (!inserted) {
    throw new Error("Falha ao ler motorista após inserção");
  }
  return inserted;
}

/** Atualiza motorista por id. */
export async function atualizar(
  id: number,
  dados: MotoristaAtualizarInput,
): Promise<Motoristas | null> {
  const pool = getPool();
  const existing = await buscar(id);
  if (!existing) return null;

  const sets: string[] = [];
  const values: Array<string | number | Date | boolean | null> = [];

  if (dados.userId !== undefined) {
    sets.push("`userId` = ?");
    values.push(dados.userId);
  }
  if (dados.plate !== undefined) {
    sets.push("plate = ?");
    values.push(dados.plate);
  }
  if (dados.carModel !== undefined) {
    sets.push("`carModel` = ?");
    values.push(dados.carModel);
  }
  if (dados.status !== undefined) {
    sets.push("status = ?");
    values.push(dados.status);
  }
  if (dados.lat !== undefined) {
    sets.push("lat = ?");
    values.push(dados.lat);
  }
  if (dados.lng !== undefined) {
    sets.push("lng = ?");
    values.push(dados.lng);
  }

  if (sets.length === 0) return existing;

  values.push(id);
  await pool.execute(
    `UPDATE drivers SET ${sets.join(", ")} WHERE id = ?`,
    values,
  );
  return buscar(id);
}

/** Remove motorista por id. */
export async function apagar(id: number): Promise<boolean> {
  const pool = getPool();
  const [result] = await pool.execute<ResultSetHeader>(
    "DELETE FROM drivers WHERE id = ?",
    [id],
  );
  return result.affectedRows > 0;
}

/** Lista todos os motoristas. */
export async function buscarTodos(): Promise<Motoristas[]> {
  const pool = getPool();
  const [rows] = await pool.query<DriverRow[]>(
    "SELECT id, userId, plate, carModel, status, lat, lng FROM drivers ORDER BY id ASC",
  );
  return rows.map((r) => mapRow(r));
}

/** Obtém motorista por id. */
export async function buscar(id: number): Promise<Motoristas | null> {
  const pool = getPool();
  const [rows] = await pool.query<DriverRow[]>(
    "SELECT id, userId, plate, carModel, status, lat, lng FROM drivers WHERE id = ? LIMIT 1",
    [id],
  );
  const row = rows[0];
  return row ? mapRow(row) : null;
}

/** Obtém motorista pelo utilizador (`drivers.userId`). */
export async function buscarPorUserId(
  userId: number,
): Promise<Motoristas | null> {
  const pool = getPool();
  const [rows] = await pool.query<DriverRow[]>(
    "SELECT id, userId, plate, carModel, status, lat, lng FROM drivers WHERE userId = ? LIMIT 1",
    [userId],
  );
  const row = rows[0];
  return row ? mapRow(row) : null;
}

export type MotoristaComDistancia = Motoristas & { distanceKm: number };

/**
 * Motoristas com estado `available`, coordenadas válidas, ordenados por distância à recolha.
 */
export async function buscarDisponiveisPorProximidade(
  lat: number,
  lng: number,
  limit: number,
): Promise<MotoristaComDistancia[]> {
  const todos = await buscarTodos();
  const elegiveis = todos.filter(
    (m) =>
      m.status === "available" &&
      m.lat != null &&
      m.lng != null &&
      Number.isFinite(m.lat) &&
      Number.isFinite(m.lng),
  );
  const comDist = elegiveis.map((m) => ({
    ...m,
    distanceKm: haversineKm(lat, lng, m.lat as number, m.lng as number),
  }));
  comDist.sort((a, b) => a.distanceKm - b.distanceKm);
  return comDist.slice(0, Math.max(0, limit));
}

/**
 * Autentica utilizador com perfil motorista (users.role = 'driver')
 * e devolve o registo em `drivers`, ou null.
 */
export async function login(
  email: string,
  passwordPlano: string,
): Promise<Motoristas | null> {
  const pool = getPool();
  const normalized = email.trim().toLowerCase();

  type JoinRow = RowDataPacket & {
    id: number;
    userId: number;
    plate: string;
    carModel: string;
    status: DriverStatus;
    lat: unknown;
    lng: unknown;
    user_password: string;
  };

  const [rows] = await pool.query<JoinRow[]>(
    `SELECT d.id, d.userId, d.plate, d.carModel, d.status, d.lat, d.lng,
            u.password AS user_password
     FROM users u
     INNER JOIN drivers d ON d.userId = u.id
     WHERE u.email = ? AND u.role = 'driver'
     LIMIT 1`,
    [normalized],
  );

  const row = rows[0];
  if (!row) return null;

  const ok = await bcrypt.compare(passwordPlano, row.user_password);
  if (!ok) return null;

  return mapRow({
    id: row.id,
    userId: row.userId,
    plate: row.plate,
    carModel: row.carModel,
    status: row.status,
    lat: row.lat,
    lng: row.lng,
  });
}
