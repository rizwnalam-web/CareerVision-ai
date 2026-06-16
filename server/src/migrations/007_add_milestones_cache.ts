import { db } from "../db/database.js";

export async function up(): Promise<void> {
  await db.none(`
    CREATE TABLE IF NOT EXISTS milestones_cache (
      id           SERIAL PRIMARY KEY,
      cache_key    VARCHAR(300) NOT NULL UNIQUE,
      milestones_json TEXT NOT NULL,
      cached_at    TIMESTAMP NOT NULL DEFAULT NOW(),
      expires_at   TIMESTAMP NOT NULL DEFAULT NOW() + INTERVAL '7 days'
    );
    CREATE INDEX IF NOT EXISTS idx_milestones_cache_key
      ON milestones_cache (cache_key, expires_at);
  `);
  console.log("[Migration 007] milestones_cache table created");
}

export async function down(): Promise<void> {
  await db.none(`DROP TABLE IF EXISTS milestones_cache;`);
}
