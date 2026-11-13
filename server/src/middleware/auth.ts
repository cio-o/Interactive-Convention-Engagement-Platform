import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import prisma from "../lib/prisma";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Missing token" });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: "Invalid token" });

  const user = await prisma.user.findUnique({ where: { id: data.user.id } });
  if (!user) return res.status(401).json({ error: "User profile not found" });

  res.locals.user = user;
  next();
}

export const requireRole =
  (...roles: string[]) =>
  (_req: Request, res: Response, next: NextFunction) =>
    roles.includes(res.locals.user.role)
      ? next()
      : res.status(403).json({ error: "Forbidden" });