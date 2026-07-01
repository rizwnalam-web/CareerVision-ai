import { db } from "../db/database.js";

export async function up() {
  await db.none(`
    -- Ensure ON CONFLICT (share_slug) works by creating a unique index if it is missing.
    CREATE UNIQUE INDEX IF NOT EXISTS idx_deep_resume_shares_slug_unique
      ON deep_resume_shares(share_slug);
  `);
}

export async function down() {
  await db.none(`
    DROP INDEX IF EXISTS idx_deep_resume_shares_slug_unique;
  `);
}
