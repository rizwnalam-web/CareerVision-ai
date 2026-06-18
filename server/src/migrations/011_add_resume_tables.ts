import { db } from "../db/database.js";

export async function up() {
  await db.none(`
    CREATE TABLE IF NOT EXISTS resumes (
      id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      user_identifier    TEXT         NOT NULL,
      title              VARCHAR(255) NOT NULL DEFAULT 'My Resume',
      current_version_id UUID,
      created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS resume_versions (
      id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      resume_id       UUID         REFERENCES resumes(id) ON DELETE CASCADE,
      version_number  INT          NOT NULL,
      content_json    JSONB        NOT NULL,
      raw_text        TEXT,
      file_name       VARCHAR(255),
      file_format     VARCHAR(20),
      ats_score       INT,
      ats_report_json JSONB,
      change_summary  TEXT,
      created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS portfolio_projects (
      id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      user_identifier TEXT         NOT NULL,
      title           VARCHAR(255) NOT NULL,
      description     TEXT,
      tech_stack      TEXT[]       DEFAULT '{}',
      role            VARCHAR(255),
      start_date      DATE,
      end_date        DATE,
      is_ongoing      BOOLEAN      NOT NULL DEFAULT FALSE,
      project_url     VARCHAR(500),
      repo_url        VARCHAR(500),
      image_url       VARCHAR(500),
      tags            TEXT[]       DEFAULT '{}',
      featured        BOOLEAN      NOT NULL DEFAULT FALSE,
      created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_resumes_user_identifier      ON resumes(user_identifier);
    CREATE INDEX IF NOT EXISTS idx_resume_versions_resume_id    ON resume_versions(resume_id);
    CREATE INDEX IF NOT EXISTS idx_portfolio_user_identifier    ON portfolio_projects(user_identifier);
  `);
}

export async function down() {
  await db.none(`
    DROP TABLE IF EXISTS portfolio_projects;
    DROP TABLE IF EXISTS resume_versions;
    DROP TABLE IF EXISTS resumes;
  `);
}
