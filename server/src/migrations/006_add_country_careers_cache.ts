import { db } from "../db/database.js";

export async function up() {
  await db.none(`
    CREATE TABLE IF NOT EXISTS country_careers_cache (
      id            SERIAL PRIMARY KEY,
      country       VARCHAR(100) NOT NULL UNIQUE,
      careers_json  TEXT NOT NULL,
      cached_at     TIMESTAMP NOT NULL DEFAULT NOW(),
      expires_at    TIMESTAMP NOT NULL DEFAULT NOW() + INTERVAL '24 hours'
    );
    CREATE INDEX IF NOT EXISTS idx_country_careers_country
      ON country_careers_cache (country, expires_at);
  `);
  console.log("✓ Migration 006: country_careers_cache table created");
}

export async function down() {
  await db.none(`
    DROP INDEX IF EXISTS idx_country_careers_country;
    DROP TABLE IF EXISTS country_careers_cache;
  `);
}
