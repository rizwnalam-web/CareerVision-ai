import pgPromise from 'pg-promise';

export const up = async (db: pgPromise.IDatabase<any>) => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS network_qa_posts (
      id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      author        TEXT NOT NULL,
      avatar        TEXT NOT NULL DEFAULT '🙋',
      role          TEXT NOT NULL DEFAULT 'Member',
      career_tag    TEXT NOT NULL DEFAULT 'career',
      country_tag   TEXT NOT NULL DEFAULT 'Global',
      title         TEXT NOT NULL,
      body          TEXT NOT NULL DEFAULT '',
      tags          TEXT[] NOT NULL DEFAULT '{}',
      votes         INTEGER NOT NULL DEFAULT 0,
      answers       INTEGER NOT NULL DEFAULT 0,
      top_answer    TEXT,
      top_answer_author TEXT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_qa_posts_career ON network_qa_posts(career_tag);
    CREATE INDEX IF NOT EXISTS idx_qa_posts_created ON network_qa_posts(created_at DESC);
  `);
};

export const down = async (db: pgPromise.IDatabase<any>) => {
  await db.query(`DROP TABLE IF EXISTS network_qa_posts;`);
};
