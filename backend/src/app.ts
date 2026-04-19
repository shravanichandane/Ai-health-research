import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { pinoMiddleware, logger } from "./middleware/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authMiddleware } from "./middleware/auth.js";
import { authRoutes } from "./routes/auth.routes.js";
import { patientRoutes } from "./routes/patient.routes.js";
import { doctorRoutes } from "./routes/doctor.routes.js";
import { researcherRoutes } from "./routes/researcher.routes.js";
import { chatRoutes } from "./routes/chat.routes.js";
import { aiRoutes } from "./routes/ai.routes.js";

export const app = express();

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(pinoMiddleware);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use(limiter);

// ============================================================
// HEALTH CHECK
// ============================================================
app.get("/api/health", (_req, res) => {
  res.json({
    status: "healthy",
    service: "curalink-api",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// PUBLIC ROUTES
// ============================================================
app.use("/api/auth", authRoutes);

// ============================================================
// PROTECTED ROUTES (require JWT)
// ============================================================
app.use("/api/patient", authMiddleware, patientRoutes);
app.use("/api/doctor", authMiddleware, doctorRoutes);
app.use("/api/researcher", authMiddleware, researcherRoutes);
app.use("/api/chat", authMiddleware, chatRoutes);
app.use("/api/ai", authMiddleware, aiRoutes);

// ============================================================
// ERROR HANDLER
// ============================================================
app.use(errorHandler);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});
