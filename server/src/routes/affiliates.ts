import { Router, type Request, type Response } from "express";
import {
  getAllAffiliatePartners,
  recordAffiliateClick,
  recordAffiliateConversion,
  getAffiliateStats,
} from "../services/subscriptionService.js";
import * as crypto from "crypto";

const router = Router();

// GET /api/affiliates
router.get("/", async (req: Request, res: Response) => {
  try {
    const { category } = req.query as { category?: string };
    const partners = await getAllAffiliatePartners(category);
    res.json({ success: true, partners });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/affiliates/click/:partnerId  – record a tracked click
router.post("/click/:partnerId", async (req: Request, res: Response) => {
  try {
    const { userId, sessionId, sourceView } = req.body;
    const rawIp = req.ip ?? req.socket.remoteAddress ?? "";
    const ipHash = crypto.createHash("sha256").update(rawIp).digest("hex");

    const clickId = await recordAffiliateClick({
      partnerId: req.params.partnerId,
      userIdentifier: userId,
      sessionId,
      sourceView,
      ipHash,
      userAgent: req.headers["user-agent"],
      referrer: req.headers["referer"] as string | undefined,
    });

    res.json({ success: true, clickId });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/affiliates/convert  – record a conversion
router.post("/convert", async (req: Request, res: Response) => {
  try {
    const { partnerId, clickId, userId, conversionType, revenueUsd } = req.body;
    if (!partnerId) return res.status(400).json({ success: false, error: "partnerId required" });

    await recordAffiliateConversion({
      partnerId,
      clickId,
      userIdentifier: userId,
      conversionType,
      revenueUsd,
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/affiliates/stats/:partnerId?   – aggregate stats
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const { partnerId } = req.query as { partnerId?: string };
    const stats = await getAffiliateStats(partnerId);
    res.json({ success: true, ...stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
