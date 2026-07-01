import { db } from "../db/database.js";

/**
 * Credits ledger + setup completion metadata.
 *
 * user_credits         - current wallet and aggregate counters
 * credit_transactions  - immutable ledger for all balance changes
 * user_work_preferences.setup_completed_at - first-run setup completion marker
 */
export async function up() {
  await db.none(`
    CREATE TABLE IF NOT EXISTS user_credits (
      user_identifier   TEXT        PRIMARY KEY,
      balance           INTEGER     NOT NULL DEFAULT 0 CHECK (balance >= 0),
      lifetime_earned   INTEGER     NOT NULL DEFAULT 0 CHECK (lifetime_earned >= 0),
      lifetime_spent    INTEGER     NOT NULL DEFAULT 0 CHECK (lifetime_spent >= 0),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS credit_transactions (
      id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      user_identifier  TEXT         NOT NULL,
      direction        VARCHAR(10)  NOT NULL CHECK (direction IN ('credit','debit')),
      amount           INTEGER      NOT NULL CHECK (amount > 0),
      balance_after    INTEGER      NOT NULL CHECK (balance_after >= 0),
      source           VARCHAR(60)  NOT NULL,
      reference_key    VARCHAR(120),
      metadata         JSONB        NOT NULL DEFAULT '{}'::jsonb,
      created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created
      ON credit_transactions(user_identifier, created_at DESC);

    CREATE UNIQUE INDEX IF NOT EXISTS ux_credit_transactions_reference
      ON credit_transactions(user_identifier, source, reference_key);

    ALTER TABLE user_work_preferences
      ADD COLUMN IF NOT EXISTS setup_completed_at TIMESTAMPTZ;
  `);
}

export async function down() {
  await db.none(`
    ALTER TABLE user_work_preferences DROP COLUMN IF EXISTS setup_completed_at;
    DROP TABLE IF EXISTS credit_transactions;
    DROP TABLE IF EXISTS user_credits;
  `);
}
