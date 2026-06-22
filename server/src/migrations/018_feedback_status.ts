import pgPromise from 'pg-promise';

export const up = async (db: pgPromise.IDatabase<any>) => {
  await db.query(`
    ALTER TABLE feedbacks
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected'));

    CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
  `);
};

export const down = async (db: pgPromise.IDatabase<any>) => {
  await db.query(`
    ALTER TABLE feedbacks DROP COLUMN IF EXISTS status;
  `);
};
