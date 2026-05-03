import type { Pool } from "mysql2/promise";

export type JwtPayload = {
  sub: string;
  email: string;
};

declare module "express-serve-static-core" {
  interface Request {
    mysql: Pool;
    user?: JwtPayload;
  }
}

export {};
