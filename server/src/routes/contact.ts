import { Router, Request, Response } from "express";
import {
  isEmailConfigured,
  sendContactNotification,
  sendContactAutoReply,
} from "../services/emailService.js";

const router = Router();

// ─── Simple in-memory rate limiter ─────────────────────────────────────────
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 3;
const ipMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_MAX) return true;
  entry.count++;
  return false;
}

// ─── POST /api/contact/send ──────────────────────────────────────────────────
router.post("/send", async (req: Request, res: Response) => {
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";

  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many requests. Please wait a few minutes before trying again." });
  }

  const { name, email, subject, message } = req.body;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: "Name, email, and message are required." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Please provide a valid email address." });
  }

  const safeName    = name.trim().slice(0, 100);
  const safeEmail   = email.trim().slice(0, 200);
  const safeSubject = (subject || "Contact Form Enquiry").trim().slice(0, 200);
  const safeMessage = message.trim().slice(0, 5000);

  if (!isEmailConfigured()) {
    console.error("[Contact] RESEND_API_KEY is not set");
    const adminEmail = process.env.ADMIN_EMAIL || "support@careervision.ai";
    return res.status(500).json({ error: `Email service is not configured. Please email us directly at ${adminEmail}` });
  }

  try {
    // Notification email to admin inbox
    const notifResult = await sendContactNotification({
      name: safeName,
      email: safeEmail,
      subject: safeSubject,
      message: safeMessage,
    });

    if (!notifResult.success) {
      console.error("[Contact] Resend notification error:", notifResult.error);
      const adminEmail = process.env.ADMIN_EMAIL || "support@careervision.ai";
      return res.status(500).json({ error: `Failed to send message. Please email us directly at ${adminEmail}` });
    }

    // Auto-reply to sender (non-critical — sandbox may reject unverified recipients)
    const replyResult = await sendContactAutoReply({
      toEmail: safeEmail,
      name: safeName,
      message: safeMessage,
    });

    if (!replyResult.success) {
      console.warn("[Contact] Auto-reply failed (non-critical):", replyResult.error);
    }

    console.log(`[Contact] Message from ${safeName} <${safeEmail}> sent via Resend`);
    res.json({ success: true, message: "Your message has been sent. We'll be in touch soon!" });

  } catch (error) {
    console.error("[Contact] Email send error:", error);
    const adminEmail = process.env.ADMIN_EMAIL || "support@careervision.ai";
    res.status(500).json({ error: `Failed to send message. Please email us directly at ${adminEmail}` });
  }
});

export default router;
