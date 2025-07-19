import dotenv from "dotenv";
import http from "http";
import app from "./src/app.js";
import { mongoConnect } from "./src/services/mongo.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

/**
 * Starts the server after establishing DB connection.
 *
 * - Connects to MongoDB
 * - Optionally loads initial data
 * - Starts listening on configured port
 */
async function startServer() {
  try {
    await mongoConnect();
    // TODO: Load initial data if needed
    // await loadInitialData();

    const server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
  }
}

startServer();
