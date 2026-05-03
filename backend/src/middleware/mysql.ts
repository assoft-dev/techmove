import type { NextFunction, Request, Response } from "express";
import type { Pool } from "mysql2/promise";

export function mysqlMiddleware(pool: Pool) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.mysql = pool;
    next();
  };
}
