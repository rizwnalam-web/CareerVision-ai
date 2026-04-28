import pgPromise from "pg-promise";
import dotenv from "dotenv";

dotenv.config();

const pgp = pgPromise();

const connection = {
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
