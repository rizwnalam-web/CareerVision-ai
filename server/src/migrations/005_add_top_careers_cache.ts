import { db } from "../db/database.js";

export async function up() {
  // Step 1: add columns
  await db.none(`
    ALTER TABLE career_paths
      ADD COLUMN IF NOT EXISTS is_top_global BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS cached_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
  `);

  // Step 2: unique constraint on title (idempotent guard)
  await db.none(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'career_paths_title_key'
      ) THEN
        ALTER TABLE career_paths ADD CONSTRAINT career_paths_title_key UNIQUE (title);
      END IF;
    END$$;
  `);

  // Step 3: index for fast top-global lookups
  await db.none(`
    CREATE INDEX IF NOT EXISTS idx_career_paths_top_global
      ON career_paths (is_top_global, expires_at);
  `);

  console.log("✓ Migration 005: is_top_global + expires_at + UNIQUE(title) added to career_paths");
}

export async function down() {
  await db.none(`
    DROP INDEX IF EXISTS idx_career_paths_top_global;
    ALTER TABLE career_paths
      DROP CONSTRAINT IF EXISTS career_paths_title_key,
      DROP COLUMN IF EXISTS expires_at,
      DROP COLUMN IF EXISTS cached_at,
      DROP COLUMN IF EXISTS is_top_global;
  `);
}

