import { db } from "../db/database.js";

/**
 * Analytics & Insights tables
 *
 * user_events          – individual user behaviour events (page views, clicks, feature usage)
 * ab_tests             – A/B test definitions
 * ab_test_assignments  – maps users to test variants
 * market_trend_cache   – cached AI-generated job market trend data per country/career
 * company_insights_cache – cached company-specific hiring insights
 */
export async function up() {
  await db.none(`
    -- ── User Behaviour Analytics ──────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS user_events (
      id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      user_identifier  TEXT          NOT NULL,
      event_type       VARCHAR(100)  NOT NULL,
      event_category   VARCHAR(100)  NOT NULL DEFAULT 'navigation',
      event_label      TEXT,
      event_value      NUMERIC,
      properties       JSONB         DEFAULT '{}',
      session_id       TEXT,
      view             VARCHAR(100),
      duration_ms      INTEGER,
      created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_user_events_user        ON user_events(user_identifier);
    CREATE INDEX IF NOT EXISTS idx_user_events_type        ON user_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_user_events_category    ON user_events(event_category);
    CREATE INDEX IF NOT EXISTS idx_user_events_created_at  ON user_events(created_at);
    CREATE INDEX IF NOT EXISTS idx_user_events_session     ON user_events(session_id);

    -- ── A/B Testing Framework ─────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS ab_tests (
      id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      test_key         VARCHAR(100)  NOT NULL UNIQUE,
      description      TEXT,
      variants         JSONB         NOT NULL DEFAULT '["control","treatment"]',
      weights          JSONB         DEFAULT '[50,50]',
      status           VARCHAR(20)   NOT NULL DEFAULT 'active'
                         CHECK (status IN ('draft','active','paused','completed')),
      start_date       TIMESTAMPTZ   DEFAULT NOW(),
      end_date         TIMESTAMPTZ,
      created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ab_test_assignments (
      id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      test_id          UUID          NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
      user_identifier  TEXT          NOT NULL,
      variant          TEXT          NOT NULL,
      assigned_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      UNIQUE (test_id, user_identifier)
    );

    CREATE INDEX IF NOT EXISTS idx_ab_assignments_user    ON ab_test_assignments(user_identifier);
    CREATE INDEX IF NOT EXISTS idx_ab_assignments_test    ON ab_test_assignments(test_id);

    -- ── Market Trend Cache ────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS market_trend_cache (
      id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      cache_key        VARCHAR(255)  NOT NULL UNIQUE,
      country          VARCHAR(100),
      career_title     TEXT,
      trend_data       JSONB         NOT NULL,
      expires_at       TIMESTAMPTZ   NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
      created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_market_trend_key       ON market_trend_cache(cache_key);
    CREATE INDEX IF NOT EXISTS idx_market_trend_expires   ON market_trend_cache(expires_at);

    -- ── Company Insights Cache ────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS company_insights_cache (
      id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      company_name     VARCHAR(255)  NOT NULL,
      country          VARCHAR(100),
      insights         JSONB         NOT NULL,
      expires_at       TIMESTAMPTZ   NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
      created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      UNIQUE (company_name, country)
    );

    CREATE INDEX IF NOT EXISTS idx_company_insights_name  ON company_insights_cache(company_name);

    -- ── Career Prediction Cache ───────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS career_prediction_cache (
      id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      user_identifier  TEXT          NOT NULL,
      career_title     TEXT          NOT NULL,
      prediction_data  JSONB         NOT NULL,
      expires_at       TIMESTAMPTZ   NOT NULL DEFAULT (NOW() + INTERVAL '6 hours'),
      created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      UNIQUE (user_identifier, career_title)
    );

    CREATE INDEX IF NOT EXISTS idx_career_pred_user       ON career_prediction_cache(user_identifier);
  `);

  // Seed default A/B tests
  await db.none(`
    INSERT INTO ab_tests (test_key, description, variants, weights, status)
    VALUES
      ('dashboard_layout_v2', 'Test new dashboard card layout vs classic', '["control","grid_v2"]', '[50,50]', 'active'),
      ('ai_suggestions_placement', 'Test inline vs sidebar AI suggestions', '["sidebar","inline"]', '[50,50]', 'active'),
      ('onboarding_flow_v2', 'Test streamlined 3-step onboarding vs full 6-step', '["control","streamlined"]', '[50,50]', 'active')
    ON CONFLICT (test_key) DO NOTHING;
  `);
}

export async function down() {
  await db.none(`
    DROP TABLE IF EXISTS career_prediction_cache;
    DROP TABLE IF EXISTS company_insights_cache;
    DROP TABLE IF EXISTS market_trend_cache;
    DROP TABLE IF EXISTS ab_test_assignments;
    DROP TABLE IF EXISTS ab_tests;
    DROP TABLE IF EXISTS user_events;
  `);
}
