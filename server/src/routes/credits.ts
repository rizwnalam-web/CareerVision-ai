import { Router, type Request, type Response } from "express";
import {
  applyCreditTransaction,
  completeInitialSetupAndAwardCredits,
  getOrCreateCreditWallet,
  listCreditTransactions,
} from "../services/creditsService.js";

const router = Router();

function normaliseUser(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value || value === "undefined" || value === "null") return null;
  return value;
}

// GET /api/credits/:userId
router.get("/:userId", async (req: Request, res: Response) => {
  try {
    const userIdentifier = normaliseUser(req.params.userId);
    if (!userIdentifier) {
      return res.status(400).json({ success: false, error: "userId is required" });
    }

    const [wallet, transactions] = await Promise.all([
      getOrCreateCreditWallet(userIdentifier),
      listCreditTransactions(userIdentifier, 10),
    ]);

    res.json({ success: true, wallet, transactions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to load credits" });
  }
});

// GET /api/credits/:userId/transactions?limit=20
router.get("/:userId/transactions", async (req: Request, res: Response) => {
  try {
    const userIdentifier = normaliseUser(req.params.userId);
    if (!userIdentifier) {
      return res.status(400).json({ success: false, error: "userId is required" });
    }

    const limit = Number.parseInt(String(req.query.limit ?? "20"), 10);
    const transactions = await listCreditTransactions(userIdentifier, Number.isNaN(limit) ? 20 : limit);
    res.json({ success: true, transactions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to load transactions" });
  }
});

// POST /api/credits/setup/complete
router.post("/setup/complete", async (req: Request, res: Response) => {
  try {
    const userIdentifier = normaliseUser(req.body?.userId);
    if (!userIdentifier) {
      return res.status(400).json({ success: false, error: "userId is required" });
    }

    const result = await completeInitialSetupAndAwardCredits({
      userIdentifier,
      preferences: req.body?.preferences || {},
    });

    res.json({
      success: true,
      setupCompletedAt: result.setupCompletedAt,
      creditsAwarded: result.creditsAwarded,
      alreadyClaimed: result.alreadyClaimed,
      wallet: result.wallet,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to complete setup" });
  }
});

// POST /api/credits/spend
router.post("/spend", async (req: Request, res: Response) => {
  try {
    const userIdentifier = normaliseUser(req.body?.userId);
    const amount = Number.parseInt(String(req.body?.amount ?? "0"), 10);
    const source = typeof req.body?.source === "string" ? req.body.source.trim() : "feature_usage";

    if (!userIdentifier || amount <= 0) {
      return res.status(400).json({ success: false, error: "userId and positive amount are required" });
    }

    const { wallet, transaction } = await applyCreditTransaction({
      userIdentifier,
      direction: "debit",
      amount,
      source,
      metadata: req.body?.metadata || {},
      referenceKey: typeof req.body?.referenceKey === "string" ? req.body.referenceKey : null,
    });

    res.json({ success: true, wallet, transaction });
  } catch (err: any) {
    if (String(err?.message || "").includes("insufficient credits")) {
      return res.status(400).json({ success: false, error: "Insufficient credits" });
    }
    res.status(500).json({ success: false, error: err.message || "Failed to spend credits" });
  }
});

export default router;
