/**
 * emailService.ts — Centralized Resend email service for CareerVision.
 *
 * Local dev:
 *   - Set RESEND_API_KEY in the root .env (starts with "re_").
 *   - RESEND_FROM defaults to "CareerVision AI <onboarding@resend.dev>".
 *   - Resend sandbox only delivers to your Resend account's verified email.
 *     Auto-replies to arbitrary users will silently fail in sandbox mode.
 *   - Use RESEND_DEV_OVERRIDE_TO=your@email.com to redirect ALL outbound
 *     mail to a single address during local development.
 *
 * Production:
 *   - RESEND_FROM must use a domain you have verified in the Resend dashboard
 *     (e.g. "CareerVision AI <noreply@decodflow.com>").
 *   - Remove / leave unset RESEND_DEV_OVERRIDE_TO.
 *   - NODE_ENV=production
 */

import { Resend } from "resend";

// ─── Singleton client ────────────────────────────────────────────────────────

let _resend: Resend | null = null;

function getClient(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not set. Email delivery is unavailable.");
    }
    _resend = new Resend(apiKey);
  }
  return _resend;
}

/** Reset the singleton (useful in tests or after env hot-reload). */
export function resetEmailClient(): void {
  _resend = null;
}

// ─── Config helpers ──────────────────────────────────────────────────────────

/** Sender address. Must be a verified Resend domain in production. */
export function getFromAddress(): string {
  return process.env.RESEND_FROM || "CareerVision AI <onboarding@resend.dev>";
}

/**
 * In development you can redirect ALL outbound email to one address so sandbox
 * restrictions don't break the flow.  Set RESEND_DEV_OVERRIDE_TO=you@example.com.
 */
function resolveRecipient(to: string): string {
  if (process.env.NODE_ENV !== "production" && process.env.RESEND_DEV_OVERRIDE_TO) {
    return process.env.RESEND_DEV_OVERRIDE_TO;
  }
  return to;
}

/** Returns true only when a real API key is configured. */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

// ─── HTML utility ────────────────────────────────────────────────────────────

/** Escape user-supplied strings before embedding in HTML email bodies. */
function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── Email senders ───────────────────────────────────────────────────────────

export interface SendResult {
  success: boolean;
  id?: string;
  error?: unknown;
}

/**
 * Send admin notification when a user submits the contact form.
 */
export async function sendContactNotification(params: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<SendResult> {
  const { name, email, subject, message } = params;
  const safeName    = escHtml(name);
  const safeEmail   = escHtml(email);
  const safeSubject = escHtml(subject);
  const safeMessage = escHtml(message);

  try {
    const { data, error } = await getClient().emails.send({
      from:    getFromAddress(),
      to:      "cviinfo79@gmail.com",
      replyTo: email,                     // raw value for RFC header
      subject: `[CareerVision Contact] ${safeSubject}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:32px;border-radius:12px;">
          <div style="background:#1e293b;padding:24px;border-radius:10px;margin-bottom:24px;">
            <h2 style="color:white;margin:0;font-size:20px;">New Contact Form Submission</h2>
            <p style="color:#94a3b8;margin:6px 0 0;font-size:13px;">CareerVision AI — easycareer-ai.decodflow.com</p>
          </div>
          <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06);">
            <tr style="background:#f1f5f9;">
              <td style="padding:12px 16px;font-weight:700;font-size:12px;text-transform:uppercase;color:#64748b;width:100px;">From</td>
              <td style="padding:12px 16px;font-size:14px;color:#1e293b;">${safeName}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-weight:700;font-size:12px;text-transform:uppercase;color:#64748b;">Email</td>
              <td style="padding:12px 16px;font-size:14px;"><a href="mailto:${safeEmail}" style="color:#4f46e5;">${safeEmail}</a></td>
            </tr>
            <tr style="background:#f1f5f9;">
              <td style="padding:12px 16px;font-weight:700;font-size:12px;text-transform:uppercase;color:#64748b;">Subject</td>
              <td style="padding:12px 16px;font-size:14px;color:#1e293b;">${safeSubject}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-weight:700;font-size:12px;text-transform:uppercase;color:#64748b;vertical-align:top;">Message</td>
              <td style="padding:12px 16px;font-size:14px;color:#334155;white-space:pre-wrap;line-height:1.6;">${safeMessage}</td>
            </tr>
          </table>
          <p style="margin-top:20px;font-size:11px;color:#94a3b8;text-align:center;">
            Sent from CareerVision AI contact form · ${new Date().toUTCString()}
          </p>
        </div>`,
    });

    if (error) return { success: false, error };
    return { success: true, id: data?.id };
  } catch (err) {
    return { success: false, error: err };
  }
}

/**
 * Send an auto-reply to the user after they submit the contact form.
 * NOTE: In Resend sandbox mode this will fail for unverified recipient addresses.
 *       Set RESEND_DEV_OVERRIDE_TO to redirect to a verified address during development.
 */
export async function sendContactAutoReply(params: {
  toEmail: string;
  name: string;
  message: string;
}): Promise<SendResult> {
  const { toEmail, name, message } = params;
  const safeName    = escHtml(name);
  const safeMessage = escHtml(message);

  try {
    const { data, error } = await getClient().emails.send({
      from:    getFromAddress(),
      to:      resolveRecipient(toEmail),
      subject: "We received your message — CareerVision AI",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:32px;border-radius:12px;">
          <div style="background:#1e293b;padding:24px;border-radius:10px;margin-bottom:24px;text-align:center;">
            <span style="color:white;font-size:18px;font-weight:900;">CareerVision<span style="color:#818cf8;font-style:italic;">AI</span></span>
          </div>
          <h2 style="color:#1e293b;font-size:20px;margin-bottom:8px;">Thanks, ${safeName}!</h2>
          <p style="color:#64748b;font-size:14px;line-height:1.6;">
            We&apos;ve received your message and will get back to you within <strong>1–2 business days</strong>.
          </p>
          <div style="background:white;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin:20px 0;">
            <p style="color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:700;margin:0 0 8px;">Your message</p>
            <p style="color:#334155;font-size:13px;line-height:1.6;margin:0;white-space:pre-wrap;">${safeMessage}</p>
          </div>
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px;margin-top:20px;">
            <p style="color:#1e40af;font-size:13px;margin:0;">
              In the meantime, explore your career roadmap at
              <a href="https://easycareer-ai.decodflow.com" style="color:#4f46e5;font-weight:700;">easycareer-ai.decodflow.com</a>
            </p>
          </div>
          <p style="margin-top:24px;font-size:11px;color:#94a3b8;text-align:center;">
            &copy; 2026 CareerVision AI &middot; decodflow.com<br/>
            <a href="mailto:cviinfo79@gmail.com" style="color:#94a3b8;">cviinfo79@gmail.com</a>
          </p>
        </div>`,
    });

    if (error) return { success: false, error };
    return { success: true, id: data?.id };
  } catch (err) {
    return { success: false, error: err };
  }
}

/**
 * Send a password-reset token email.
 */
export async function sendPasswordResetEmail(params: {
  toEmail: string;
  token: string;
}): Promise<SendResult> {
  const { toEmail, token } = params;
  // token is a UUID generated server-side — no escaping needed, but we still escape defensively
  const safeToken = escHtml(token);

  try {
    const { data, error } = await getClient().emails.send({
      from:    getFromAddress(),
      to:      resolveRecipient(toEmail),
      subject: "Your CareerVision Password Reset Token",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:32px;border-radius:12px;">
          <div style="background:#1e293b;padding:24px;border-radius:10px;margin-bottom:24px;">
            <h2 style="color:white;margin:0;font-size:20px;">Reset Your Password</h2>
            <p style="color:#94a3b8;margin:6px 0 0;font-size:13px;">CareerVision AI</p>
          </div>
          <p style="color:#64748b;font-size:14px;margin-bottom:24px;">
            Use the token below to reset your password. It expires in <strong style="color:#1e293b;">1 hour</strong>.
          </p>
          <div style="background:white;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:24px;text-align:center;">
            <p style="font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:700;margin:0 0 12px;">Reset Token</p>
            <code style="font-size:15px;color:#4f46e5;font-family:monospace;font-weight:bold;word-break:break-all;">${safeToken}</code>
          </div>
          <p style="color:#64748b;font-size:13px;line-height:1.6;">
            Copy this token, return to the app, and paste it into the Reset Password form along with your new password.
          </p>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px;">
            If you did not request a password reset, you can safely ignore this email.
          </p>
        </div>`,
    });

    if (error) return { success: false, error };
    return { success: true, id: data?.id };
  } catch (err) {
    return { success: false, error: err };
  }
}

/**
 * Send a welcome email after a new user registers.
 */
export async function sendWelcomeEmail(params: {
  toEmail: string;
  name: string;
}): Promise<SendResult> {
  const { toEmail, name } = params;
  const safeName = escHtml(name);

  try {
    const { data, error } = await getClient().emails.send({
      from:    getFromAddress(),
      to:      resolveRecipient(toEmail),
      subject: "Welcome to CareerVision AI 🚀",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:32px;border-radius:12px;">
          <div style="background:#1e293b;padding:24px;border-radius:10px;margin-bottom:24px;text-align:center;">
            <span style="color:white;font-size:22px;font-weight:900;">CareerVision<span style="color:#818cf8;font-style:italic;">AI</span></span>
          </div>
          <h2 style="color:#1e293b;font-size:22px;margin-bottom:8px;">Welcome, ${safeName}! 👋</h2>
          <p style="color:#64748b;font-size:14px;line-height:1.6;">
            Your CareerVision AI account is ready. Start exploring your personalised career roadmap,
            preparing for interviews, and discovering the best opportunities for your goals.
          </p>
          <div style="margin:28px 0;text-align:center;">
            <a href="https://easycareer-ai.decodflow.com"
               style="background:#4f46e5;color:white;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;display:inline-block;">
              Launch CareerVision AI
            </a>
          </div>
          <div style="background:white;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin-top:16px;">
            <p style="font-size:12px;color:#64748b;margin:0 0 10px;font-weight:700;text-transform:uppercase;">Quick-start checklist</p>
            <ul style="font-size:13px;color:#334155;line-height:2;margin:0;padding-left:20px;">
              <li>Complete your career profile</li>
              <li>Explore your AI-generated Career Roadmap</li>
              <li>Try the Interview Hot Seat simulator</li>
              <li>Upload or build your resume</li>
            </ul>
          </div>
          <p style="margin-top:24px;font-size:11px;color:#94a3b8;text-align:center;">
            &copy; 2026 CareerVision AI &middot; decodflow.com<br/>
            <a href="mailto:cviinfo79@gmail.com" style="color:#94a3b8;">cviinfo79@gmail.com</a>
          </p>
        </div>`,
    });

    if (error) return { success: false, error };
    return { success: true, id: data?.id };
  } catch (err) {
    return { success: false, error: err };
  }
}
