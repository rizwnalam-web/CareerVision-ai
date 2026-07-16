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

// ── Step 1+2: Full AI Technical Audit ────────────────────────────────────────
router.post("/audit", async (req: Request, res: Response) => {
  try {
    const { type, value, description, techStack } = req.body;
    if (!type || !value) {
      return res.status(400).json({ error: "type and value are required" });
    }

    const inputLabel = type === "github" ? `GitHub repository: ${value}` : `Live URL: ${value}`;
    const contextHint = description ? `\nProject context: ${description}` : "";
    const stackHint = techStack?.length ? `\nKnown tech stack: ${techStack.join(", ")}` : "";

    const prompt = `You are a Senior Solutions Architect performing a production-grade technical audit.

Target: ${inputLabel}${contextHint}${stackHint}

Perform a comprehensive review covering Architecture, Performance, and Security. Return a JSON object matching this shape EXACTLY:

{
  "id": string (e.g. "audit-<timestamp>"),
  "inputType": "${type}",
  "inputValue": "${value}",
  "overallScore": number (0–100, weighted: architecture 35%, performance 30%, security 35%),
  "grade": "A+" | "A" | "B+" | "B" | "C+" | "C" | "D" | "F" (based on score: 95+=A+, 90+=A, 85+=B+, 80+=B, 75+=C+, 70+=C, 60+=D, <60=F),
  "architecture": {
    "score": number (0–100),
    "findings": [
      { "category": string, "severity": "critical"|"warning"|"info"|"good", "title": string, "description": string, "recommendation": string }
    ] (4–6 findings)
  },
  "performance": {
    "score": number (0–100),
    "findings": [
      { "category": string, "severity": "critical"|"warning"|"info"|"good", "title": string, "description": string, "recommendation": string }
    ] (4–6 findings)
  },
  "security": {
    "score": number (0–100),
    "findings": [
      { "category": string, "severity": "critical"|"warning"|"info"|"good", "title": string, "description": string, "recommendation": string }
    ] (3–5 findings),
    "vulnerabilities": [
      { "type": string, "severity": "critical"|"high"|"medium"|"low", "description": string, "location": string, "fix": string }
    ] (2–4 vulnerabilities)
  },
  "prRecommendations": [
    {
      "id": string (e.g. "pr-1"),
      "title": string (PR title format),
      "description": string (what the PR would do),
      "category": "architecture"|"performance"|"security"|"code-quality"|"documentation",
      "priority": "critical"|"high"|"medium"|"low",
      "effort": "small"|"medium"|"large",
      "impact": string (1 sentence on impact)
    }
  ] (5–8 recommendations, ordered by priority),
  "summary": string (3–4 sentence executive summary),
  "strengths": string[] (3–5 things done well),
  "techStackDetected": string[] (detected/inferred technologies),
  "auditedAt": "${new Date().toISOString()}"
}

Be realistic, specific, and constructive. For a GitHub repo, infer typical patterns from the URL structure. For a live URL, analyze expected best practices for a deployed web application. Return ONLY valid JSON.`;

    const result = await generateDeepSeekResponse(prompt, {
      systemInstruction: "You are an expert solutions architect and security auditor. Return only valid JSON. No markdown fences, no explanation.",
      temperature: 0.5,
      maxTokens: 4000,
    });

    if (result.source === "error") {
      return res.status(502).json({ error: "LLM audit failed", detail: result.error });
    }

    const data = JSON.parse(extractJSON(result.text));
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("Code audit error:", err);
    res.status(500).json({ error: "Failed to perform audit" });
  }
});

// ── Step 3: Generate certificate ─────────────────────────────────────────────
router.post("/certificate", async (req: Request, res: Response) => {
  try {
    const { holderName, projectName, projectUrl, overallScore, grade, techStack } = req.body;
    if (!holderName || !projectName || overallScore === undefined) {
      return res.status(400).json({ error: "holderName, projectName, and overallScore are required" });
    }

    const verificationId = `CV-CODE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const certificate = {
      id: `cert-code-${Date.now()}`,
      verificationId,
      holderName,
      projectName,
      projectUrl: projectUrl || "",
      overallScore,
      grade: grade || "B",
      techStack: techStack || [],
      issuedAt: new Date().toISOString(),
    };

    res.json({ success: true, data: certificate });
  } catch (err: any) {
    console.error("Code audit certificate error:", err);
    res.status(500).json({ error: "Failed to generate certificate" });
  }
});

// ── Step 4: Generate resume snippet ──────────────────────────────────────────
router.post("/resume-snippet", async (req: Request, res: Response) => {
  try {
    const { projectName, projectUrl, overallScore, grade, techStack, strengths, summary } = req.body;
    if (!projectName) {
      return res.status(400).json({ error: "projectName is required" });
    }

    const prompt = `Generate a polished resume project section for a developer who completed a production-grade code audit on their project.

Project: ${projectName}
URL: ${projectUrl || "N/A"}
Audit Score: ${overallScore}/100 (Grade: ${grade})
Tech Stack: ${(techStack || []).join(", ")}
Key Strengths: ${(strengths || []).join(", ")}
Summary: ${summary || "N/A"}

Return a JSON object matching:
{
  "title": string (polished project title for a resume),
  "bullets": string[] (3–4 high-impact, quantified achievement bullets using strong action verbs — highlight architectural decisions, performance optimizations, and security practices),
  "technologies": string[] (5–7 relevant technologies from the stack),
  "certification": string (e.g. "EasyCareer AI Code Review Verified — Production Grade: ${grade} (Score: ${overallScore}/100)")
}

Make the bullets specific, professional, and ATS-optimized. Use metrics and technical depth. Return ONLY valid JSON.`;

    const result = await generateDeepSeekResponse(prompt, {
      systemInstruction: "You are an expert technical resume writer. Return only valid JSON. No explanation.",
      temperature: 0.5,
      maxTokens: 1000,
    });

    if (result.source === "error") {
      return res.status(502).json({ error: "LLM failed" });
    }

    const data = JSON.parse(extractJSON(result.text));
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("Code audit resume snippet error:", err);
    res.status(500).json({ error: "Failed to generate resume snippet" });
  }
});

export default router;
