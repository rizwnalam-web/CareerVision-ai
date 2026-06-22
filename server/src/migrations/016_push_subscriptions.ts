import { db } from "../db/database.js";

/**
 * Push notification tables
 *
 * push_subscriptions  – stores browser PushSubscription objects per user
 * push_preferences    – user alert type preferences
 * push_log            – history of sent notifications (for debugging / rate-limiting)
 */
export async function up() {
  await db.none(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      user_identifier  TEXT          NOT NULL,
      endpoint         TEXT          NOT NULL UNIQUE,
      p256dh           TEXT          NOT NULL,
      auth             TEXT          NOT NULL,
      user_agent       TEXT,
      is_active        BOOLEAN       NOT NULL DEFAULT TRUE,
      created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_push_sub_user      ON push_subscriptions(user_identifier);
    CREATE INDEX IF NOT EXISTS idx_push_sub_active    ON push_subscriptions(is_active);

    CREATE TABLE IF NOT EXISTS push_preferences (
      id                    UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
      user_identifier       TEXT    NOT NULL UNIQUE,
      job_alerts            BOOLEAN NOT NULL DEFAULT TRUE,
      market_updates        BOOLEAN NOT NULL DEFAULT FALSE,
      interview_reminders   BOOLEAN NOT NULL DEFAULT TRUE,
      weekly_digest         BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_push_prefs_user ON push_preferences(user_identifier);

    CREATE TABLE IF NOT EXISTS push_log (
      id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      user_identifier  TEXT          NOT NULL,
      notification_type VARCHAR(50)  NOT NULL,
      title            TEXT,
      body             TEXT,
      status           VARCHAR(20)   NOT NULL DEFAULT 'sent'
                         CHECK (status IN ('sent','failed','skipped')),
      error_message    TEXT,
      sent_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_push_log_user    ON push_log(user_identifier);
    CREATE INDEX IF NOT EXISTS idx_push_log_type    ON push_log(notification_type);
    CREATE INDEX IF NOT EXISTS idx_push_log_sent_at ON push_log(sent_at);
  `);
}

export async function down() {
  await db.none(`
    DROP TABLE IF EXISTS push_log;
    DROP TABLE IF EXISTS push_preferences;
    DROP TABLE IF EXISTS push_subscriptions;
  `);
}
