import { Router, Request, Response } from "express";
import { generateDeepSeekResponse } from "../services/deepseekService.js";

const router = Router();

/** Strip markdown fences and extract the first JSON object or array */
function extractJSON<T>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  let cleaned = raw.trim();
  const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) cleaned = fenced[1].trim();
  const jsonMatch = cleaned.match(/(\[.*\]|\{.*\})/s);
  if (jsonMatch) cleaned = jsonMatch[1];
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

// ── Platform Analytics ───────────────────────────────────────────────────────
router.get("/analytics", async (_req: Request, res: Response) => {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const dateStr = today.toISOString().slice(0, 10);

    const prompt = `Today is ${dateStr}. Generate realistic JSON analytics for a scholarship-matching platform that has been live for 18 months and serves ~1,200 active users globally. Return a SINGLE JSON object matching this TypeScript shape exactly:

{
  totalApplications: number,
  pendingApplications: number,
  approvedApplications: number,
  rejectedApplications: number,
  activeUsers: number,
  newUsersThisWeek: number,
  totalScholarships: number,
  activeScholarships: number,
  totalScholarshipValue: number,
  applicationTrends: Array<{
    date: string (YYYY-MM, all 12 months of ${year}),
    applications: number,
    approvals: number,
    rejections: number
  }>,
  topScholarships: Array<{
    scholarshipId: string,
    scholarshipTitle: string (use real scholarship names),
    applicantCount: number,
    approvedCount: number,
    rejectedCount: number,
    pendingCount: number,
    viewCount: number,
    conversionRate: number (0-100 integer)
  }> (exactly 6 entries),
  countryBreakdown: Array<{ label: string, value: number, percentage: number }> (6 countries),
  educationBreakdown: Array<{ label: string, value: number, percentage: number }> (4 education levels),
  scholarshipGaps: Array<{
    fieldOfStudy: string,
    studentDemand: number,
    availableScholarships: number,
    gapScore: number (0-100)
  }> (5 fields),
  matchingAlgorithmStats: {
    totalMatches: number,
    successfulMatches: number,
    averageMatchScore: number (50-95)
  }
}

All numbers must be internally consistent (e.g. approved + rejected + pending <= totalApplications). Return ONLY a valid JSON object. No explanation.`;

    const systemInstruction = "You are a platform analytics engine. Return only a valid JSON object with realistic metrics. No markdown fences, no explanation — only raw JSON.";

    const result = await generateDeepSeekResponse(prompt, {
      systemInstruction,
      temperature: 0.7,
      maxTokens: 3000,
    });

    if (result.source === "error") {
      console.warn("Admin analytics LLM failed:", result.error);
      return res.status(503).json({ error: "LLM temporarily unavailable" });
    }

    const data = extractJSON(result.text);
    if (!data) {
      return res.status(502).json({ error: "Failed to parse LLM response" });
    }

    res.json(data);
  } catch (err: any) {
    console.error("Admin analytics error:", err);
    res.status(503).json({ error: "Analytics temporarily unavailable" });
  }
});

// ── Scholarships CRUD ────────────────────────────────────────────────────────
router.get("/scholarships", async (_req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const prompt = `Today is ${today}. Generate a JSON array of 8 realistic scholarships for a global scholarship-matching platform. Each object MUST match this TypeScript shape EXACTLY:

{
  id: string (e.g. "sch-001"),
  type: "scholarship" | "grant" | "fellowship" | "bursary" | "award",
  title: string (use real scholarship names),
  provider: string (real organization),
  description: string,
  eligibility: {
    minGpa?: number,
    countries?: string[],
    educationLevels?: string[],
    fieldOfStudy?: string[]
  },
  benefits: Array<{ type: "full_tuition" | "partial_tuition" | "living_stipend" | "travel" | "books" | "cash_award" | "other", amount?: number, currency?: string, description?: string }>,
  totalValue?: number,
  currency: "USD",
  deadline: string (ISO date, mix of past and future relative to ${today}),
  tags: string[],
  status: "active" | "closed" | "draft" | "archived",
  featured: boolean (2 true, rest false),
  viewCount: number,
  applicationCount: number,
  createdAt: string (ISO date),
  updatedAt: string (ISO date),
  createdBy: "admin@careervision.ai"
}

Distribution: 5 active, 1 draft, 1 closed, 1 archived. Mix all 5 types. Return ONLY a valid JSON array. No explanation.`;

    const result = await generateDeepSeekResponse(prompt, {
      systemInstruction: "You are a scholarship database. Return only a valid JSON array. No markdown fences, no explanation.",
      temperature: 0.7,
      maxTokens: 4000,
    });

    if (result.source === "error") {
      console.warn("Admin scholarships LLM failed:", result.error);
      return res.json([]);
    }

    const data = extractJSON(result.text);
    res.json(data ?? []);
  } catch (err: any) {
    console.error("Admin scholarships error:", err);
    res.json([]);
  }
});

router.post("/scholarships", async (req: Request, res: Response) => {
  res.status(501).json({ error: "Not yet implemented" });
});

router.put("/scholarships/:id", async (req: Request, res: Response) => {
  res.status(501).json({ error: "Not yet implemented" });
});

router.delete("/scholarships/:id", async (req: Request, res: Response) => {
  res.status(501).json({ error: "Not yet implemented" });
});

// ── Applications ─────────────────────────────────────────────────────────────
router.get("/applications", async (req: Request, res: Response) => {
  try {
    const status = req.query.status || "all";
    const today = new Date().toISOString().slice(0, 10);
    const prompt = `Today is ${today}. Generate a JSON array of 10 realistic scholarship applications for a platform admin panel. Filter hint: status="${status}". Each object MUST match this TypeScript shape EXACTLY:

{
  id: string (e.g. "app-001"),
  scholarshipId: string (e.g. "sch-001"),
  scholarshipTitle: string (use real scholarship names),
  scholarshipType: "scholarship" | "grant" | "fellowship" | "bursary" | "award",
  applicantName: string,
  applicantEmail: string,
  applicantCountry: string,
  educationLevel: string,
  fieldOfStudy: string,
  status: "pending" | "under_review" | "approved" | "rejected" | "waitlisted",
  submittedAt: string (ISO date within last 60 days),
  gpa: number (2.5-4.0),
  matchScore: number (40-98),
  decisionReason?: string (only for approved/rejected),
  reviewedBy?: string (only for approved/rejected),
  reviewedAt?: string (ISO, only for approved/rejected)
}

${status !== "all" ? `All entries should have status="${status}".` : "Distribution: 3 pending, 3 under_review, 2 approved, 1 rejected, 1 waitlisted."}
Return ONLY a valid JSON array. No explanation.`;

    const result = await generateDeepSeekResponse(prompt, {
      systemInstruction: "You are an application management system. Return only a valid JSON array. No markdown fences, no explanation.",
      temperature: 0.7,
      maxTokens: 3000,
    });

    if (result.source === "error") {
      console.warn("Admin applications LLM failed:", result.error);
      return res.json([]);
    }

    const data = extractJSON(result.text);
    res.json(data ?? []);
  } catch (err: any) {
    console.error("Admin applications error:", err);
    res.json([]);
  }
});

router.put("/applications/:id/status", async (req: Request, res: Response) => {
  res.status(501).json({ error: "Not yet implemented" });
});

// ── Notifications ────────────────────────────────────────────────────────────
router.get("/notifications", async (_req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const prompt = `Today is ${today}. Generate a JSON array of 6 realistic admin notifications for a scholarship platform. Each object MUST match this TypeScript shape:

{
  id: string,
  type: "new_match" | "deadline_reminder" | "status_update" | "announcement" | "direct_message",
  subject: string,
  body: string,
  recipientType: "all_users" | "applicants" | "specific_users" | "scholarship_applicants",
  scholarshipId?: string,
  status: "draft" | "scheduled" | "sent" | "failed",
  scheduledAt?: string (ISO, only for scheduled items, must be after ${today}),
  sentAt?: string (ISO, within last 30 days, only for sent items),
  sentCount?: number (for sent, 100-2000),
  failedCount?: number,
  createdBy: "admin@careervision.ai",
  createdAt: string (ISO)
}

Distribution: 3 sent, 1 scheduled, 1 draft, 1 failed. Use real scholarship names. Return ONLY a valid JSON array. No explanation.`;

    const result = await generateDeepSeekResponse(prompt, {
      systemInstruction: "You are a notification management system. Return only a valid JSON array. No markdown fences, no explanation.",
      temperature: 0.7,
      maxTokens: 2000,
    });

    if (result.source === "error") {
      console.warn("Admin notifications LLM failed:", result.error);
      return res.json([]);
    }

    const data = extractJSON(result.text);
    res.json(data ?? []);
  } catch (err: any) {
    console.error("Admin notifications error:", err);
    res.json([]);
  }
});

router.post("/notifications", async (req: Request, res: Response) => {
  res.status(501).json({ error: "Not yet implemented" });
});

// ── Direct Messages ──────────────────────────────────────────────────────────
router.post("/messages", async (req: Request, res: Response) => {
  res.status(501).json({ error: "Not yet implemented" });
});

export default router;
