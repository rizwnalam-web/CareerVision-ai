import { db } from "../db/database.js";

/**
 * Job aggregation support:
 * - stable external ids for provider jobs
 * - dedupe indexes for provider sync upserts
 */
export async function up() {
  await db.none(`
    ALTER TABLE job_listings
      ADD COLUMN IF NOT EXISTS external_job_id TEXT;

    CREATE UNIQUE INDEX IF NOT EXISTS ux_job_listings_provider_external
      ON job_listings(source, external_job_id)
      WHERE external_job_id IS NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS ux_job_listings_provider_url
      ON job_listings(source, source_url)
      WHERE source_url IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_job_listings_source
      ON job_listings(source);
  `);
}

export async function down() {
  await db.none(`
    DROP INDEX IF EXISTS idx_job_listings_source;
    DROP INDEX IF EXISTS ux_job_listings_provider_url;
    DROP INDEX IF EXISTS ux_job_listings_provider_external;
    ALTER TABLE job_listings DROP COLUMN IF EXISTS external_job_id;
  `);
}
