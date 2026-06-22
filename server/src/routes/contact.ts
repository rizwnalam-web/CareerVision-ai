import { Router, Request, Response } from "express";
import { Resend } from "resend";

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

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[Contact] RESEND_API_KEY is not set");
    return res.status(500).json({ error: "Email service is not configured. Please email us directly at cviinfo79@gmail.com" });
  }

  try {
    const resend = new Resend(apiKey);
    const toAddress = "cviinfo79@gmail.com";
    // Sender: must be a verified domain in Resend. Use onboarding@resend.dev for testing,
    // or noreply@decodflow.com once decodflow.com is verified in Resend dashboard.
    const fromAddress = process.env.RESEND_FROM || "CareerVision AI <onboarding@resend.dev>";

    // Notification email to inbox
    const { error: notifError } = await resend.emails.send({
      from: fromAddress,
      to: toAddress,
      replyTo: safeEmail,
      subject: `[CareerVision Contact] ${safeSubject}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px; border-radius: 12px;">
          <div style="background: #1e293b; padding: 24px; border-radius: 10px; margin-bottom: 24px;">
            <h2 style="color: white; margin: 0; font-size: 20px;">New Contact Form Submission</h2>
            <p style="color: #94a3b8; margin: 6px 0 0; font-size: 13px;">CareerVision AI — easycareer-ai.decodflow.com</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">
            <tr style="background: #f1f5f9;">
              <td style="padding: 12px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; color: #64748b; width: 100px;">From</td>
              <td style="padding: 12px 16px; font-size: 14px; color: #1e293b;">${safeName}</td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; color: #64748b;">Email</td>
              <td style="padding: 12px 16px; font-size: 14px;"><a href="mailto:${safeEmail}" style="color: #4f46e5;">${safeEmail}</a></td>
            </tr>
            <tr style="background: #f1f5f9;">
              <td style="padding: 12px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; color: #64748b;">Subject</td>
              <td style="padding: 12px 16px; font-size: 14px; color: #1e293b;">${safeSubject}</td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; color: #64748b; vertical-align: top;">Message</td>
              <td style="padding: 12px 16px; font-size: 14px; color: #334155; white-space: pre-wrap; line-height: 1.6;">${safeMessage}</td>
            </tr>
          </table>
          <p style="margin-top: 20px; font-size: 11px; color: #94a3b8; text-align: center;">
            Sent from CareerVision AI contact form · ${new Date().toUTCString()}
          </p>
        </div>
      `,
    });

    if (notifError) {
      console.error("[Contact] Resend notification error:", notifError);
      return res.status(500).json({ error: "Failed to send message. Please email us directly at cviinfo79@gmail.com" });
    }

    // Auto-reply to sender
    const { error: replyError } = await resend.emails.send({
      from: fromAddress,
      to: safeEmail,
      subject: "We received your message — CareerVision AI",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px; border-radius: 12px;">
          <div style="background: #1e293b; padding: 24px; border-radius: 10px; margin-bottom: 24px; text-align: center;">
            <div style="display: inline-flex; align-items: center; gap: 8px;">
              <div style="width: 36px; height: 36px; background: #4f46e5; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 14px;">CV</div>
              <span style="color: white; font-size: 18px; font-weight: 900;">CareerVision<span style="color: #818cf8; font-style: italic;">AI</span></span>
            </div>
          </div>
          <h2 style="color: #1e293b; font-size: 20px; margin-bottom: 8px;">Thanks, ${safeName}!</h2>
          <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
            We've received your message and will get back to you within <strong>1–2 business days</strong>.
          </p>
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <p style="color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: 700; margin: 0 0 8px;">Your message</p>
            <p style="color: #334155; font-size: 13px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${safeMessage}</p>
          </div>
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 16px; margin-top: 20px;">
            <p style="color: #1e40af; font-size: 13px; margin: 0;">
              In the meantime, explore your career roadmap at
              <a href="https://easycareer-ai.decodflow.com" style="color: #4f46e5; font-weight: 700;">easycareer-ai.decodflow.com</a>
            </p>
          </div>
          <p style="margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center;">
            © 2026 CareerVision AI · decodflow.com<br/>
            <a href="mailto:cviinfo79@gmail.com" style="color: #94a3b8;">cviinfo79@gmail.com</a> · +1 437 997 4711
          </p>
        </div>
      `,
    });

    if (replyError) {
      console.warn("[Contact] Auto-reply failed (non-critical):", replyError);
    }

    console.log(`[Contact] Message from ${safeName} <${safeEmail}> sent via Resend`);
    res.json({ success: true, message: "Your message has been sent. We'll be in touch soon!" });

  } catch (error) {
    console.error("[Contact] Email send error:", error);
    res.status(500).json({ error: "Failed to send message. Please email us directly at cviinfo79@gmail.com" });
  }
});

export default router;
