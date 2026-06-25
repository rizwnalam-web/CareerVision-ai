import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import net from "net";
import { testConnection, closeConnection } from "./db/database.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { runMigrations } from "./migrations/runMigrations.js";
import { probeProviders } from "./services/deepseekService.js";

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
import feedbackRouter from "./routes/feedback.js";
import resumeRouter from "./routes/resume.js";
import jobMatchRouter from "./routes/jobMatch.js";
import interviewPrepRouter from "./routes/interviewPrep.js";
import contactRouter from "./routes/contact.js";
import analyticsRouter from "./routes/analytics.js";
import pushRouter from "./routes/push.js";
import subscriptionRouter from "./routes/subscriptions.js";
import affiliatesRouter from "./routes/affiliates.js";
import stripeRouter, { stripeWebhookHandler } from "./routes/stripe.js";
import innovativeRouter from "./routes/innovative.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server/ first, then fall back to the repo root .env
dotenv.config({ path: path.resolve(__dirname, "../../.env") }); // root .env
dotenv.config(); // server/.env (overrides root if present)

const app = express();
const PORT = parseInt(process.env.PORT || "3001");
const CORS_ORIGIN_RAW = process.env.CORS_ORIGIN || "http://localhost:3000";
const CORS_ORIGINS = CORS_ORIGIN_RAW.split(",").map((o) => o.trim());

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

// Stripe webhook must receive a raw body — register BEFORE express.json()
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhookHandler);

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || CORS_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
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
app.use("/api/feedbacks", feedbackRouter);
app.use("/api/resume", resumeRouter);
app.use("/api/job-match", jobMatchRouter);
app.use("/api/interview-prep", interviewPrepRouter);
app.use("/api/contact", contactRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/push", pushRouter);
app.use("/api/subscription", subscriptionRouter);
app.use("/api/affiliates", affiliatesRouter);
app.use("/api/stripe", stripeRouter);
app.use("/api/innovative", innovativeRouter);

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

    // ── Database: attempt to connect; start in degraded mode if unavailable ──
    let dbAvailable = false;
    try {
      await runMigrations();
      dbAvailable = await testConnection();
    } catch (dbErr: any) {
      console.error("\n⚠  Database connection failed:", dbErr?.message ?? dbErr);
      console.warn(
        "⚠  Starting server in DEGRADED MODE — DB-backed routes will return 503.\n" +
        "   Check your DATABASE_URL in server/.env and ensure the Neon project is\n" +
        "   active at https://console.neon.tech\n"
      );
    }

    if (!dbAvailable) {
      console.warn("⚠  DB unavailable — AI/LLM features are still fully operational.");
    }

    // Probe LLM providers — lock in the first available one
    probeProviders().catch(err => console.warn("[LLM] Startup probe failed:", err));

    // Warn early if email delivery is not configured
    if (!process.env.RESEND_API_KEY) {
      console.warn("⚠  RESEND_API_KEY is not set — contact form and transactional emails will not be delivered.");
    } else if (!process.env.RESEND_FROM) {
      console.warn("⚠  RESEND_FROM is not set — using sandbox sender (onboarding@resend.dev). Auto-replies to users will fail unless the recipient is your verified Resend email.");
    }

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`\n✓ CareerVision API Server running on http://localhost:${PORT}`);
      console.log(`✓ CORS enabled for: ${CORS_ORIGINS.join(", ")}`);
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
