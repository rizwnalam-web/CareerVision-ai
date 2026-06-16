import { db } from "../db/database.js";

export async function up() {
  await db.none(`
    CREATE TABLE IF NOT EXISTS dashboard_cache (
      cache_key TEXT PRIMARY KEY,
      data_json JSONB NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS skillgap_cache (
      cache_key TEXT PRIMARY KEY,
      data_json JSONB NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS scholarships_cache (
      cache_key TEXT PRIMARY KEY,
      scholarships_json JSONB NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL
    );
  `);
}

export async function down() {
  await db.none(`
    DROP TABLE IF EXISTS dashboard_cache;
    DROP TABLE IF EXISTS skillgap_cache;
    DROP TABLE IF EXISTS scholarships_cache;
  `);
}
