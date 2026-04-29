import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { spawn, type ChildProcess } from "child_process";
import net from "net";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let backendProcess: ChildProcess | null = null;
let backendRestartTimer: NodeJS.Timeout | null = null;
let isShuttingDown = false;

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

async function startBackendServer(port: number): Promise<void> {
  if (!(await isPortAvailable(port))) {
    console.log(`[Backend] Reusing existing API server on http://localhost:${port}`);
    backendProcess = null;
    return;
  }

  const serverDir = path.join(__dirname, "server");
  const backend = spawn(
    "npx",
    ["tsx", "src/index.ts"],
    {
      cwd: serverDir,
      stdio: "inherit",
      env: { ...process.env },
      shell: true,
    }
  );

  backend.on("error", (err) => {
    console.error("[Backend] Failed to start:", err.message);
  });

  backend.on("exit", (code) => {
    if (backendProcess?.pid === backend.pid) {
      backendProcess = null;
    }

    if (!isShuttingDown && code !== 0 && code !== null) {
      console.error(`[Backend] Exited with code ${code}. Restarting in 3s...`);
      if (backendRestartTimer) {
        clearTimeout(backendRestartTimer);
      }

      backendRestartTimer = setTimeout(() => {
        backendRestartTimer = null;
        void startBackendServer(port);
      }, 3000);
    }
  });

  backendProcess = backend;
  console.log(`[Backend] API server starting on http://localhost:${port}`);
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const backendPort = Number.parseInt(process.env.PORT ?? "3001", 10);

  // JSON Body Parser
  app.use(express.json());

  // API Routes (Add more if needed for data streams)
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Start backend API server alongside frontend
  await startBackendServer(backendPort);

  // Graceful shutdown: kill backend when frontend exits
  const shutdown = () => {
    isShuttingDown = true;
    if (backendRestartTimer) {
      clearTimeout(backendRestartTimer);
      backendRestartTimer = null;
    }
    backendProcess?.kill();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CareerVision AI Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Server failed to start:", err);
});
