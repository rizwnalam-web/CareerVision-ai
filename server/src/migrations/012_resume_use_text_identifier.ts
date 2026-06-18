import { db } from "../db/database.js";

/**
 * Decouple resume/portfolio tables from the users FK.
 *
 * Google-auth users exist only in Firebase/Firestore, not in the PostgreSQL
 * users table, so a strict UUID FK rejects all their upload attempts.
 * We replace the UUID FK column with a plain TEXT identifier that holds
 * either the PostgreSQL UUID or the Firebase UID string directly.
 */
export async function up() {
  await db.none(`
    -- Wrap everything in DO $$ so each step only runs if the column still
    -- exists under its old name (idempotent for both new and existing installs)
    DO $$
    BEGIN
      -- resumes table
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'resumes' AND column_name = 'user_id'
      ) THEN
        ALTER TABLE resumes
          DROP CONSTRAINT IF EXISTS resumes_user_id_fkey,
          DROP CONSTRAINT IF EXISTS resumes_user_id_users_fkey;
        ALTER TABLE resumes
          ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
        ALTER TABLE resumes
          RENAME COLUMN user_id TO user_identifier;
        DROP INDEX IF EXISTS idx_resumes_user_id;
        CREATE INDEX IF NOT EXISTS idx_resumes_user_identifier ON resumes(user_identifier);
      END IF;

      -- portfolio_projects table
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'portfolio_projects' AND column_name = 'user_id'
      ) THEN
        ALTER TABLE portfolio_projects
          DROP CONSTRAINT IF EXISTS portfolio_projects_user_id_fkey,
          DROP CONSTRAINT IF EXISTS portfolio_projects_user_id_users_fkey;
        ALTER TABLE portfolio_projects
          ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
        ALTER TABLE portfolio_projects
          RENAME COLUMN user_id TO user_identifier;
        DROP INDEX IF EXISTS idx_portfolio_user_id;
        CREATE INDEX IF NOT EXISTS idx_portfolio_user_identifier ON portfolio_projects(user_identifier);
      END IF;
    END $$;
  `);
}

export async function down() {
  await db.none(`
    ALTER TABLE resumes        RENAME COLUMN user_identifier TO user_id;
    ALTER TABLE portfolio_projects RENAME COLUMN user_identifier TO user_id;
  `);
}
