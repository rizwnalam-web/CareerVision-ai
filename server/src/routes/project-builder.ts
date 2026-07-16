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

// ── Step 1: Generate Tech Stack Recommendation ───────────────────────────────
router.post("/stack", async (req: Request, res: Response) => {
  try {
    const { targetRole, domain, experienceLevel, timeCommitment } = req.body;
    if (!targetRole || !domain) {
      return res.status(400).json({ error: "targetRole and domain are required" });
    }

    const prompt = `You are a Senior Solutions Architect advising a ${experienceLevel || "intermediate"}-level developer who wants to build a portfolio project.

Target Role: ${targetRole}
Domain: ${domain}
Experience Level: ${experienceLevel || "intermediate"}
Time Budget: ${timeCommitment || "1-month"}

Generate a cutting-edge, production-realistic tech stack recommendation. Do NOT recommend generic tutorial stacks — recommend what a real startup or enterprise would use in ${new Date().getFullYear()}.

Return a JSON object matching:
{
  "id": string,
  "projectTitle": string (a specific, impressive project title for this role+domain combination, e.g. "Real-Time Fraud Detection Pipeline" or "Multi-Tenant SaaS Analytics Dashboard"),
  "projectDescription": string (2–3 sentences describing what the project does and why it's impressive to hiring managers),
  "targetRole": "${targetRole}",
  "domain": "${domain}",
  "stack": [
    {
      "category": string (e.g. "Frontend", "Backend", "Database", "Infrastructure", "CI/CD", "Monitoring", "Auth", "API Layer"),
      "tool": string (specific technology name),
      "reason": string (1 sentence — why this tool specifically for this project),
      "alternatives": string[] (2 alternatives a candidate could also use)
    }
  ] (8–12 items covering all layers of a production system),
  "whyThisStack": string (2–3 sentences explaining why this combination is optimal for the target role and domain, referencing current industry hiring trends)
}

Be specific and modern. For example, for Data Engineering recommend pgvector, dbt, Snowflake, Airflow — not just "SQL and Python". Return ONLY valid JSON.`;

    const result = await generateDeepSeekResponse(prompt, {
      systemInstruction: "You are an expert solutions architect who recommends production-grade stacks. Return only valid JSON. No explanation.",
      temperature: 0.7,
      maxTokens: 2500,
    });

    if (result.source === "error") {
      return res.status(502).json({ error: "LLM request failed", detail: result.error });
    }

    const data = JSON.parse(extractJSON(result.text));
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("Project builder stack error:", err);
    res.status(500).json({ error: "Failed to generate tech stack" });
  }
});

// ── Step 2: Generate Architecture (folder structure, ERD, system diagram) ────
router.post("/architecture", async (req: Request, res: Response) => {
  try {
    const { projectTitle, projectDescription, stack, targetRole, domain } = req.body;
    if (!projectTitle || !stack) {
      return res.status(400).json({ error: "projectTitle and stack are required" });
    }

    const stackSummary = (stack || []).map((s: any) => `${s.category}: ${s.tool}`).join(", ");

    const prompt = `You are a Senior Architect designing the technical blueprint for a portfolio project.

Project: ${projectTitle}
Description: ${projectDescription || "N/A"}
Target Role: ${targetRole || "Full-Stack Developer"}
Domain: ${domain || "General"}
Tech Stack: ${stackSummary}

Generate a complete architecture plan. Return a JSON object matching:
{
  "folderStructure": [
    {
      "name": string (e.g. "src"),
      "type": "folder",
      "description": string,
      "children": [
        { "name": string, "type": "file"|"folder", "description": string, "children": [...] }
      ]
    }
  ] (realistic production project structure with 15–25 nodes total),
  "erdEntities": [
    {
      "name": string (table/entity name),
      "fields": [
        { "name": string, "type": string (e.g. "UUID", "VARCHAR(255)", "TIMESTAMP"), "constraints": string (e.g. "PK", "NOT NULL", "FK -> users.id") }
      ],
      "relationships": [
        { "target": string (other entity name), "type": "one-to-one"|"one-to-many"|"many-to-many", "label": string }
      ]
    }
  ] (4–7 entities with realistic fields),
  "flowDescription": string (3–4 sentences explaining how data flows from frontend → API → backend → database → response),
  "systemComponents": [
    { "name": string (e.g. "React Frontend", "Express API", "PostgreSQL"), "role": string (1 sentence), "connections": string[] (names of components it connects to) }
  ] (5–8 components),
  "diagramMermaid": string (a valid Mermaid.js flowchart diagram showing the system architecture, using graph TD syntax)
}

Be production-realistic. Include things like middleware, auth layers, caching, etc. Return ONLY valid JSON.`;

    const result = await generateDeepSeekResponse(prompt, {
      systemInstruction: "You are a systems architect generating technical blueprints. Return only valid JSON. No explanation.",
      temperature: 0.6,
      maxTokens: 4000,
    });

    if (result.source === "error") {
      return res.status(502).json({ error: "LLM request failed", detail: result.error });
    }

    const data = JSON.parse(extractJSON(result.text));
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("Project builder architecture error:", err);
    res.status(500).json({ error: "Failed to generate architecture" });
  }
});

// ── Step 3: Generate Milestones (sprints + tasks) ────────────────────────────
router.post("/milestones", async (req: Request, res: Response) => {
  try {
    const { projectTitle, stack, architecture, targetRole, timeCommitment } = req.body;
    if (!projectTitle) {
      return res.status(400).json({ error: "projectTitle is required" });
    }

    const stackSummary = (stack || []).map((s: any) => `${s.category}: ${s.tool}`).join(", ");
    const entityNames = (architecture?.erdEntities || []).map((e: any) => e.name).join(", ");

    const prompt = `You are a Senior Engineering Manager planning sprints for a developer building a portfolio project.

Project: ${projectTitle}
Stack: ${stackSummary}
Entities: ${entityNames || "N/A"}
Target Role: ${targetRole || "Full-Stack Developer"}
Time Budget: ${timeCommitment || "1-month"}

Break this project into 4–5 sprints with specific, actionable engineering tasks. Each task should have explicit technical guidelines — not vague instructions.

Return a JSON object matching:
{
  "sprints": [
    {
      "id": string (e.g. "sprint-1"),
      "order": number,
      "title": string (e.g. "Sprint 1: Foundation & Infrastructure"),
      "goal": string (1–2 sentences on what this sprint achieves),
      "durationDays": number (3–7 days per sprint),
      "status": "not-started",
      "tasks": [
        {
          "id": string (e.g. "t1-1"),
          "title": string (specific task title),
          "description": string (2–3 sentences on what to do),
          "guideline": string (explicit engineering instruction, e.g. "Set up Docker container with docker-compose.yml including PostgreSQL 15 with healthcheck. Configure schema migrations using Prisma migrate."),
          "estimatedHours": number (1–8),
          "status": "todo",
          "labels": string[] (e.g. ["infrastructure", "backend", "database"])
        }
      ] (3–5 tasks per sprint)
    }
  ] (4–5 sprints),
  "totalEstimatedHours": number,
  "setupInstructions": {
    "github": string[] (3–5 steps to set up the GitHub repo, e.g. "Create repo with .gitignore for Node", "Set up branch protection on main"),
    "hosting": string[] (3–4 steps for deployment, specific to the stack),
    "localDev": string[] (3–5 steps for local development setup)
  }
}

Tasks must be specific enough that a developer can start immediately without guessing. Reference actual CLI commands, file names, and configuration details. Return ONLY valid JSON.`;

    const result = await generateDeepSeekResponse(prompt, {
      systemInstruction: "You are an engineering manager creating sprint plans. Return only valid JSON. No explanation.",
      temperature: 0.6,
      maxTokens: 4000,
    });

    if (result.source === "error") {
      return res.status(502).json({ error: "LLM request failed", detail: result.error });
    }

    const data = JSON.parse(extractJSON(result.text));
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("Project builder milestones error:", err);
    res.status(500).json({ error: "Failed to generate milestones" });
  }
});

export default router;
