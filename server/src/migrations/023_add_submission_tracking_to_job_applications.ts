import { db } from "../db/database.js";

export async function up() {
  await db.none(`
    ALTER TABLE job_applications
      ADD COLUMN IF NOT EXISTS submission_channel VARCHAR(20)
        CHECK (submission_channel IN ('api', 'interface', 'none')),
      ADD COLUMN IF NOT EXISTS submission_provider VARCHAR(50),
      ADD COLUMN IF NOT EXISTS external_submission_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS submission_metadata JSONB DEFAULT '{}'::jsonb;

    CREATE INDEX IF NOT EXISTS idx_job_apps_submission_provider
      ON job_applications(submission_provider);
  `);
}

export async function down() {
  await db.none(`
    ALTER TABLE job_applications
      DROP COLUMN IF EXISTS submission_metadata,
      DROP COLUMN IF EXISTS external_submission_id,
      DROP COLUMN IF EXISTS submission_provider,
      DROP COLUMN IF EXISTS submission_channel;
  `);
}
