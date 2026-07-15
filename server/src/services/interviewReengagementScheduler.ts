/**
 * interviewReengagementScheduler.ts
 *
 * Runs every hour. Finds users who:
 *   1. Visited the interview tab OR started an interview session 22–26 hours ago
 *   2. Did NOT complete a session (no "interview_session_completed" event) since then
 *   3. Have NOT already received this email in the last 7 days
 *
 * Sends the behavioral re-engagement email via Resend.
 */

import { db } from "../db/database.js";
import {
  sendInterviewAbandonmentEmail,
  isEmailConfigured,
} from "./emailService.js";

// ─── Configuration ───────────────────────────────────────────────────────────

const ENABLED_KEY = "INTERVIEW_REENGAGEMENT_ENABLED";
const INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const INITIAL_DELAY_MS = 30_000; // 30 s after boot
const ABANDONMENT_WINDOW_HOURS_MIN = 22;
const ABANDONMENT_WINDOW_HOURS_MAX = 26;
const COOLDOWN_DAYS = 7;

// ─── State ───────────────────────────────────────────────────────────────────

let timer: NodeJS.Timeout | null = null;

export interface ReengagementMetrics {
  enabled: boolean;
  running: boolean;
  lastRunAt: string | null;
  lastEmailsSent: number;
  lastErrorMessage: string | null;
  totalEmailsSent: number;
}

const metrics: ReengagementMetrics = {
  enabled: false,
  running: false,
  lastRunAt: null,
  lastEmailsSent: 0,
  lastErrorMessage: null,
  totalEmailsSent: 0,
};

// ─── Core logic ──────────────────────────────────────────────────────────────

async function runCycle(): Promise<void> {
  if (metrics.running) return; // prevent overlap
  metrics.running = true;
  metrics.lastRunAt = new Date().toISOString();
  metrics.lastEmailsSent = 0;
  metrics.lastErrorMessage = null;

  try {
    if (!isEmailConfigured()) {
      console.log("[interview-reengagement] Email not configured — skipping cycle.");
      return;
    }

    // Find users who interacted with interview but didn't complete,
    // within the 22–26 hour abandonment window.
    const abandonedUsers = await db.manyOrNone(`
      WITH interview_starters AS (
        -- Users who viewed the interview tab or started a session 22-26h ago
        SELECT DISTINCT ue.user_identifier, MAX(ue.created_at) AS last_interaction
        FROM user_events ue
        WHERE ue.event_type IN ('page_view', 'feature_used', 'interview_session_started')
          AND (
            ue.view = 'interview'
            OR ue.event_label IN ('interview', 'interview_hot_seat', 'mock_interview', 'interview_prep')
            OR (ue.event_type = 'interview_session_started')
          )
          AND ue.created_at >= NOW() - INTERVAL '${ABANDONMENT_WINDOW_HOURS_MAX} hours'
          AND ue.created_at <= NOW() - INTERVAL '${ABANDONMENT_WINDOW_HOURS_MIN} hours'
        GROUP BY ue.user_identifier
      ),
      completers AS (
        -- Users who completed a session since their last interaction
        SELECT DISTINCT ue.user_identifier
        FROM user_events ue
        WHERE ue.event_type = 'interview_session_completed'
          AND ue.created_at >= NOW() - INTERVAL '${ABANDONMENT_WINDOW_HOURS_MAX} hours'
      ),
      already_emailed AS (
        -- Users who already got this email in the cooldown window
        SELECT DISTINCT user_identifier
        FROM email_reengagement_log
        WHERE email_type = 'interview_abandonment'
          AND status IN ('sent', 'delivered')
          AND created_at >= NOW() - INTERVAL '${COOLDOWN_DAYS} days'
      )
      SELECT s.user_identifier, s.last_interaction
      FROM interview_starters s
      LEFT JOIN completers c ON c.user_identifier = s.user_identifier
      LEFT JOIN already_emailed ae ON ae.user_identifier = s.user_identifier
      WHERE c.user_identifier IS NULL
        AND ae.user_identifier IS NULL
      LIMIT 50;
    `);

    if (!abandonedUsers || abandonedUsers.length === 0) {
      console.log("[interview-reengagement] No abandoned users found this cycle.");
      return;
    }

    console.log(`[interview-reengagement] Found ${abandonedUsers.length} abandoned interview users.`);

    for (const row of abandonedUsers) {
      try {
        // Look up user's email and name
        const user = await db.oneOrNone(
          `SELECT email, name FROM users WHERE id::text = $1 OR firebase_uid = $1 LIMIT 1`,
          [row.user_identifier]
        );

        if (!user?.email) {
          // Log as skipped — no email on file
          await db.none(
            `INSERT INTO email_reengagement_log (user_identifier, email_type, recipient_email, status, metadata)
             VALUES ($1, 'interview_abandonment', '', 'skipped', $2)`,
            [row.user_identifier, JSON.stringify({ reason: "no_email_found" })]
          );
          continue;
        }

        const firstName = (user.name || "").split(/\s+/)[0] || "there";

        const result = await sendInterviewAbandonmentEmail({
          toEmail: user.email,
          firstName,
        });

        await db.none(
          `INSERT INTO email_reengagement_log (user_identifier, email_type, recipient_email, resend_id, status, metadata)
           VALUES ($1, 'interview_abandonment', $2, $3, $4, $5)`,
          [
            row.user_identifier,
            user.email,
            result.id || null,
            result.success ? "sent" : "failed",
            JSON.stringify({
              last_interaction: row.last_interaction,
              error: result.success ? undefined : String(result.error),
            }),
          ]
        );

        if (result.success) {
          metrics.lastEmailsSent++;
          metrics.totalEmailsSent++;
          console.log(`[interview-reengagement] Sent to ${user.email} (user: ${row.user_identifier})`);
        } else {
          console.warn(`[interview-reengagement] Failed for ${user.email}:`, result.error);
        }
      } catch (userErr: any) {
        console.error(`[interview-reengagement] Error processing user ${row.user_identifier}:`, userErr.message);
      }
    }

    console.log(`[interview-reengagement] Cycle complete. Sent ${metrics.lastEmailsSent} emails.`);
  } catch (err: any) {
    metrics.lastErrorMessage = err.message || String(err);
    console.error("[interview-reengagement] Cycle error:", err);
  } finally {
    metrics.running = false;
    scheduleNext();
  }
}

function scheduleNext(): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void runCycle(), INTERVAL_MS);
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function startInterviewReengagementScheduler(): void {
  const enabled = (process.env[ENABLED_KEY] || "true").toLowerCase();
  if (enabled === "false" || enabled === "0") {
    console.log("[interview-reengagement] Disabled via env.");
    metrics.enabled = false;
    return;
  }
  metrics.enabled = true;
  console.log(`[interview-reengagement] Scheduler starting (initial delay: ${INITIAL_DELAY_MS}ms, interval: ${INTERVAL_MS}ms)`);
  timer = setTimeout(() => void runCycle(), INITIAL_DELAY_MS);
}

export function stopInterviewReengagementScheduler(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  metrics.enabled = false;
  console.log("[interview-reengagement] Scheduler stopped.");
}

export function getReengagementMetrics(): ReengagementMetrics {
  return { ...metrics };
}
