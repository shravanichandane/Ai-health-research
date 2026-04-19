import pino from "pino";
import type { Request, Response, NextFunction } from "express";

export const logger = pino({
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
  level: process.env.LOG_LEVEL || "info",
});

export function pinoMiddleware(req: Request, _res: Response, next: NextFunction) {
  logger.info({ method: req.method, url: req.url }, "Incoming request");
  next();
}
