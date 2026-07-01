import webPush from "web-push";
import { db } from "../db/database.js";

// ── VAPID configuration ───────────────────────────────────────────────────────

const VAPID_PUBLIC_KEY  = process.env.VAPID_PUBLIC_KEY  || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_EMAIL       = process.env.VAPID_EMAIL       || "mailto:admin@example.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  expirationTime?: number | null;
}

export interface AlertPreferences {
  jobAlerts: boolean;
  marketUpdates: boolean;
  interviewReminders: boolean;
  weeklyDigest: boolean;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  type: "job_alert" | "market_update" | "interview_reminder" | "general";
  data?: Record<string, unknown>;
}

// ── Subscription management ───────────────────────────────────────────────────

export async function saveSubscription(
  userIdentifier: string,
  subscription: PushSubscriptionPayload,
  userAgent?: string
): Promise<void> {
  await db.none(
    `INSERT INTO push_subscriptions (user_identifier, endpoint, p256dh, auth, user_agent)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (endpoint) DO UPDATE
       SET user_identifier = EXCLUDED.user_identifier,
           p256dh          = EXCLUDED.p256dh,
           auth            = EXCLUDED.auth,
           is_active       = TRUE,
           updated_at      = NOW()`,
    [
      userIdentifier,
      subscription.endpoint,
      subscription.keys.p256dh,
      subscription.keys.auth,
      userAgent ?? null,
    ]
  );
}

export async function removeSubscription(
  userIdentifier: string,
  endpoint: string
): Promise<void> {
  await db.none(
    `UPDATE push_subscriptions
     SET is_active = FALSE, updated_at = NOW()
     WHERE user_identifier = $1 AND endpoint = $2`,
    [userIdentifier, endpoint]
  );
}

export async function getActiveSubscriptions(
  userIdentifier: string
): Promise<PushSubscriptionPayload[]> {
  const rows = await db.any<{ endpoint: string; p256dh: string; auth: string }>(
    `SELECT endpoint, p256dh, auth
     FROM push_subscriptions
     WHERE user_identifier = $1 AND is_active = TRUE`,
    [userIdentifier]
  );
  return rows.map((r) => ({
    endpoint: r.endpoint,
    keys: { p256dh: r.p256dh, auth: r.auth },
  }));
}

// ── Preferences ───────────────────────────────────────────────────────────────

export async function upsertPreferences(
  userIdentifier: string,
  prefs: Partial<AlertPreferences>
): Promise<void> {
  await db.none(
    `INSERT INTO push_preferences
       (user_identifier, job_alerts, market_updates, interview_reminders, weekly_digest)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_identifier) DO UPDATE
       SET job_alerts            = COALESCE($2, push_preferences.job_alerts),
           market_updates        = COALESCE($3, push_preferences.market_updates),
           interview_reminders   = COALESCE($4, push_preferences.interview_reminders),
           weekly_digest         = COALESCE($5, push_preferences.weekly_digest),
           updated_at            = NOW()`,
    [
      userIdentifier,
      prefs.jobAlerts     ?? null,
      prefs.marketUpdates ?? null,
      prefs.interviewReminders ?? null,
      prefs.weeklyDigest  ?? null,
    ]
  );
}

export async function getPreferences(
  userIdentifier: string
): Promise<AlertPreferences> {
  const row = await db.oneOrNone<{
    job_alerts: boolean;
    market_updates: boolean;
    interview_reminders: boolean;
    weekly_digest: boolean;
  }>(
    `SELECT job_alerts, market_updates, interview_reminders, weekly_digest
     FROM push_preferences WHERE user_identifier = $1`,
    [userIdentifier]
  );
  return {
    jobAlerts:           row?.job_alerts          ?? true,
    marketUpdates:       row?.market_updates       ?? false,
    interviewReminders:  row?.interview_reminders  ?? true,
    weeklyDigest:        row?.weekly_digest        ?? false,
  };
}

// ── Send notification ─────────────────────────────────────────────────────────

async function sendToSubscription(
  subscription: PushSubscriptionPayload,
  payload: NotificationPayload
): Promise<"sent" | "failed" | "expired"> {
  const pushSubscription: webPush.PushSubscription = {
    endpoint: subscription.endpoint,
    keys: subscription.keys,
  };

  try {
    await webPush.sendNotification(pushSubscription, JSON.stringify(payload), {
      TTL: 86400, // 24 hours
      urgency: payload.type === "job_alert" ? "high" : "normal",
    });
    return "sent";
  } catch (err: any) {
    if (err.statusCode === 404 || err.statusCode === 410) {
      // Subscription is no longer valid; deactivate it
      await db.none(
        `UPDATE push_subscriptions SET is_active = FALSE WHERE endpoint = $1`,
        [subscription.endpoint]
      );
      return "expired";
    }
    return "failed";
  }
}

/** Send a notification to all active subscriptions for a user */
export async function sendNotification(
  userIdentifier: string,
  payload: NotificationPayload
): Promise<{ sent: number; failed: number }> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("[Push] VAPID keys not configured — skipping notification");
    return { sent: 0, failed: 0 };
  }

  const subscriptions = await getActiveSubscriptions(userIdentifier);
  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    const result = await sendToSubscription(sub, payload);
    if (result === "sent") {
      sent++;
    } else {
      failed++;
    }
  }

  // Log the send attempt
  await db
    .none(
      `INSERT INTO push_log (user_identifier, notification_type, title, body, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [userIdentifier, payload.type, payload.title, payload.body, sent > 0 ? "sent" : "failed"]
    )
    .catch(() => {});

  return { sent, failed };
}

/** Broadcast a job alert to all users who have job_alerts enabled */
export async function broadcastJobAlert(
  jobTitle: string,
  company: string,
  location: string,
  url?: string
): Promise<void> {
  const users = await db.any<{ user_identifier: string }>(
    `SELECT DISTINCT s.user_identifier
     FROM push_subscriptions s
     JOIN push_preferences p ON p.user_identifier = s.user_identifier
     WHERE s.is_active = TRUE AND p.job_alerts = TRUE`
  );

  const payload: NotificationPayload = {
    title: `New Job: ${jobTitle}`,
    body:  `${company} • ${location}`,
    icon:  "/logo.svg",
    badge: "/logo.svg",
    url:   url || "/?view=jobs",
    tag:   `job-${company}-${Date.now()}`,
    type:  "job_alert",
    data:  { jobTitle, company, location },
  };

  await Promise.allSettled(
    users.map((u) => sendNotification(u.user_identifier, payload))
  );
}

/** Send interview reminder to a specific user */
export async function sendInterviewReminder(
  userIdentifier: string,
  role: string
): Promise<void> {
  const prefs = await getPreferences(userIdentifier);
  if (!prefs.interviewReminders) return;

  await sendNotification(userIdentifier, {
    title: "Interview Practice Reminder",
    body:  `Keep your ${role} interview skills sharp. A 10-min session today goes a long way!`,
    url:   "/?view=interview",
    tag:   "interview-reminder",
    type:  "interview_reminder",
  });
}

/** Send market update notification */
export async function sendMarketUpdate(
  userIdentifier: string,
  careerTitle: string,
  insight: string
): Promise<void> {
  const prefs = await getPreferences(userIdentifier);
  if (!prefs.marketUpdates) return;

  await sendNotification(userIdentifier, {
    title: `Market Update: ${careerTitle}`,
    body:  insight,
    url:   "/?view=analytics",
    tag:   "market-update",
    type:  "market_update",
  });
}

export { VAPID_PUBLIC_KEY };
