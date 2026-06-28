import { db } from "../db/database.js";

export async function up() {
  await db.none(`
    CREATE TABLE IF NOT EXISTS deep_resume_shares (
      user_identifier TEXT PRIMARY KEY,
      share_slug VARCHAR(64) NOT NULL UNIQUE,
      is_public BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_shared_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS deep_resume_qa_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_identifier TEXT NOT NULL,
      access_scope VARCHAR(20) NOT NULL CHECK (access_scope IN ('owner', 'public')),
      share_slug VARCHAR(64),
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      confidence INT,
      response_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      evidence_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_deep_resume_shares_slug
      ON deep_resume_shares(share_slug);

    CREATE INDEX IF NOT EXISTS idx_deep_resume_qa_history_user_created
      ON deep_resume_qa_history(user_identifier, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_deep_resume_qa_history_share_created
      ON deep_resume_qa_history(share_slug, created_at DESC);
  `);
}

export async function down() {
  await db.none(`
    DROP TABLE IF EXISTS deep_resume_qa_history;
    DROP TABLE IF EXISTS deep_resume_shares;
  `);
}
