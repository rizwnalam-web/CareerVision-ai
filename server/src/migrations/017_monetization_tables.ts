import { db } from "../db/database.js";

/**
 * Monetization & Business Model tables
 *
 * subscription_plans     – plan catalogue (free / pro / team / enterprise)
 * user_subscriptions     – which plan a user is on + billing state
 * enterprise_accounts    – company-level accounts
 * enterprise_seats       – users belonging to an enterprise
 * affiliate_partners     – job board affiliate registry
 * affiliate_clicks       – individual click events
 * affiliate_conversions  – completed conversions (sign-ups / purchases)
 * feature_usage          – per-user usage counters for rate-limited features
 */
export async function up() {
  await db.none(`
    -- ── Subscription Plans ────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      slug         VARCHAR(30)  NOT NULL UNIQUE,
      name         VARCHAR(80)  NOT NULL,
      tagline      TEXT,
      price_monthly NUMERIC(8,2) NOT NULL DEFAULT 0,
      price_annual  NUMERIC(8,2) NOT NULL DEFAULT 0,
      currency     VARCHAR(5)   NOT NULL DEFAULT 'USD',
      features     JSONB        NOT NULL DEFAULT '[]',
      limits       JSONB        NOT NULL DEFAULT '{}',
      is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
      sort_order   INTEGER      NOT NULL DEFAULT 0,
      created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    -- ── User Subscriptions ────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS user_subscriptions (
      id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      user_identifier     TEXT         NOT NULL,
      plan_id             UUID         NOT NULL REFERENCES subscription_plans(id),
      status              VARCHAR(20)  NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active','cancelled','expired','trialing','past_due')),
      billing_period      VARCHAR(10)  NOT NULL DEFAULT 'monthly'
                            CHECK (billing_period IN ('monthly','annual','lifetime')),
      trial_ends_at       TIMESTAMPTZ,
      current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      current_period_end  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
      cancelled_at        TIMESTAMPTZ,
      payment_provider    VARCHAR(30),
      external_id         TEXT,
      metadata            JSONB        DEFAULT '{}',
      created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_user_subs_user   ON user_subscriptions(user_identifier);
    CREATE INDEX IF NOT EXISTS idx_user_subs_status ON user_subscriptions(status);

    -- ── Enterprise Accounts ────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS enterprise_accounts (
      id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      company_name    VARCHAR(200) NOT NULL,
      domain          VARCHAR(200),
      industry        VARCHAR(100),
      size            VARCHAR(30)  CHECK (size IN ('1-10','11-50','51-200','201-500','500+')),
      owner_identifier TEXT        NOT NULL,
      seat_limit      INTEGER      NOT NULL DEFAULT 10,
      plan_id         UUID         REFERENCES subscription_plans(id),
      status          VARCHAR(20)  NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','suspended','trial')),
      billing_email   VARCHAR(200),
      contract_ends_at TIMESTAMPTZ,
      features        JSONB        DEFAULT '{}',
      metadata        JSONB        DEFAULT '{}',
      created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_enterprise_owner  ON enterprise_accounts(owner_identifier);
    CREATE INDEX IF NOT EXISTS idx_enterprise_domain ON enterprise_accounts(domain);

    -- ── Enterprise Seats ──────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS enterprise_seats (
      id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      enterprise_id    UUID         NOT NULL REFERENCES enterprise_accounts(id) ON DELETE CASCADE,
      user_identifier  TEXT         NOT NULL,
      email            VARCHAR(200),
      role             VARCHAR(20)  NOT NULL DEFAULT 'member'
                         CHECK (role IN ('admin','manager','member')),
      status           VARCHAR(20)  NOT NULL DEFAULT 'active'
                         CHECK (status IN ('active','invited','suspended')),
      invited_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      accepted_at      TIMESTAMPTZ,
      UNIQUE (enterprise_id, user_identifier)
    );

    CREATE INDEX IF NOT EXISTS idx_enterprise_seats_user ON enterprise_seats(user_identifier);

    -- ── Affiliate Partners ────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS affiliate_partners (
      id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      name            VARCHAR(100) NOT NULL,
      slug            VARCHAR(50)  NOT NULL UNIQUE,
      description     TEXT,
      logo_url        TEXT,
      website_url     TEXT         NOT NULL,
      affiliate_url   TEXT         NOT NULL,
      category        VARCHAR(50)  NOT NULL DEFAULT 'job_board'
                        CHECK (category IN ('job_board','course_platform','certification','tool','recruiter')),
      commission_type VARCHAR(20)  NOT NULL DEFAULT 'cpc'
                        CHECK (commission_type IN ('cpc','cpa','revenue_share')),
      commission_rate NUMERIC(6,4) NOT NULL DEFAULT 0,
      country_codes   TEXT[]       DEFAULT '{}',
      is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
      sort_order      INTEGER      NOT NULL DEFAULT 0,
      created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    -- ── Affiliate Clicks ──────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS affiliate_clicks (
      id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      partner_id       UUID         NOT NULL REFERENCES affiliate_partners(id),
      user_identifier  TEXT,
      session_id       TEXT,
      source_view      VARCHAR(100),
      ip_hash          TEXT,
      user_agent       TEXT,
      referrer         TEXT,
      clicked_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_aff_clicks_partner ON affiliate_clicks(partner_id);
    CREATE INDEX IF NOT EXISTS idx_aff_clicks_user    ON affiliate_clicks(user_identifier);
    CREATE INDEX IF NOT EXISTS idx_aff_clicks_date    ON affiliate_clicks(clicked_at);

    -- ── Affiliate Conversions ─────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS affiliate_conversions (
      id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      partner_id       UUID         NOT NULL REFERENCES affiliate_partners(id),
      click_id         UUID         REFERENCES affiliate_clicks(id),
      user_identifier  TEXT,
      conversion_type  VARCHAR(50)  NOT NULL DEFAULT 'signup',
      revenue_usd      NUMERIC(10,2),
      commission_usd   NUMERIC(10,2),
      status           VARCHAR(20)  NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','confirmed','rejected','paid')),
      converted_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_aff_conv_partner ON affiliate_conversions(partner_id);

    -- ── Feature Usage (rate-limiting) ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS feature_usage (
      id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      user_identifier  TEXT         NOT NULL,
      feature_key      VARCHAR(80)  NOT NULL,
      used_count       INTEGER      NOT NULL DEFAULT 0,
      period_start     DATE         NOT NULL DEFAULT CURRENT_DATE,
      updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      UNIQUE (user_identifier, feature_key, period_start)
    );

    CREATE INDEX IF NOT EXISTS idx_feat_usage_user ON feature_usage(user_identifier);
  `);

  /* ── Seed plan catalogue ─────────────────────────────────────────────────── */
  await db.none(`
    INSERT INTO subscription_plans (slug, name, tagline, price_monthly, price_annual, features, limits, sort_order)
    VALUES
      (
        'free',
        'Free',
        'Start your career journey at no cost',
        0, 0,
        '["Career roadmaps","Job board access","Basic resume builder","5 AI interview questions/month","Community access"]',
        '{"interview_sessions_per_month":5,"resume_templates":1,"ai_analyses_per_month":3,"job_matches_per_month":10,"career_reports":1}',
        1
      ),
      (
        'pro',
        'Pro',
        'Full AI power for serious career movers',
        19, 190,
        '["Everything in Free","Unlimited interview practice","Premium resume templates (12+)","Advanced AI career analysis","Priority support","Market trend reports","Career prediction analytics","Company insights","PDF export","Remove watermarks"]',
        '{"interview_sessions_per_month":-1,"resume_templates":12,"ai_analyses_per_month":-1,"job_matches_per_month":-1,"career_reports":-1}',
        2
      ),
      (
        'team',
        'Team',
        'For small teams and career coaches',
        49, 490,
        '["Everything in Pro","Up to 10 team seats","Team analytics dashboard","Shared resource library","Manager reporting","Bulk interview sessions","Custom career tracks"]',
        '{"interview_sessions_per_month":-1,"resume_templates":12,"ai_analyses_per_month":-1,"job_matches_per_month":-1,"career_reports":-1,"seats":10}',
        3
      ),
      (
        'enterprise',
        'Enterprise',
        'Custom solutions for organisations',
        0, 0,
        '["Everything in Team","Unlimited seats","SSO / LDAP integration","Dedicated account manager","Custom AI model tuning","SLA guarantee","White-label option","API access","Compliance reporting (GDPR/SOC2)","Custom onboarding"]',
        '{"interview_sessions_per_month":-1,"resume_templates":-1,"ai_analyses_per_month":-1,"job_matches_per_month":-1,"career_reports":-1,"seats":-1}',
        4
      )
    ON CONFLICT (slug) DO NOTHING;
  `);

  /* ── Seed affiliate partners ─────────────────────────────────────────────── */
  await db.none(`
    INSERT INTO affiliate_partners (name, slug, description, website_url, affiliate_url, category, commission_type, commission_rate, sort_order)
    VALUES
      ('LinkedIn Jobs',  'linkedin-jobs',  'World''s largest professional job network',    'https://linkedin.com/jobs',   'https://linkedin.com/jobs?utm_source=careervision&utm_medium=affiliate',   'job_board',       'cpc',            0.50, 1),
      ('Indeed',         'indeed',         'Search millions of jobs from thousands of sites','https://indeed.com',          'https://indeed.com?utm_source=careervision&utm_medium=affiliate',           'job_board',       'cpc',            0.40, 2),
      ('Glassdoor',      'glassdoor',      'Job listings with company reviews & salaries',  'https://glassdoor.com',       'https://glassdoor.com?utm_source=careervision&utm_medium=affiliate',        'job_board',       'cpc',            0.45, 3),
      ('Coursera',       'coursera',       'Online courses from top universities',          'https://coursera.org',        'https://coursera.org?utm_source=careervision&utm_medium=affiliate',         'course_platform', 'revenue_share',  0.20, 4),
      ('Udemy',          'udemy',          'Learn from expert instructors online',          'https://udemy.com',           'https://udemy.com?utm_source=careervision&utm_medium=affiliate',            'course_platform', 'revenue_share',  0.15, 5),
      ('Ziprecruiter',   'ziprecruiter',   'AI-powered job matching platform',              'https://ziprecruiter.com',    'https://ziprecruiter.com?utm_source=careervision&utm_medium=affiliate',     'job_board',       'cpa',            25.0, 6),
      ('Upwork',         'upwork',         'Freelance marketplace for remote work',         'https://upwork.com',          'https://upwork.com?utm_source=careervision&utm_medium=affiliate',           'job_board',       'cpa',            20.0, 7),
      ('Toptal',         'toptal',         'Elite freelance network for top talent',        'https://toptal.com',          'https://toptal.com?utm_source=careervision&utm_medium=affiliate',           'recruiter',       'cpa',            50.0, 8)
    ON CONFLICT (slug) DO NOTHING;
  `);
}

export async function down() {
  await db.none(`
    DROP TABLE IF EXISTS feature_usage;
    DROP TABLE IF EXISTS affiliate_conversions;
    DROP TABLE IF EXISTS affiliate_clicks;
    DROP TABLE IF EXISTS affiliate_partners;
    DROP TABLE IF EXISTS enterprise_seats;
    DROP TABLE IF EXISTS enterprise_accounts;
    DROP TABLE IF EXISTS user_subscriptions;
    DROP TABLE IF EXISTS subscription_plans;
  `);
}
