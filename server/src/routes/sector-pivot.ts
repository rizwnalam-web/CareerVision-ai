import { Router, Request, Response } from "express";
import { generateDeepSeekResponse } from "../services/deepseekService.js";
import { jsonrepair } from "jsonrepair";

const router = Router();

function extractJSON(raw: string | null | undefined): string {
  if (!raw) return "{}";
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1].trim() : raw.trim();
  try { return jsonrepair(candidate); } catch { return candidate; }
}

// ── Step 1: Get sector pivot options based on user background ────────────────
router.post("/sectors", async (req: Request, res: Response) => {
  try {
    const { background, interests, skills } = req.body;
    if (!background) return res.status(400).json({ error: "background is required" });

    const prompt = `A professional with a background in "${background}", skills in [${(skills || []).join(", ")}], and interests in [${(interests || []).join(", ")}] wants to pivot to a new sector.

Generate a JSON array of 6 realistic target sectors they could pivot into. Each object MUST match:
{
  "id": string,
  "title": string (sector name, e.g. "Product Marketing", "Data Analytics"),
  "category": string (broad category),
  "description": string (2 sentences on why this pivot makes sense),
  "demandLevel": "high" | "medium" | "emerging",
  "avgSalary": string (e.g. "$85,000–$120,000"),
  "transitionDifficulty": "low" | "moderate" | "high",
  "topSkills": string[] (4–5 key skills needed)
}

Order by relevance to their background. Return ONLY a valid JSON array.`;

    const result = await generateDeepSeekResponse(prompt, {
      systemInstruction: "You are a career transition strategist. Return only valid JSON. No explanation.",
      temperature: 0.7,
      maxTokens: 2000,
    });

    const data = JSON.parse(extractJSON(result.text));
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("Sector pivot sectors error:", err);
    res.status(500).json({ error: "Failed to generate sector options" });
  }
});

// ── Step 2: Generate a scoped 3-part project for the chosen sector ───────────
router.post("/project", async (req: Request, res: Response) => {
  try {
    const { targetSector, background, skills } = req.body;
    if (!targetSector || !background) {
      return res.status(400).json({ error: "targetSector and background are required" });
    }

    const prompt = `A professional pivoting from "${background}" to "${targetSector}" with skills in [${(skills || []).join(", ")}] needs a structured capstone project.

Generate a realistic, 3-part project that mimics a real-world ${targetSector} scenario. Return a JSON object matching:
{
  "id": string,
  "targetSector": "${targetSector}",
  "originBackground": "${background}",
  "title": string (project title, e.g. "Build a Go-To-Market Strategy for a SaaS Product"),
  "scenario": string (3–4 sentences describing a realistic business scenario the student will work on),
  "estimatedHours": number (15–40),
  "skills": string[] (5–8 skills this project builds),
  "milestones": [
    {
      "id": "m1",
      "order": 1,
      "title": string (Part 1 title),
      "description": string (2–3 sentences explaining what to do),
      "deliverable": string (what the student must submit),
      "rubricCriteria": [
        { "criterion": string, "weight": number, "description": string },
        { "criterion": string, "weight": number, "description": string },
        { "criterion": string, "weight": number, "description": string },
        { "criterion": string, "weight": number, "description": string }
      ],
      "status": "active"
    },
    {
      "id": "m2",
      "order": 2,
      ... (same shape, status: "locked")
    },
    {
      "id": "m3",
      "order": 3,
      ... (same shape, status: "locked")
    }
  ]
}

Each milestone's rubricCriteria weights must sum to 100. Make the project progressively more challenging. Return ONLY valid JSON.`;

    const result = await generateDeepSeekResponse(prompt, {
      systemInstruction: "You are an industry-experienced project architect. Return only valid JSON. No explanation.",
      temperature: 0.7,
      maxTokens: 3000,
    });

    const data = JSON.parse(extractJSON(result.text));
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("Sector pivot project error:", err);
    res.status(500).json({ error: "Failed to generate project" });
  }
});

// ── Step 3: AI review of a milestone submission ──────────────────────────────
router.post("/review", async (req: Request, res: Response) => {
  try {
    const { milestoneTitle, deliverable, rubricCriteria, submissionText, targetSector } = req.body;
    if (!milestoneTitle || !submissionText || !rubricCriteria) {
      return res.status(400).json({ error: "milestoneTitle, submissionText, and rubricCriteria are required" });
    }

    const rubricStr = rubricCriteria
      .map((r: any) => `- ${r.criterion} (weight: ${r.weight}%): ${r.description}`)
      .join("\n");

    const prompt = `You are an expert ${targetSector || "industry"} reviewer evaluating a student's submission for the milestone "${milestoneTitle}".

Expected deliverable: ${deliverable || "As described in the milestone"}

Rubric criteria:
${rubricStr}

Student's submission:
"""
${submissionText.slice(0, 4000)}
"""

Evaluate the submission against EACH rubric criterion. Return a JSON object matching:
{
  "score": number (0–100, weighted average of criterion scores),
  "passed": boolean (true if score >= 60),
  "feedback": [
    {
      "criterion": string (criterion name),
      "score": number (0–100),
      "comment": string (specific, constructive feedback),
      "suggestion": string (actionable improvement tip)
    }
  ],
  "overallComment": string (2–3 sentences of encouraging, constructive overall feedback),
  "reviewedAt": "${new Date().toISOString()}"
}

Be fair but rigorous. Award partial credit for good attempts. Return ONLY valid JSON.`;

    const result = await generateDeepSeekResponse(prompt, {
      systemInstruction: "You are a rigorous but constructive industry reviewer. Return only valid JSON. No explanation.",
      temperature: 0.4,
      maxTokens: 2000,
    });

    const data = JSON.parse(extractJSON(result.text));
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("Sector pivot review error:", err);
    res.status(500).json({ error: "Failed to review submission" });
  }
});

// ── Step 4: Generate certificate data ────────────────────────────────────────
router.post("/certificate", async (req: Request, res: Response) => {
  try {
    const { holderName, originField, targetSector, projectTitle, milestoneScores } = req.body;
    if (!holderName || !targetSector || !projectTitle || !milestoneScores) {
      return res.status(400).json({ error: "holderName, targetSector, projectTitle, and milestoneScores are required" });
    }

    const overallScore = Math.round(
      milestoneScores.reduce((s: number, m: any) => s + m.score, 0) / milestoneScores.length
    );

    const verificationId = `CV-${targetSector.replace(/\s+/g, "").slice(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    const certificate = {
      id: `cert-${Date.now()}`,
      verificationId,
      holderName,
      originField: originField || "General",
      targetSector,
      projectTitle,
      overallScore,
      issuedAt: new Date().toISOString(),
      milestoneScores,
    };

    res.json({ success: true, data: certificate });
  } catch (err: any) {
    console.error("Sector pivot certificate error:", err);
    res.status(500).json({ error: "Failed to generate certificate" });
  }
});

// ── Step 5: Generate resume project snippet ──────────────────────────────────
router.post("/resume-snippet", async (req: Request, res: Response) => {
  try {
    const { targetSector, projectTitle, milestones, overallScore, skills } = req.body;
    if (!targetSector || !projectTitle) {
      return res.status(400).json({ error: "targetSector and projectTitle are required" });
    }

    const milestoneNames = (milestones || []).map((m: any) => m.title).join(", ");

    const prompt = `Generate a polished resume project section for a professional who completed a sector-pivot certification project.

Target Sector: ${targetSector}
Project Title: ${projectTitle}
Milestones Completed: ${milestoneNames}
Overall Score: ${overallScore || "N/A"}%
Key Skills: ${(skills || []).join(", ")}

Return a JSON object matching:
{
  "title": string (polished project title for a resume),
  "bullets": string[] (3–4 high-impact, quantified achievement bullets using strong action verbs, formatted for ATS),
  "technologies": string[] (4–6 relevant tools/technologies/frameworks),
  "certification": string (one-line certification statement, e.g. "EasyCareer AI Verified — Sector Pivot: Data Analytics (Score: 87%)")
}

Make the bullets specific, professional, and ATS-optimized. Return ONLY valid JSON.`;

    const result = await generateDeepSeekResponse(prompt, {
      systemInstruction: "You are an expert resume writer. Return only valid JSON. No explanation.",
      temperature: 0.5,
      maxTokens: 1000,
    });

    const data = JSON.parse(extractJSON(result.text));
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("Sector pivot resume snippet error:", err);
    res.status(500).json({ error: "Failed to generate resume snippet" });
  }
});

export default router;
