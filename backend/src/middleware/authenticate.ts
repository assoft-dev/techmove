import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/jwt.js";

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
  if (!token) {
    res.status(401).json({ error: "Não autorizado" });
    return;
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Não autorizado" });
  }
}
