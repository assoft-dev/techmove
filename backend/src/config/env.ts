import "dotenv/config";

function resolveJwtSecret(): string {
  const v = process.env.JWT_SECRET?.trim();
  if (v) return v;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Variável de ambiente obrigatória ausente: JWT_SECRET");
  }
  console.warn(
    "[env] JWT_SECRET não definido; a usar segredo só para desenvolvimento. Copie .env.example para .env e defina JWT_SECRET.",
  );
  return "techmove-dev-only-jwt-secret-not-for-production";
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  host: process.env.HOST ?? "127.0.0.1",
  port: Number(process.env.PORT ?? 3001),
  mysql: {
    host: process.env.MYSQL_HOST ?? "127.0.0.1",
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER ?? "root",
    password: process.env.MYSQL_PASSWORD ?? "Asinforprest+",
    database: process.env.MYSQL_DATABASE ?? "techmov",
  },
  jwtSecret: resolveJwtSecret(),
};
