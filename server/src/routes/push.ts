import { Router, Request, Response } from "express";
import * as pushService from "../services/pushService.js";

const router = Router();

// ── VAPID public key (safe to expose) ────────────────────────────────────────
router.get("/vapid-public-key", (_req: Request, res: Response) => {
  const key = pushService.VAPID_PUBLIC_KEY;
  if (!key) {
    return res.status(503).json({ error: "Push notifications not configured on this server." });
  }
  res.json({ publicKey: key });
});

// ── Subscribe ─────────────────────────────────────────────────────────────────
router.post("/subscribe", async (req: Request, res: Response) => {
  try {
    const { userId, subscription } = req.body;
    if (!userId || !subscription?.endpoint || !subscription?.keys) {
      return res.status(400).json({ error: "userId and a valid subscription object are required" });
    }
    const userAgent = req.headers["user-agent"] ?? undefined;
    await pushService.saveSubscription(userId, subscription, userAgent as string);

    // Seed default preferences if this is the first subscription
    await pushService.upsertPreferences(userId, {});

    res.json({ success: true });
  } catch (err) {
    console.error("Push subscribe error:", err);
    res.status(500).json({ error: "Failed to save subscription" });
  }
});

// ── Unsubscribe ───────────────────────────────────────────────────────────────
router.post("/unsubscribe", async (req: Request, res: Response) => {
  try {
    const { userId, endpoint } = req.body;
    if (!userId || !endpoint) {
      return res.status(400).json({ error: "userId and endpoint are required" });
    }
    await pushService.removeSubscription(userId, endpoint);
    res.json({ success: true });
  } catch (err) {
    console.error("Push unsubscribe error:", err);
    res.status(500).json({ error: "Failed to remove subscription" });
  }
});

// ── Alert preferences ─────────────────────────────────────────────────────────
router.get("/preferences/:userId", async (req: Request, res: Response) => {
  try {
    const prefs = await pushService.getPreferences(req.params.userId);
    res.json({ success: true, data: prefs });
  } catch (err) {
    console.error("Push preferences error:", err);
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
});

router.put("/preferences", async (req: Request, res: Response) => {
  try {
    const { userId, preferences } = req.body;
    if (!userId || !preferences) {
      return res.status(400).json({ error: "userId and preferences are required" });
    }
    await pushService.upsertPreferences(userId, preferences);
    res.json({ success: true });
  } catch (err) {
    console.error("Push preferences update error:", err);
    res.status(500).json({ error: "Failed to update preferences" });
  }
});

// ── Send notification (internal / admin use) ──────────────────────────────────
router.post("/send", async (req: Request, res: Response) => {
  try {
    const { userId, notification } = req.body;
    if (!userId || !notification?.type || !notification?.title) {
      return res.status(400).json({ error: "userId, notification.type, and notification.title are required" });
    }
    const result = await pushService.sendNotification(userId, notification);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Push send error:", err);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

// ── Job alert broadcast ───────────────────────────────────────────────────────
router.post("/broadcast/job-alert", async (req: Request, res: Response) => {
  try {
    const { jobTitle, company, location, url } = req.body;
    if (!jobTitle || !company || !location) {
      return res.status(400).json({ error: "jobTitle, company, and location are required" });
    }
    await pushService.broadcastJobAlert(jobTitle, company, location, url);
    res.json({ success: true });
  } catch (err) {
    console.error("Job alert broadcast error:", err);
    res.status(500).json({ error: "Failed to broadcast job alert" });
  }
});

// ── Interview reminder ────────────────────────────────────────────────────────
router.post("/remind/interview", async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.body;
    if (!userId || !role) {
      return res.status(400).json({ error: "userId and role are required" });
    }
    await pushService.sendInterviewReminder(userId, role);
    res.json({ success: true });
  } catch (err) {
    console.error("Interview reminder error:", err);
    res.status(500).json({ error: "Failed to send interview reminder" });
  }
});

export default router;
