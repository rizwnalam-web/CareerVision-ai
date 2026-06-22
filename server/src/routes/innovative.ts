import { Router, Request, Response } from "express";
import { generateDeepSeekResponse } from "../services/deepseekService.js";

const router = Router();

function extractJSON(raw: string | null | undefined): string {
  if (!raw) return "";
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  return raw.trim();
}

// ── 1. AI Career Coach — conversational message ──────────────────────────────
router.post("/career-coach/chat", async (req: Request, res: Response) => {
  try {
    const { message, history = [], profile } = req.body;
    if (!message) return res.status(400).json({ error: "message is required" });

    const historyText = history
      .slice(-8)
      .map((m: { role: string; content: string }) => `${m.role === "user" ? "User" : "Coach"}: ${m.content}`)
      .join("\n");

    const prompt = `You are Spark.E, an expert AI career coach — empathetic, direct, and insightful.
${profile ? `User profile: ${JSON.stringify({ name: profile.name, currentRole: profile.currentRole, targetCareer: profile.targetCareer, skills: profile.skills?.slice(0,6), country: profile.country })}` : ""}
${historyText ? `\nConversation so far:\n${historyText}` : ""}

User: ${message}

Respond as a career coach. Be specific, actionable, and warm. Keep replies under 180 words. Do NOT use JSON — respond in plain conversational text.`;

    const result = await generateDeepSeekResponse(prompt, { temperature: 0.75 });
    res.json({ success: true, data: { reply: result.text ?? "I'm here to help — could you rephrase that?" } });
  } catch (e) {
    console.error("career-coach/chat error:", e);
    res.status(500).json({ error: "Career coach unavailable" });
  }
});

// ── 2. Industry Simulation — generate scenario ───────────────────────────────
router.post("/industry-sim/scenario", async (req: Request, res: Response) => {
  try {
    const { industry, role, difficulty = "medium" } = req.body;
    if (!industry || !role) return res.status(400).json({ error: "industry and role are required" });

    const prompt = `Generate a realistic workplace scenario simulation for a ${role} in the ${industry} industry.
Difficulty: ${difficulty}

Return JSON with this exact structure:
{
  "title": "short scenario title",
  "context": "2-3 sentences setting the scene",
  "challenge": "specific challenge the user must address (1-2 sentences)",
  "options": [
    { "id": "a", "text": "option text (1 sentence)" },
    { "id": "b", "text": "option text (1 sentence)" },
    { "id": "c", "text": "option text (1 sentence)" },
    { "id": "d", "text": "option text (1 sentence)" }
  ],
  "bestOption": "a|b|c|d",
  "skills": ["skill1", "skill2", "skill3"],
  "industry": "${industry}",
  "role": "${role}"
}`;

    const result = await generateDeepSeekResponse(prompt, { temperature: 0.8 });
    const scenario = JSON.parse(extractJSON(result.text));
    res.json({ success: true, data: scenario });
  } catch (e) {
    console.error("industry-sim/scenario error:", e);
    res.status(500).json({ error: "Failed to generate scenario" });
  }
});

// ── 2b. Industry Simulation — evaluate answer ────────────────────────────────
router.post("/industry-sim/evaluate", async (req: Request, res: Response) => {
  try {
    const { scenario, chosenOption, role } = req.body;
    if (!scenario || !chosenOption) return res.status(400).json({ error: "scenario and chosenOption are required" });

    const chosen = scenario.options.find((o: any) => o.id === chosenOption);
    const prompt = `A ${role || "professional"} faced this workplace scenario:
Context: ${scenario.context}
Challenge: ${scenario.challenge}
They chose: "${chosen?.text}"
Best option was: "${scenario.options.find((o: any) => o.id === scenario.bestOption)?.text}"

Return JSON:
{
  "correct": true/false,
  "score": 0-100,
  "feedback": "2-3 sentences on why this choice is good/bad",
  "insight": "1 concrete takeaway or tip for future situations",
  "skillsUsed": ["skill1", "skill2"]
}`;

    const result = await generateDeepSeekResponse(prompt, { temperature: 0.5 });
    res.json({ success: true, data: JSON.parse(extractJSON(result.text)) });
  } catch (e) {
    console.error("industry-sim/evaluate error:", e);
    res.status(500).json({ error: "Failed to evaluate answer" });
  }
});

// ── 3. Soft Skills Assessment ────────────────────────────────────────────────
router.post("/soft-skills/questions", async (req: Request, res: Response) => {
  try {
    const { targetRole = "professional" } = req.body;

    const prompt = `Generate 8 behavioral assessment questions to evaluate soft skills for a ${targetRole}.
Cover: communication, leadership, conflict resolution, teamwork, adaptability, creativity, empathy, time management.

Return JSON array:
[
  {
    "id": 1,
    "skill": "communication",
    "question": "Tell me about a time...",
    "type": "scenario",
    "options": [
      { "id": "a", "text": "option", "traits": ["assertive", "clear"] },
      { "id": "b", "text": "option", "traits": ["collaborative"] },
      { "id": "c", "text": "option", "traits": ["analytical"] },
      { "id": "d", "text": "option", "traits": ["empathetic"] }
    ]
  }
]`;

    const result = await generateDeepSeekResponse(prompt, { temperature: 0.7 });
    res.json({ success: true, data: JSON.parse(extractJSON(result.text)) });
  } catch (e) {
    console.error("soft-skills/questions error:", e);
    res.status(500).json({ error: "Failed to generate assessment" });
  }
});

router.post("/soft-skills/analyze", async (req: Request, res: Response) => {
  try {
    const { answers, targetRole } = req.body;
    if (!answers) return res.status(400).json({ error: "answers required" });

    const prompt = `Analyze these behavioral assessment answers for a ${targetRole || "professional"}:
${JSON.stringify(answers)}

Return JSON:
{
  "overallScore": 0-100,
  "personality": "2-sentence summary of communication/personality style",
  "strengths": [{ "skill": "skill name", "score": 0-100, "description": "why they excel" }],
  "improvements": [{ "skill": "skill name", "score": 0-100, "tip": "specific actionable improvement" }],
  "workStyle": "Analytical|Creative|Leader|Collaborator|Independent",
  "communicationStyle": "Direct|Diplomatic|Expressive|Analytical",
  "topTraits": ["trait1", "trait2", "trait3"],
  "careerFit": ["career1", "career2", "career3"]
}`;

    const result = await generateDeepSeekResponse(prompt, { temperature: 0.4 });
    res.json({ success: true, data: JSON.parse(extractJSON(result.text)) });
  } catch (e) {
    console.error("soft-skills/analyze error:", e);
    res.status(500).json({ error: "Failed to analyze soft skills" });
  }
});

// ── 4. Salary Negotiation Coach ───────────────────────────────────────────────
router.post("/salary-coach/scenario", async (req: Request, res: Response) => {
  try {
    const { role, experience, location, currentOffer } = req.body;
    if (!role) return res.status(400).json({ error: "role is required" });

    const prompt = `Create a salary negotiation scenario for a ${role} with ${experience || "3-5"} years experience in ${location || "the US"}.
The employer is offering: $${currentOffer || "85,000"}/year.

Return JSON:
{
  "employerName": "realistic company name",
  "role": "${role}",
  "initialOffer": ${currentOffer || 85000},
  "marketMin": number,
  "marketMedian": number,
  "marketMax": number,
  "negotiationRoom": number,
  "employerOpeningLine": "what the HR says when making the offer",
  "tips": ["tip1", "tip2", "tip3"],
  "commonMistakes": ["mistake1", "mistake2"]
}`;

    const result = await generateDeepSeekResponse(prompt, { temperature: 0.6 });
    res.json({ success: true, data: JSON.parse(extractJSON(result.text)) });
  } catch (e) {
    console.error("salary-coach/scenario error:", e);
    res.status(500).json({ error: "Failed to generate negotiation scenario" });
  }
});

router.post("/salary-coach/respond", async (req: Request, res: Response) => {
  try {
    const { scenario, userResponse, round } = req.body;
    if (!scenario || !userResponse) return res.status(400).json({ error: "scenario and userResponse required" });

    const prompt = `Salary negotiation roleplay. Round ${round || 1}.
Role: ${scenario.role} at ${scenario.employerName}
Initial offer: $${scenario.initialOffer}, Market median: $${scenario.marketMedian}
User said: "${userResponse}"

Play the HR manager and return JSON:
{
  "hrReply": "realistic HR response (1-3 sentences)",
  "newOffer": number or null,
  "negotiationScore": 0-100,
  "feedback": "coaching note on the user's response (1-2 sentences)",
  "tactic": "name of negotiation tactic used (e.g. Anchoring, BATNA, Silence)",
  "dealClosed": true/false,
  "finalOffer": number or null
}`;

    const result = await generateDeepSeekResponse(prompt, { temperature: 0.65 });
    res.json({ success: true, data: JSON.parse(extractJSON(result.text)) });
  } catch (e) {
    console.error("salary-coach/respond error:", e);
    res.status(500).json({ error: "Failed to process negotiation response" });
  }
});

// ── 5. Side Hustle Advisor ────────────────────────────────────────────────────
router.post("/side-hustle/suggest", async (req: Request, res: Response) => {
  try {
    const { skills = [], interests = [], currentRole, weeklyHours = 10, incomeGoal } = req.body;

    const prompt = `Suggest 6 realistic side hustles for someone with these details:
Skills: ${skills.join(", ")}
Interests: ${interests.join(", ")}
Current role: ${currentRole || "professional"}
Available hours/week: ${weeklyHours}
Monthly income goal: ${incomeGoal ? "$" + incomeGoal : "not specified"}

Return JSON array:
[
  {
    "title": "side hustle name",
    "category": "Freelance|Content|Teaching|Product|Service|Investment",
    "description": "2-sentence description",
    "monthlyEarning": { "min": number, "max": number },
    "startupCost": number,
    "hoursPerWeek": number,
    "difficulty": "Easy|Medium|Hard",
    "skills": ["required skill 1", "required skill 2"],
    "gettingStarted": ["step1", "step2", "step3"],
    "platforms": ["platform1", "platform2"],
    "fitScore": 0-100
  }
]`;

    const result = await generateDeepSeekResponse(prompt, { temperature: 0.75 });
    res.json({ success: true, data: JSON.parse(extractJSON(result.text)) });
  } catch (e) {
    console.error("side-hustle/suggest error:", e);
    res.status(500).json({ error: "Failed to suggest side hustles" });
  }
});

// ── 6. Burnout Prevention ─────────────────────────────────────────────────────
router.post("/burnout/assess", async (req: Request, res: Response) => {
  try {
    const { responses, role, workHoursPerWeek } = req.body;
    if (!responses) return res.status(400).json({ error: "responses required" });

    const prompt = `Analyze work-life balance and burnout risk from these responses:
Role: ${role || "professional"}
Work hours/week: ${workHoursPerWeek || "unknown"}
Responses: ${JSON.stringify(responses)}

Return JSON:
{
  "burnoutRisk": "Low|Moderate|High|Critical",
  "riskScore": 0-100,
  "dimensions": {
    "exhaustion": 0-100,
    "cynicism": 0-100,
    "efficacy": 0-100,
    "workload": 0-100,
    "autonomy": 0-100,
    "social": 0-100
  },
  "summary": "2-3 sentence personalized analysis",
  "redFlags": ["warning sign 1", "warning sign 2"],
  "recommendations": [
    { "category": "Sleep|Exercise|Boundaries|Social|Mindfulness|Career", "action": "specific actionable recommendation", "impact": "High|Medium|Low" }
  ],
  "weeklyPlan": [
    { "day": "Monday", "action": "specific micro-action" }
  ],
  "professionalHelp": true/false
}`;

    const result = await generateDeepSeekResponse(prompt, { temperature: 0.4 });
    res.json({ success: true, data: JSON.parse(extractJSON(result.text)) });
  } catch (e) {
    console.error("burnout/assess error:", e);
    res.status(500).json({ error: "Failed to assess burnout risk" });
  }
});

export default router;
