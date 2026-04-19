import { Router } from "express";
import { logger } from "../middleware/logger.js";

export const aiRoutes = Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

// Generic AI proxy — forwards requests to FastAPI AI service
async function proxyToAI(endpoint: string, body: any) {
  const response = await fetch(`${AI_SERVICE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`AI service error: ${response.status}`);
  }
  return response.json();
}

// POST /api/ai/analyze
aiRoutes.post("/analyze", async (req, res) => {
  try {
    const result = await proxyToAI("/analyze", req.body);
    res.json(result);
  } catch (error) {
    logger.error({ error }, "AI analyze failed");
    res.status(502).json({ error: "AI service unavailable" });
  }
});

// POST /api/ai/summarize (SOAP generation)
aiRoutes.post("/summarize", async (req, res) => {
  try {
    const result = await proxyToAI("/summarize", req.body);
    res.json(result);
  } catch (error) {
    logger.error({ error }, "AI summarize failed");
    res.status(502).json({ error: "AI service unavailable" });
  }
});

// POST /api/ai/match-trials
aiRoutes.post("/match-trials", async (req, res) => {
  try {
    const result = await proxyToAI("/match-trials", req.body);
    res.json(result);
  } catch (error) {
    logger.error({ error }, "AI trial matching failed");
    res.status(502).json({ error: "AI service unavailable" });
  }
});

// POST /api/ai/literature-review
aiRoutes.post("/literature-review", async (req, res) => {
  try {
    const result = await proxyToAI("/literature-review", req.body);
    res.json(result);
  } catch (error) {
    logger.error({ error }, "AI literature review failed");
    res.status(502).json({ error: "AI service unavailable" });
  }
});
