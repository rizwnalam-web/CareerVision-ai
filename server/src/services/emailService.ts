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

// ─── Config helpers (domain / email) ─────────────────────────────────────────

function getAppDomain(): string {
  return process.env.APP_DOMAIN || "careervision.ai";
}

function getAdminEmail(): string {
  return process.env.ADMIN_EMAIL || "support@careervision.ai";
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
      to:      process.env.ADMIN_EMAIL || "support@careervision.ai",
      replyTo: email,                     // raw value for RFC header
      subject: `[CareerVision Contact] ${safeSubject}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:32px;border-radius:12px;">
          <div style="background:#1e293b;padding:24px;border-radius:10px;margin-bottom:24px;">
            <h2 style="color:white;margin:0;font-size:20px;">New Contact Form Submission</h2>
            <p style="color:#94a3b8;margin:6px 0 0;font-size:13px;">CareerVision AI — ${getAppDomain()}</p>
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
              <a href="https://${getAppDomain()}" style="color:#4f46e5;font-weight:700;">${getAppDomain()}</a>
            </p>
          </div>
          <p style="margin-top:24px;font-size:11px;color:#94a3b8;text-align:center;">
            &copy; 2026 CareerVision AI &middot; ${getAppDomain()}<br/>
            <a href="mailto:${getAdminEmail()}" style="color:#94a3b8;">${getAdminEmail()}</a>
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
            <a href="https://${getAppDomain()}"
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
            &copy; 2026 CareerVision AI &middot; ${getAppDomain()}<br/>
            <a href="mailto:${getAdminEmail()}" style="color:#94a3b8;">${getAdminEmail()}</a>
          </p>
        </div>`,
    });

    if (error) return { success: false, error };
    return { success: true, id: data?.id };
  } catch (err) {
    return { success: false, error: err };
  }
}

// ─── Interview Abandonment Re-engagement ─────────────────────────────────────

/**
 * Send a re-engagement email when a user abandons the Interview Simulator.
 * Triggered ~24 hours after visiting / starting but not completing a session.
 */
export async function sendInterviewAbandonmentEmail(params: {
  toEmail: string;
  firstName: string;
}): Promise<SendResult> {
  const { toEmail, firstName } = params;
  const safeName = escHtml(firstName);
  const domain = getAppDomain();
  const fromRaw = getFromAddress();
  const fromAddr = fromRaw.match(/<(.+)>/)?.[1] || fromRaw;

  try {
    const { data, error } = await getClient().emails.send({
      from:    `Alex from CareerVision AI <${fromAddr}>`,
      to:      resolveRecipient(toEmail),
      subject: `Ready to finish your mock interview, ${safeName}? (Zero stress)`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:32px;border-radius:12px;">
          <div style="background:#1e293b;padding:24px;border-radius:10px;margin-bottom:24px;text-align:center;">
            <span style="color:white;font-size:22px;font-weight:900;">CareerVision<span style="color:#818cf8;font-style:italic;">AI</span></span>
          </div>

          <p style="color:#1e293b;font-size:15px;line-height:1.7;margin-bottom:16px;">
            Hi ${safeName},
          </p>

          <p style="color:#334155;font-size:14px;line-height:1.7;margin-bottom:16px;">
            We noticed you checked out the <strong>CareerVision AI Interview Simulator</strong> yesterday, but you didn&rsquo;t get a chance to finish your session.
          </p>

          <p style="color:#334155;font-size:14px;line-height:1.7;margin-bottom:16px;">
            We completely get it. Mock interviews can feel incredibly daunting&mdash;even when you&rsquo;re just practicing with an AI.
          </p>

          <p style="color:#334155;font-size:14px;line-height:1.7;margin-bottom:16px;">
            But here&rsquo;s the truth: <strong style="color:#1e293b;">The best place to draw a blank, stumble on your words, or fail a system design question is right here, in a completely private environment.</strong>
          </p>

          <p style="color:#334155;font-size:14px;line-height:1.7;margin-bottom:20px;">
            Our simulator is built to be a safe, low-stakes sandbox. There is no recruiter watching, no grading bias, and absolutely no pressure. Just raw, transparent feedback designed to help you align your technical project metrics with the STAR framework before the stakes are real.
          </p>

          <div style="background:white;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:24px;">
            <p style="color:#1e293b;font-size:14px;font-weight:700;margin:0 0 16px;">Why finish your first simulation today?</p>
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:8px 0;vertical-align:top;width:24px;"><span style="font-size:16px;">&#127919;</span></td>
                <td style="padding:8px 0 8px 8px;">
                  <strong style="color:#1e293b;font-size:13px;">Adaptive Flow</strong>
                  <p style="color:#64748b;font-size:12px;line-height:1.5;margin:4px 0 0;">Our AI dynamically tailors its questions based on your actual resume experience&mdash;no generic listicles.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;vertical-align:top;"><span style="font-size:16px;">&#11088;</span></td>
                <td style="padding:8px 0 8px 8px;">
                  <strong style="color:#1e293b;font-size:13px;">Instant STAR Alignment</strong>
                  <p style="color:#64748b;font-size:12px;line-height:1.5;margin:4px 0 0;">Get immediate, structured feedback on how to rephrase your answers to emphasize your business impact.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;vertical-align:top;"><span style="font-size:16px;">&#127381;</span></td>
                <td style="padding:8px 0 8px 8px;">
                  <strong style="color:#1e293b;font-size:13px;">Completely Free</strong>
                  <p style="color:#64748b;font-size:12px;line-height:1.5;margin:4px 0 0;">Your first interactive loops are 100% on us.</p>
                </td>
              </tr>
            </table>
          </div>

          <p style="color:#334155;font-size:14px;line-height:1.7;margin-bottom:24px;">
            Your custom workspace is waiting. Let&rsquo;s shake off the pre-interview rust and get you ready to land that next offer.
          </p>

          <div style="text-align:center;margin-bottom:28px;">
            <a href="https://${escHtml(domain)}/dashboard/interview"
               style="background:#4f46e5;color:white;text-decoration:none;padding:16px 36px;border-radius:10px;font-size:15px;font-weight:700;display:inline-block;box-shadow:0 4px 12px rgba(79,70,229,0.3);">
              Finish Your Mock Interview in 5 Minutes
            </a>
          </div>

          <p style="color:#334155;font-size:14px;line-height:1.7;margin-bottom:8px;">
            Let&rsquo;s get the interviews your real-world talent deserves,
          </p>

          <p style="color:#1e293b;font-size:14px;margin-bottom:4px;">
            <strong>Alex</strong>
          </p>
          <p style="color:#94a3b8;font-size:12px;margin:0;">
            Product Engineer, CareerVision AI
          </p>

          <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 16px;" />

          <p style="font-size:10px;color:#94a3b8;text-align:center;line-height:1.6;">
            &copy; 2026 CareerVision AI &middot; ${escHtml(domain)}<br/>
            You received this email because you have an account on CareerVision AI.<br/>
            <a href="mailto:${getAdminEmail()}" style="color:#94a3b8;">Unsubscribe</a> &middot;
            <a href="mailto:${getAdminEmail()}" style="color:#94a3b8;">${getAdminEmail()}</a>
          </p>
        </div>`,
    });

    if (error) return { success: false, error };
    return { success: true, id: data?.id };
  } catch (err) {
    return { success: false, error: err };
  }
}