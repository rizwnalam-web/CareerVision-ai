import { db } from "../db/database.js";

export async function up() {
  await db.none(`
    CREATE TABLE IF NOT EXISTS job_applications (
      id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      user_identifier     TEXT          NOT NULL,
      job_title           VARCHAR(255)  NOT NULL,
      company             VARCHAR(255)  NOT NULL,
      location            VARCHAR(255),
      work_type           VARCHAR(50),
      salary_min          INTEGER,
      salary_max          INTEGER,
      salary_currency     VARCHAR(10)   DEFAULT 'USD',
      job_url             TEXT,
      job_description     TEXT,
      status              VARCHAR(30)   NOT NULL DEFAULT 'saved'
                          CHECK (status IN ('saved','applied','interviewing','offered','rejected','withdrawn')),
      applied_at          TIMESTAMPTZ,
      deadline            DATE,
      resume_version_id   UUID,
      cover_letter_sent   BOOLEAN       NOT NULL DEFAULT FALSE,
      notes               TEXT,
      next_step           TEXT,
      follow_up_date      DATE,
      source              VARCHAR(30)   NOT NULL DEFAULT 'manual'
                          CHECK (source IN ('manual','job-board','ai-match')),
      tags                TEXT[]        DEFAULT '{}',
      created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS application_events (
      id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      application_id  UUID          NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
      event_type      VARCHAR(50)   NOT NULL,
      description     TEXT,
      occurred_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_job_apps_user       ON job_applications(user_identifier);
    CREATE INDEX IF NOT EXISTS idx_job_apps_status     ON job_applications(status);
    CREATE INDEX IF NOT EXISTS idx_app_events_app_id   ON application_events(application_id);
  `);
}

export async function down() {
  await db.none(`
    DROP TABLE IF EXISTS application_events;
    DROP TABLE IF EXISTS job_applications;
  `);
}
