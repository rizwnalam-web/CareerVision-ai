import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import net from "net";
import { testConnection, closeConnection } from "./db/database.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

// Import routes
import careersRouter from "./routes/careers.js";
import institutionsRouter from "./routes/institutions.js";
import materialsRouter from "./routes/materials.js";
import fundingRouter from "./routes/funding.js";
import interviewsRouter from "./routes/interviews.js";
import usersRouter from "./routes/users.js";
import marketRouter from "./routes/market.js";
import llmRouter from "./routes/llm.js";
import careersAiRouter from "./routes/careers-ai.js";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3001");
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

function isPortAvailable(port: number, host = "0.0.0.0"): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const tester = net.createServer();

    tester.once("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        resolve(false);
        return;
      }

      reject(error);
    });

    tester.once("listening", () => {
      tester.close((closeError) => {
        if (closeError) {
          reject(closeError);
          return;
        }

        resolve(true);
      });
    });

    tester.listen(port, host);
  });
}

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

// Health check endpoint (also handles Render's HEAD / probe)
app.all("/", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "CareerVision API",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "CareerVision API",
  });
});

// API Routes
app.use("/api/careers", careersRouter);
app.use("/api/institutions", institutionsRouter);
app.use("/api/materials", materialsRouter);
app.use("/api/funding", fundingRouter);
app.use("/api/interviews", interviewsRouter);
app.use("/api/users", usersRouter);
app.use("/api/market", marketRouter);
app.use("/api/llm", llmRouter);
app.use("/api/careers-ai", careersAiRouter);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

async function startServer() {
  try {
    if (!(await isPortAvailable(PORT))) {
      console.error(`Port ${PORT} is already in use. Reuse the existing API server or stop the conflicting process.`);
      process.exit(0);
    }

    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error("Cannot start server without database connection");
      process.exit(1);
    }

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`\n✓ CareerVision API Server running on http://localhost:${PORT}`);
      console.log(`✓ CORS enabled for: ${CORS_ORIGIN}`);
      console.log(`✓ Available endpoints:`);
      console.log(`  - GET  /health`);
      console.log(`  - POST /api/careers`);
      console.log(`  - GET  /api/institutions`);
      console.log(`  - GET  /api/materials`);
      console.log(`  - GET  /api/funding`);
      console.log(`  - POST /api/interviews/sessions`);
      console.log(`  - GET  /api/users`);
    });

    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Reuse the existing API server or stop the conflicting process.`);
      } else {
        console.error("Failed to start server:", error);
      }

      void closeConnection().finally(() => process.exit(1));
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n✓ Shutting down gracefully...");
  await closeConnection();
  process.exit(0);
});

startServer();
