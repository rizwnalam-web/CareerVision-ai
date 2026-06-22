import { Router, type Request, type Response } from "express";
import {
  STRIPE_ENABLED,
  createCheckoutSession,
  constructWebhookEvent,
  createPortalSession,
} from "../services/stripeService.js";
import { activateSubscription, type PlanSlug } from "../services/subscriptionService.js";

const router = Router();

// GET /api/stripe/status — lets the frontend know whether Stripe is live
router.get("/status", (_req: Request, res: Response) => {
  res.json({ enabled: STRIPE_ENABLED });
});

// POST /api/stripe/checkout — create a hosted Checkout Session
// Returns { url } to redirect the user to
router.post("/checkout", async (req: Request, res: Response) => {
  if (!STRIPE_ENABLED) {
    return res.status(503).json({
      success: false,
      error: "Stripe payments are not yet enabled. Contact support to upgrade.",
    });
  }
  try {
    const { userId, planSlug, billingPeriod, successUrl, cancelUrl } = req.body;
    if (!userId || !planSlug || !successUrl || !cancelUrl) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }
    const url = await createCheckoutSession(
      userId,
      planSlug,
      billingPeriod ?? "monthly",
      successUrl,
      cancelUrl
    );
    res.json({ success: true, url });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/stripe/webhook — Stripe event handler (raw body — registered in index.ts)
// Exported so index.ts can mount it directly before express.json()
export async function stripeWebhookHandler(req: Request, res: Response) {
  if (!STRIPE_ENABLED) return res.json({ received: true });

  const sig = req.headers["stripe-signature"] as string | undefined;
  if (!sig) return res.status(400).json({ error: "Missing stripe-signature header" });

  try {
    const event = constructWebhookEvent(req.body as Buffer, sig);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Record<string, any>;
        const { userId, planSlug, billingPeriod } = session.metadata ?? {};
        if (userId && planSlug) {
          await activateSubscription(
            userId,
            planSlug as PlanSlug,
            billingPeriod ?? "monthly",
            session.subscription as string
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        // Optionally handle cancellations via webhook
        break;
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error("Stripe webhook error:", err.message);
    res.status(400).json({ error: err.message });
  }
}

// POST /api/stripe/portal — open the Stripe Billing Portal for subscription management
router.post("/portal", async (req: Request, res: Response) => {
  if (!STRIPE_ENABLED) {
    return res.status(503).json({
      success: false,
      error: "Stripe payments are not yet enabled.",
    });
  }
  try {
    const { customerId, returnUrl } = req.body;
    if (!customerId) {
      return res.status(400).json({ success: false, error: "customerId is required" });
    }
    const url = await createPortalSession(customerId, returnUrl ?? `${process.env.APP_URL || ""}/`);
    res.json({ success: true, url });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
