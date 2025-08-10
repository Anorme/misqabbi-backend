import env from "./src/config/env.js";
import http from "node:http";

import app from "./src/app.js";

import { mongoConnect } from "./src/services/mongo.js";
import logger from "./src/config/logger.js";

const PORT = env.PORT || 5000;

/**
 * Starts the server after establishing DB connection.
 *
 * - Connects to MongoDB
 * - Optionally loads initial data
 * - Starts listening on configured port
 */
async function startServer() {
  try {
    logger.info("Connecting to MongoDB...");
    await mongoConnect();
    // TODO: Load initial data if needed
    // await loadInitialData();

    const server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error("Server startup failed:", {
      message: error.message,
      stack: error.stack,
      env: env.NODE_ENV,
    });
  }
}

startServer();
