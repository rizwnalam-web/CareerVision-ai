import { db } from "../db/database.js";

export async function up() {
  await db.none(`
    CREATE TABLE IF NOT EXISTS ai_response_cache (
      cache_key  TEXT PRIMARY KEY,
      data_json  JSONB        NOT NULL,
      cached_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ  NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ai_response_cache_expires ON ai_response_cache (expires_at);
  `);
  console.log("✓ Migration 010: ai_response_cache table created");
}

export async function down() {
  await db.none(`
    DROP INDEX IF EXISTS idx_ai_response_cache_expires;
    DROP TABLE IF EXISTS ai_response_cache;
  `);
}
