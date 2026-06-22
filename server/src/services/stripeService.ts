/**
 * Stripe payment gateway integration.
 *
 * Toggle on/off via env:  STRIPE_ENABLED=true  (default: false)
 *
 * Required env vars (only when STRIPE_ENABLED=true):
 *   STRIPE_SECRET_KEY          — sk_live_... or sk_test_...
 *   STRIPE_WEBHOOK_SECRET      — whsec_...  (from Stripe dashboard)
 *   STRIPE_PRICE_PRO_MONTHLY   — price_...
 *   STRIPE_PRICE_PRO_ANNUAL    — price_...
 *   STRIPE_PRICE_TEAM_MONTHLY  — price_...
 *   STRIPE_PRICE_TEAM_ANNUAL   — price_...
 */

import Stripe from "stripe";

export const STRIPE_ENABLED = process.env.STRIPE_ENABLED === "true";

// Initialise client only when enabled (avoids errors on missing secret key)
const stripe: Stripe | null = STRIPE_ENABLED
  ? new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-05-27.dahlia" })
  : null;

// Map planSlug:billingPeriod → Stripe Price ID
const PRICE_IDS: Record<string, string> = {
  "pro:monthly":  process.env.STRIPE_PRICE_PRO_MONTHLY  || "",
  "pro:annual":   process.env.STRIPE_PRICE_PRO_ANNUAL   || "",
  "team:monthly": process.env.STRIPE_PRICE_TEAM_MONTHLY || "",
  "team:annual":  process.env.STRIPE_PRICE_TEAM_ANNUAL  || "",
};

/** Create a Stripe Checkout Session and return the hosted URL. */
export async function createCheckoutSession(
  userId: string,
  planSlug: string,
  billingPeriod: "monthly" | "annual",
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  if (!stripe) throw new Error("Stripe is not enabled");

  const key = `${planSlug}:${billingPeriod}`;
  const priceId = PRICE_IDS[key];
  if (!priceId) {
    throw new Error(
      `No Stripe Price ID configured for "${key}". ` +
      `Set STRIPE_PRICE_${planSlug.toUpperCase()}_${billingPeriod.toUpperCase()} in your environment.`
    );
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: userId,
    metadata: { userId, planSlug, billingPeriod },
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}

/** Verify and parse a Stripe webhook payload (requires raw body buffer). */
export function constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
  if (!stripe) throw new Error("Stripe is not enabled");
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}

/** Create a Stripe Billing Portal session for subscription management. */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  if (!stripe) throw new Error("Stripe is not enabled");
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}
