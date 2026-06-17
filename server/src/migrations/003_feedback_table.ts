import pgPromise from 'pg-promise'; // Import pg-promise for types

export const up = async (db: pgPromise.IDatabase<any>) => { // Change type to pg-promise IDatabase
  await db.query(`
    CREATE TABLE IF NOT EXISTS feedbacks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      user_name VARCHAR(255) NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_feedbacks_rating ON feedbacks(rating DESC);
    CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at DESC);
  `);
};

export const down = async (db: pgPromise.IDatabase<any>) => { // Change type to pg-promise IDatabase
  await db.query(`
    DROP TABLE IF EXISTS feedbacks;
  `);
};