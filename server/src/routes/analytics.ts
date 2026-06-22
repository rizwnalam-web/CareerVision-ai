import { Router, Request, Response } from "express";
import * as analyticsService from "../services/analyticsService.js";
import type { UserProfile } from "../types/career.js";

const router = Router();

// ── User Behaviour: record one event ────────────────────────────────────────
router.post("/event", async (req: Request, res: Response) => {
  try {
    const event = req.body;
    if (!event?.userIdentifier || !event?.eventType) {
      return res.status(400).json({ error: "userIdentifier and eventType are required" });
    }
    await analyticsService.recordEvent(event);
    res.json({ success: true });
  } catch (err) {
    console.error("Analytics event error:", err);
    res.status(500).json({ error: "Failed to record event" });
  }
});

// ── User Behaviour: batch events (flush from client buffer) ──────────────────
router.post("/events/batch", async (req: Request, res: Response) => {
  try {
    const { events } = req.body;
    if (!Array.isArray(events) || !events.length) {
      return res.status(400).json({ error: "events array is required" });
    }
    if (events.length > 500) {
      return res.status(400).json({ error: "Batch size limited to 500 events" });
    }
    await analyticsService.recordEventsBatch(events);
    res.json({ success: true, recorded: events.length });
  } catch (err) {
    console.error("Batch events error:", err);
    res.status(500).json({ error: "Failed to record events" });
  }
});

// ── User Behaviour: get summary for a user ──────────────────────────────────
router.get("/behaviour/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "userId is required" });
    const summary = await analyticsService.getUserBehaviourSummary(userId);
    res.json({ success: true, data: summary });
  } catch (err) {
    console.error("Behaviour summary error:", err);
    res.status(500).json({ error: "Failed to fetch behaviour summary" });
  }
});

// ── A/B Testing: get or assign variant ──────────────────────────────────────
router.post("/ab/variant", async (req: Request, res: Response) => {
  try {
    const { testKey, userIdentifier } = req.body;
    if (!testKey || !userIdentifier) {
      return res.status(400).json({ error: "testKey and userIdentifier are required" });
    }
    const assignment = await analyticsService.getOrAssignVariant(testKey, userIdentifier);
    res.json({ success: true, data: assignment });
  } catch (err) {
    console.error("AB variant error:", err);
    res.status(500).json({ error: "Failed to get/assign variant" });
  }
});

// ── A/B Testing: get all active variants for a user ─────────────────────────
router.get("/ab/variants/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const variants = await analyticsService.getAllVariantsForUser(userId);
    res.json({ success: true, data: variants });
  } catch (err) {
    console.error("AB variants error:", err);
    res.status(500).json({ error: "Failed to fetch variants" });
  }
});

// ── Job Market Trends ────────────────────────────────────────────────────────
router.post("/market-trends", async (req: Request, res: Response) => {
  try {
    const { country, careerTitle } = req.body;
    if (!country || !careerTitle) {
      return res.status(400).json({ error: "country and careerTitle are required" });
    }
    const trends = await analyticsService.getJobMarketTrends(country, careerTitle);
    res.json({ success: true, data: trends });
  } catch (err) {
    console.error("Market trends error:", err);
    res.status(500).json({ error: "Failed to fetch market trends" });
  }
});

// ── Predictive Career Analytics ──────────────────────────────────────────────
router.post("/career-prediction", async (req: Request, res: Response) => {
  try {
    const { userIdentifier, profile } = req.body as {
      userIdentifier: string;
      profile: UserProfile;
    };
    if (!userIdentifier || !profile) {
      return res.status(400).json({ error: "userIdentifier and profile are required" });
    }
    const prediction = await analyticsService.getCareerPrediction(userIdentifier, profile);
    res.json({ success: true, data: prediction });
  } catch (err) {
    console.error("Career prediction error:", err);
    res.status(500).json({ error: "Failed to generate career prediction" });
  }
});

// ── Company Insights: single company ────────────────────────────────────────
router.post("/company-insights", async (req: Request, res: Response) => {
  try {
    const { company, country } = req.body;
    if (!company || !country) {
      return res.status(400).json({ error: "company and country are required" });
    }
    const insight = await analyticsService.getCompanyInsights(company, country);
    res.json({ success: true, data: insight });
  } catch (err) {
    console.error("Company insights error:", err);
    res.status(500).json({ error: "Failed to fetch company insights" });
  }
});

// ── Company Insights: multiple companies ────────────────────────────────────
router.post("/company-insights/batch", async (req: Request, res: Response) => {
  try {
    const { companies, country } = req.body;
    if (!Array.isArray(companies) || !country) {
      return res.status(400).json({ error: "companies array and country are required" });
    }
    if (companies.length > 10) {
      return res.status(400).json({ error: "Batch limited to 10 companies" });
    }
    const insights = await analyticsService.getMultipleCompanyInsights(companies, country);
    res.json({ success: true, data: insights });
  } catch (err) {
    console.error("Company insights batch error:", err);
    res.status(500).json({ error: "Failed to fetch company insights" });
  }
});

export default router;
