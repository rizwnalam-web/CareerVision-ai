import pgPromise from "pg-promise";
import dotenv from "dotenv";
import { neonConfig, Pool, Client } from "@neondatabase/serverless";
import ws from "ws";

dotenv.config();

// Route all DB traffic through WebSocket (port 443) to bypass port-5432 firewall blocks
neonConfig.webSocketConstructor = ws;

const pgp = pgPromise();

// Patch pg-promise's underlying pg module to use Neon's WebSocket-enabled Pool/Client
(pgp.pg as any).Pool = Pool;
(pgp.pg as any).Client = Client;

if (!process.env.DATABASE_URL) {
  console.error(
    "FATAL: DATABASE_URL environment variable is not set.\n" +
    "  - Locally: ensure server/.env contains DATABASE_URL\n" +
    "  - Render:  add DATABASE_URL in the Environment Variables dashboard"
  );
  process.exit(1);
}

const connection = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
};

export const db = pgp(connection);

export async function testConnection(timeoutMs = 8000): Promise<boolean> {
  try {
    const result = await Promise.race([
      db.one("SELECT NOW()"),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Connection timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
    console.log("✓ Database connected:", result);
    return true;
  } catch (error: any) {
    console.error("✗ Database connection failed:", error?.message ?? error);
    return false;
  }
}

export async function closeConnection() {
  await pgp.end();
}
