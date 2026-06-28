/**
 * Frontend Stripe helpers.
 *
 * Stripe is controlled by the VITE_STRIPE_ENABLED env variable.
 * When false (default) the app uses direct plan activation (no payment).
 * Set VITE_STRIPE_ENABLED=true to redirect users to Stripe Checkout.
 */

const API_BASE = (
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL  ||
  "http://localhost:3001"
).replace(/\/+$|\/api$/, "");

/** True only when VITE_STRIPE_ENABLED=true is set at build time. */
export const STRIPE_ENABLED = import.meta.env.VITE_STRIPE_ENABLED === "true";

/**
 * Creates a Stripe Checkout Session on the server and returns the hosted URL.
 * Call window.location.href = url to redirect the user to Stripe.
 */
export async function startStripeCheckout(
  userId: string,
  planSlug: string,
  billingPeriod: "monthly" | "annual"
): Promise<string> {
  const successUrl = `${window.location.origin}?payment=success&plan=${planSlug}`;
  const cancelUrl  = `${window.location.origin}?payment=cancelled`;

  const res = await fetch(`${API_BASE}/api/stripe/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, planSlug, billingPeriod, successUrl, cancelUrl }),
  });

  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Could not start checkout");
  return data.url as string;
}

/** Create a Stripe Checkout session for one-time application credit pack purchases. */
export async function startCreditPackCheckout(
  userId: string,
  packId: string
): Promise<string> {
  const successUrl = `${window.location.origin}?payment=success&purchase=credits&pack=${encodeURIComponent(packId)}`;
  const cancelUrl = `${window.location.origin}?payment=cancelled&purchase=credits`;

  const res = await fetch(`${API_BASE}/api/stripe/checkout/credits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, packId, successUrl, cancelUrl }),
  });

  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Could not start credit pack checkout");
  return data.url as string;
}

/** Open the Stripe Billing Portal so a user can manage / cancel their subscription. */
export async function openBillingPortal(
  stripeCustomerId: string,
  returnUrl = window.location.href
): Promise<string> {
  const res = await fetch(`${API_BASE}/api/stripe/portal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customerId: stripeCustomerId, returnUrl }),
  });

  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Could not open billing portal");
  return data.url as string;
}
