import { db } from "../db/database.js";

export async function up(): Promise<void> {
  await db.none(`
    CREATE TABLE IF NOT EXISTS hub_search_cache (
      id          SERIAL PRIMARY KEY,
      query_key   VARCHAR(300) NOT NULL UNIQUE,
      results_json TEXT NOT NULL,
      cached_at   TIMESTAMP NOT NULL DEFAULT NOW(),
      expires_at  TIMESTAMP NOT NULL DEFAULT NOW() + INTERVAL '48 hours'
    );
    CREATE INDEX IF NOT EXISTS idx_hub_search_query
      ON hub_search_cache (query_key, expires_at);
  `);
  console.log("[Migration 008] hub_search_cache table created");
}

export async function down(): Promise<void> {
  await db.none(`DROP TABLE IF EXISTS hub_search_cache;`);
}
