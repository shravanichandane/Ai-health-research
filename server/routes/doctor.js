import express from "express";
import { protect } from "../utils/authMiddleware.js";
import { User } from "../models/User.js";

const router = express.Router();

router.get("/patients", protect, async (req, res) => {
  try {
    const patients = await User.find({ role: "patient" }).select("-password");
    res.json({ patients });
  } catch (err) {
    res.status(500).json({ error: "Failed to load patients" });
  }
});

export default router;
