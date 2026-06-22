import { Router, type Request, type Response } from "express";
import {
  getAllPlans,
  getUserSubscription,
  activateSubscription,
  cancelSubscription,
  canUseFeature,
  incrementFeatureUsage,
  createEnterpriseAccount,
  getEnterpriseAccount,
  getUserEnterpriseAccount,
  inviteEnterpriseSeat,
  type PlanSlug,
  type FeatureKey,
} from "../services/subscriptionService.js";

const router = Router();

// GET /api/subscription/plans
router.get("/plans", async (_req: Request, res: Response) => {
  try {
    const plans = await getAllPlans();
    res.json({ success: true, plans });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/subscription/user/:userId
router.get("/user/:userId", async (req: Request, res: Response) => {
  try {
    const sub = await getUserSubscription(req.params.userId);
    res.json({ success: true, subscription: sub });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/subscription/activate
router.post("/activate", async (req: Request, res: Response) => {
  try {
    const { userId, planSlug, billingPeriod, externalId } = req.body;
    if (!userId || !planSlug) {
      return res.status(400).json({ success: false, error: "userId and planSlug are required" });
    }
    const sub = await activateSubscription(
      userId,
      planSlug as PlanSlug,
      billingPeriod ?? "monthly",
      externalId
    );
    res.json({ success: true, subscription: sub });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/subscription/cancel
router.post("/cancel", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: "userId required" });
    await cancelSubscription(userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/subscription/feature-access/:userId/:featureKey
router.get("/feature-access/:userId/:featureKey", async (req: Request, res: Response) => {
  try {
    const result = await canUseFeature(
      req.params.userId,
      req.params.featureKey as FeatureKey
    );
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/subscription/feature-use
router.post("/feature-use", async (req: Request, res: Response) => {
  try {
    const { userId, featureKey } = req.body;
    if (!userId || !featureKey) {
      return res.status(400).json({ success: false, error: "userId and featureKey are required" });
    }
    const check = await canUseFeature(userId, featureKey as FeatureKey);
    if (!check.allowed) {
      return res.status(403).json({ success: false, error: "Feature limit reached", ...check });
    }
    await incrementFeatureUsage(userId, featureKey as FeatureKey);
    res.json({ success: true, ...check });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Enterprise ─────────────────────────────────────────────────────────────

// POST /api/subscription/enterprise
router.post("/enterprise", async (req: Request, res: Response) => {
  try {
    const { companyName, domain, industry, size, ownerUserId, seatLimit, billingEmail } = req.body;
    if (!companyName || !ownerUserId) {
      return res.status(400).json({ success: false, error: "companyName and ownerUserId required" });
    }
    const account = await createEnterpriseAccount({
      companyName, domain, industry, size, billingEmail,
      ownerIdentifier: ownerUserId,
      seatLimit: seatLimit ?? 10,
    });
    res.json({ success: true, account });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/subscription/enterprise/:accountId
router.get("/enterprise/:accountId", async (req: Request, res: Response) => {
  try {
    const account = await getEnterpriseAccount(req.params.accountId);
    if (!account) return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true, account });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/subscription/enterprise/user/:userId
router.get("/enterprise/user/:userId", async (req: Request, res: Response) => {
  try {
    const account = await getUserEnterpriseAccount(req.params.userId);
    res.json({ success: true, account });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/subscription/enterprise/:accountId/invite
router.post("/enterprise/:accountId/invite", async (req: Request, res: Response) => {
  try {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ success: false, error: "email required" });
    await inviteEnterpriseSeat(req.params.accountId, email, role ?? "member");
    res.json({ success: true });
  } catch (err: any) {
    res.status(err.message.includes("limit") ? 403 : 500).json({ success: false, error: err.message });
  }
});

export default router;
