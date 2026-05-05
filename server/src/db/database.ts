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

const connection = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    }
  : {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME || "careervision",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    };

export const db = pgp(connection);

export async function testConnection() {
  try {
    const result = await db.one("SELECT NOW()");
    console.log("✓ Database connected:", result);
    return true;
  } catch (error) {
    console.error("✗ Database connection failed:", error);
    return false;
  }
}

export async function closeConnection() {
  await pgp.end();
}
