import { db } from "../db/database.js";

/**
 * AI-Powered Job Matching tables.
 *
 * job_listings            – curated / seeded job postings with work-type & salary
 * user_job_matches        – cached per-user match analysis (scores, gaps, paths)
 * user_work_preferences   – stored work-type, salary & location prefs per user
 */
export async function up() {
  await db.none(`
    CREATE TABLE IF NOT EXISTS job_listings (
      id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      title            VARCHAR(255) NOT NULL,
      company          VARCHAR(255) NOT NULL,
      location         VARCHAR(255),
      work_type        VARCHAR(20)  NOT NULL DEFAULT 'onsite'
                         CHECK (work_type IN ('remote','hybrid','onsite')),
      description      TEXT,
      requirements     TEXT,
      skills_required  TEXT[]       DEFAULT '{}',
      salary_min       INTEGER,
      salary_max       INTEGER,
      salary_currency  VARCHAR(10)  DEFAULT 'USD',
      company_culture  TEXT,
      industry         VARCHAR(100),
      experience_level VARCHAR(50),
      source_url       VARCHAR(500),
      source           VARCHAR(50)  DEFAULT 'manual',
      is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
      posted_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS user_job_matches (
      id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      user_identifier     TEXT         NOT NULL,
      job_id              UUID         REFERENCES job_listings(id) ON DELETE CASCADE,
      match_score         INTEGER      CHECK (match_score BETWEEN 0 AND 100),
      skill_match_score   INTEGER      CHECK (skill_match_score BETWEEN 0 AND 100),
      culture_fit_score   INTEGER      CHECK (culture_fit_score BETWEEN 0 AND 100),
      salary_fit_score    INTEGER      CHECK (salary_fit_score BETWEEN 0 AND 100),
      skill_gaps          TEXT[]       DEFAULT '{}',
      learning_paths      JSONB        DEFAULT '[]',
      salary_prediction   JSONB,
      culture_analysis    JSONB,
      match_reasons       TEXT[]       DEFAULT '{}',
      computed_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      UNIQUE (user_identifier, job_id)
    );

    CREATE TABLE IF NOT EXISTS user_work_preferences (
      user_identifier        TEXT         PRIMARY KEY,
      work_type_preference   VARCHAR(20)  NOT NULL DEFAULT 'any'
                               CHECK (work_type_preference IN ('remote','hybrid','onsite','any')),
      min_salary             INTEGER,
      max_salary             INTEGER,
      salary_currency        VARCHAR(10)  DEFAULT 'USD',
      preferred_locations    TEXT[]       DEFAULT '{}',
      preferred_industries   TEXT[]       DEFAULT '{}',
      target_role            TEXT,
      updated_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_job_listings_work_type   ON job_listings(work_type);
    CREATE INDEX IF NOT EXISTS idx_job_listings_is_active   ON job_listings(is_active);
    CREATE INDEX IF NOT EXISTS idx_job_match_user           ON user_job_matches(user_identifier);
    CREATE INDEX IF NOT EXISTS idx_job_match_score          ON user_job_matches(match_score DESC);
  `);
}

export async function down() {
  await db.none(`
    DROP TABLE IF EXISTS user_job_matches;
    DROP TABLE IF EXISTS user_work_preferences;
    DROP TABLE IF EXISTS job_listings;
  `);
}
