require("dotenv").config();

const http = require("http");
const app = require("./src/app");

const { mongoConnect } = require("./src/services/mongo");

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
    // await loadInitialData()

    const server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
  }
}

startServer();
