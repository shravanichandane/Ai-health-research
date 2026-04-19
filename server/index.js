/**
 * CuraLink AI Server — Entry Point
 * MERN Stack: MongoDB + Express + Node.js
 */
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import researchRoutes from "./routes/research.js";
import authRoutes from "./routes/auth.js";
import patientRoutes from "./routes/patient.js";
import doctorRoutes from "./routes/doctor.js";
import researcherRoutes from "./routes/researcher.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

// ============================================================
// ROUTES
// ============================================================

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "healthy",
    service: "curalink-ai-server",
    version: "1.0.0",
    stack: "MERN + HuggingFace (Mistral-7B)",
    llm: "Open-source (mistralai/Mistral-7B-Instruct-v0.3)",
    dataSources: ["OpenAlex", "PubMed", "ClinicalTrials.gov"],
    timestamp: new Date().toISOString(),
  });
});

// Main research pipeline
app.use("/api/research", researchRoutes);

// Auth pipeline
app.use("/api/auth", authRoutes);

// Role endpoints
app.use("/api/patient", patientRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/researcher", researcherRoutes);

// ============================================================
// STATIC DELIVERABLES (For integrated deployment)
// ============================================================
if (process.env.NODE_ENV === "production" || process.env.SERVE_STATIC === "true") {
  const distPath = path.join(__dirname, "../client/dist");
  app.use(express.static(distPath));
  
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  // 404 for dev mode API misses
  app.use((_req, res) => {
    res.status(404).json({ error: "Route not found" });
  });
}

// Error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ============================================================
// START
// ============================================================
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n🚀 CuraLink AI Server running on http://localhost:${PORT}`);
    console.log(`📡 LLM: HuggingFace Inference (Mistral-7B, open-source)`);
    console.log(`🌐 Data Sources: OpenAlex + PubMed + ClinicalTrials.gov`);
    console.log(`🗄️  Database: MongoDB`);
    console.log(`🖥️  Frontend: ${process.env.FRONTEND_URL || "http://localhost:5173"}\n`);
  });
}

start();
