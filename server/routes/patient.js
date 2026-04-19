import express from "express";
import { protect } from "../utils/authMiddleware.js";

const router = express.Router();

router.get("/insights", protect, async (req, res) => {
  res.json({
    healthScore: Math.floor(Math.random() * 20) + 75,
    criticalFlags: 0,
    activeTrackers: 3,
    lastUpdate: new Date()
  });
});

router.post("/upload", protect, async (req, res) => {
  // Simulate AI document ingestion
  setTimeout(() => {
    res.json({ success: true, message: "Document ingested and synthesized by AI successfully." });
  }, 1500);
});

export default router;
