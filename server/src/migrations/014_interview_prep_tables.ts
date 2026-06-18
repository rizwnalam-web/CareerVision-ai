import { db } from "../db/database.js";

/**
 * Interview Preparation tables
 *
 * question_bank          – seeded + AI-generated questions, industry-tagged
 * interview_prep_sessions – full session records with answers + scores
 * peer_review_sessions   – room-code based async peer practice sessions
 */
export async function up() {
  await db.none(`
    CREATE TABLE IF NOT EXISTS question_bank (
      id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      text            TEXT          NOT NULL,
      type            VARCHAR(20)   NOT NULL DEFAULT 'behavioral'
                        CHECK (type IN ('behavioral','technical','situational','culture')),
      difficulty      VARCHAR(10)   NOT NULL DEFAULT 'medium'
                        CHECK (difficulty IN ('easy','medium','hard')),
      industry        VARCHAR(100)  NOT NULL DEFAULT 'general',
      category        VARCHAR(100)  NOT NULL DEFAULT 'general',
      sub_category    VARCHAR(100),
      hints           TEXT[]        DEFAULT '{}',
      expected_keywords TEXT[]      DEFAULT '{}',
      sample_answer   TEXT,
      follow_ups      TEXT[]        DEFAULT '{}',
      created_by      VARCHAR(50)   DEFAULT 'system',
      created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS interview_prep_sessions (
      id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      user_identifier TEXT          NOT NULL,
      session_type    VARCHAR(20)   NOT NULL DEFAULT 'behavioral'
                        CHECK (session_type IN ('behavioral','technical','mixed','situational')),
      industry        VARCHAR(100)  NOT NULL DEFAULT 'general',
      role            TEXT          NOT NULL DEFAULT 'Software Engineer',
      company         TEXT,
      question_ids    UUID[]        DEFAULT '{}',
      answers         JSONB         DEFAULT '[]',
      overall_score   INTEGER       CHECK (overall_score BETWEEN 0 AND 100),
      session_feedback JSONB,
      video_analysis  JSONB,
      status          VARCHAR(20)   NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','completed','abandoned')),
      duration_seconds INTEGER,
      created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      completed_at    TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS peer_review_sessions (
      id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      room_code       VARCHAR(8)    NOT NULL UNIQUE,
      creator_id      TEXT          NOT NULL,
      participant_id  TEXT,
      role            TEXT          NOT NULL DEFAULT 'Software Engineer',
      industry        VARCHAR(100)  NOT NULL DEFAULT 'general',
      session_type    VARCHAR(20)   NOT NULL DEFAULT 'behavioral',
      question_ids    UUID[]        DEFAULT '{}',
      creator_review  JSONB,
      participant_review JSONB,
      status          VARCHAR(20)   NOT NULL DEFAULT 'open'
                        CHECK (status IN ('open','active','completed','expired')),
      expires_at      TIMESTAMPTZ   NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
      created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_question_bank_type       ON question_bank(type);
    CREATE INDEX IF NOT EXISTS idx_question_bank_industry   ON question_bank(industry);
    CREATE INDEX IF NOT EXISTS idx_question_bank_difficulty ON question_bank(difficulty);
    CREATE INDEX IF NOT EXISTS idx_prep_sessions_user       ON interview_prep_sessions(user_identifier);
    CREATE INDEX IF NOT EXISTS idx_prep_sessions_status     ON interview_prep_sessions(status);
    CREATE INDEX IF NOT EXISTS idx_peer_sessions_room_code  ON peer_review_sessions(room_code);
    CREATE INDEX IF NOT EXISTS idx_peer_sessions_creator    ON peer_review_sessions(creator_id);
  `);
}

export async function down() {
  await db.none(`
    DROP TABLE IF EXISTS peer_review_sessions;
    DROP TABLE IF EXISTS interview_prep_sessions;
    DROP TABLE IF EXISTS question_bank;
  `);
}
