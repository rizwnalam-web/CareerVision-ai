import { db } from "../db/database.js";

/**
 * Email re-engagement log — prevents duplicate sends and provides audit trail.
 */
export async function up() {
  await db.none(`
    CREATE TABLE IF NOT EXISTS email_reengagement_log (
      id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      user_identifier  TEXT          NOT NULL,
      email_type       VARCHAR(100)  NOT NULL,
      recipient_email  TEXT          NOT NULL,
      resend_id        TEXT,
      status           VARCHAR(20)   NOT NULL DEFAULT 'sent'
                         CHECK (status IN ('sent','delivered','failed','skipped')),
      metadata         JSONB         DEFAULT '{}',
      created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_email_reengagement_user  ON email_reengagement_log(user_identifier);
    CREATE INDEX IF NOT EXISTS idx_email_reengagement_type  ON email_reengagement_log(email_type);
    CREATE INDEX IF NOT EXISTS idx_email_reengagement_created ON email_reengagement_log(created_at);
    -- Prevent sending the same email type to the same user within a cooldown window
    CREATE UNIQUE INDEX IF NOT EXISTS idx_email_reengagement_dedup
      ON email_reengagement_log(user_identifier, email_type)
      WHERE created_at > NOW() - INTERVAL '7 days';
  `);
}

export async function down() {
  await db.none(`DROP TABLE IF EXISTS email_reengagement_log;`);
}
