import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { logger } from "./logger.js";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // In development, allow requests without auth using demo user
      if (process.env.NODE_ENV === "development") {
        req.user = {
          id: "demo-patient-001",
          email: "arjun.patel@email.com",
          role: "patient",
        };
        return next();
      }
      return res.status(401).json({ error: "Missing authorization header" });
    }

    const token = authHeader.split(" ")[1];

    // Verify JWT with Supabase
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Get user profile with role
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    req.user = {
      id: user.id,
      email: user.email || "",
      role: profile?.role || "patient",
    };

    next();
  } catch (error) {
    logger.error({ error }, "Auth middleware error");
    res.status(401).json({ error: "Authentication failed" });
  }
}

// Role-based access control middleware
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: "Forbidden",
        message: `This action requires one of: ${allowedRoles.join(", ")}`,
      });
    }
    next();
  };
}
