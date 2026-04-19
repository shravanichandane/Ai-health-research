import dotenv from "dotenv";
dotenv.config();

import { app } from "./app.js";
import { logger } from "./middleware/logger.js";

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`🚀 CuraLink API running on http://localhost:${PORT}`);
  logger.info(`📡 AI Service: ${process.env.AI_SERVICE_URL || "http://localhost:8000"}`);
  logger.info(`🌐 Frontend: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
});
