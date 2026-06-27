import { generateDeepSeekResponse } from "./deepseekService.js";

// ─────────────────────────────────────────────────────────────────────────────
// ResumeContent — defined here so all consumers import from this module
// ─────────────────────────────────────────────────────────────────────────────

export interface ResumeContent {
  personalInfo: { name?: string; email?: string; phone?: string; location?: string; summary?: string };
  experience?: Array<{ position: string; company: string; startDate?: string; endDate?: string; description?: string }>;
  education?: Array<{ degree: string; fieldOfStudy: string; institution: string; graduationYear?: string }>;
  skills?: { technical?: string[]; soft?: string[]; certifications?: string[] };
  awards?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared types
// ─────────────────────────────────────────────────────────────────────────────

export interface LearningResource {
  title: string;
  type: "course" | "book" | "certification" | "project" | "tutorial";
  platform: string;
  url: string;
  estimatedHours: number;
  priority: "critical" | "high" | "medium" | "low";
}

export interface SkillGap {
  skill: string;
  currentLevel: "none" | "beginner" | "intermediate" | "advanced";
  requiredLevel: "beginner" | "intermediate" | "advanced" | "expert";
  importance: "critical" | "high" | "medium" | "low";
  learningPath: LearningResource[];
}

export interface SalaryPrediction {
  currency: string;
  min: number;
  median: number;
  max: number;
  percentile25: number;
  percentile75: number;
  marketTrend: "rising" | "stable" | "declining";
  confidenceLevel: "high" | "medium" | "low";
  factors: string[];
  comparison: string;
}

export interface CultureAnalysis {
  overallFitScore: number;
  dimensions: {
    workLifeBalance: number;
    innovationFocus: number;
    collaboration: number;
    autonomy: number;
    growthOpportunity: number;
  };
  strengths: string[];
  watchouts: string[];
  summary: string;
}

export interface JobMatchAnalysis {
  matchScore: number;
  skillMatchScore: number;
  cultureFitScore: number;
  salaryFitScore: number;
  matchReasons: string[];
  skillGaps: SkillGap[];
  salaryPrediction: SalaryPrediction;
  cultureAnalysis: CultureAnalysis;
}

export interface JobListingRow {
  id: string;
  title: string;
  company: string;
  location: string | null;
  work_type: "remote" | "hybrid" | "onsite";
  description: string | null;
  requirements: string | null;
  skills_required: string[];
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  company_culture: string | null;
  industry: string | null;
  experience_level: string | null;
  source_url: string | null;
  source?: string | null;
  external_job_id?: string | null;
  is_active: boolean;
  posted_at: string;
}

export interface SemanticPreferences {
  workTypePreference?: "remote" | "hybrid" | "onsite" | "any";
  minSalary?: number | null;
  maxSalary?: number | null;
  preferredLocations?: string[];
  preferredIndustries?: string[];
  targetRole?: string | null;
}

export interface SemanticMatchScore {
  overall: number;
  semantic: number;
  title: number;
  skills: number;
  salary: number;
  preference: number;
  missingSkills: string[];
  reasons: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function extractJSON(raw: string | null | undefined): string {
  if (!raw) return "";
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first !== -1 && last > first) return raw.slice(first, last + 1);
  return raw.trim();
}

function resumeToText(c: ResumeContent): string {
  const parts: string[] = [];
  const p = c.personalInfo;
  if (p.name) parts.push(`Name: ${p.name}`);
  if (p.summary) parts.push(`Summary: ${p.summary}`);

  if (c.experience?.length) {
    parts.push("Experience:");
    c.experience.forEach((e: { position: string; company: string; startDate?: string; endDate?: string }) =>
      parts.push(`  ${e.position} at ${e.company} (${e.startDate}–${e.endDate || "present"})`)
    );
  }
  if (c.skills) {
    const all = [
      ...(c.skills.technical || []),
      ...(c.skills.soft || []),
      ...(c.skills.certifications || []),
    ];
    if (all.length) parts.push(`Skills: ${all.join(", ")}`);
  }
  if (c.education?.length) {
    parts.push("Education:");
    c.education.forEach((e: { degree: string; fieldOfStudy: string; institution: string }) =>
      parts.push(`  ${e.degree} in ${e.fieldOfStudy} from ${e.institution}`)
    );
  }
  if (c.awards?.length) parts.push(`Awards: ${c.awards.join(", ")}`);
  return parts.join("\n");
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length >= 2);
}

function tokenFreq(tokens: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const token of tokens) {
    map.set(token, (map.get(token) || 0) + 1);
  }
  return map;
}

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  if (!a.size || !b.size) return 0;

  let dot = 0;
  let aNorm = 0;
  let bNorm = 0;

  for (const [, value] of a) aNorm += value * value;
  for (const [, value] of b) bNorm += value * value;

  for (const [token, aVal] of a) {
    const bVal = b.get(token) || 0;
    dot += aVal * bVal;
  }

  if (!aNorm || !bNorm) return 0;
  return dot / (Math.sqrt(aNorm) * Math.sqrt(bNorm));
}

function overlapScore(aSet: Set<string>, bSet: Set<string>): number {
  if (!aSet.size || !bSet.size) return 0;
  let intersection = 0;
  for (const token of aSet) {
    if (bSet.has(token)) intersection += 1;
  }
  return intersection / Math.max(aSet.size, bSet.size);
}

function normalizeLocation(value: string | null | undefined): string {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z\s,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseSkillsFromJob(job: JobListingRow): string[] {
  if (Array.isArray(job.skills_required) && job.skills_required.length) {
    return job.skills_required.map(s => s.toLowerCase().trim()).filter(Boolean);
  }
  const merged = `${job.title} ${job.requirements || ""} ${job.description || ""}`;
  return Array.from(new Set(tokenize(merged).filter(t => t.length >= 3))).slice(0, 15);
}

function scoreSalaryFit(job: JobListingRow, prefs: SemanticPreferences): number {
  if (!job.salary_min && !job.salary_max) return 55;
  if (!prefs.minSalary && !prefs.maxSalary) return 60;

  const jMin = job.salary_min ?? job.salary_max ?? 0;
  const jMax = job.salary_max ?? job.salary_min ?? 0;
  const pMin = prefs.minSalary ?? 0;
  const pMax = prefs.maxSalary ?? Number.MAX_SAFE_INTEGER;

  const overlapMin = Math.max(jMin, pMin);
  const overlapMax = Math.min(jMax, pMax);
  if (overlapMax < overlapMin) return 25;

  const overlap = overlapMax - overlapMin;
  const span = Math.max(jMax - jMin, 1);
  return Math.max(35, Math.min(100, Math.round((overlap / span) * 100)));
}

function scorePreferenceFit(job: JobListingRow, prefs: SemanticPreferences): number {
  let score = 55;

  if (prefs.workTypePreference && prefs.workTypePreference !== "any") {
    score += prefs.workTypePreference === job.work_type ? 20 : -15;
  }

  if (prefs.preferredLocations?.length) {
    const normalizedJobLocation = normalizeLocation(job.location);
    const hit = prefs.preferredLocations.some(loc => normalizedJobLocation.includes(normalizeLocation(loc)));
    score += hit ? 15 : -8;
  }

  if (prefs.preferredIndustries?.length && job.industry) {
    const jobIndustry = job.industry.toLowerCase();
    const hit = prefs.preferredIndustries.some(ind => jobIndustry.includes(ind.toLowerCase()));
    score += hit ? 10 : -5;
  }

  return Math.max(0, Math.min(100, score));
}

export function scoreSemanticMatch(
  resume: ResumeContent,
  job: JobListingRow,
  prefs: SemanticPreferences = {}
): SemanticMatchScore {
  const resumeText = resumeToText(resume);
  const jobText = [
    job.title,
    job.company,
    job.location || "",
    job.description || "",
    job.requirements || "",
    job.skills_required.join(" "),
  ].join(" ");

  const resumeTokens = tokenize(resumeText);
  const jobTokens = tokenize(jobText);
  const resumeFreq = tokenFreq(resumeTokens);
  const jobFreq = tokenFreq(jobTokens);

  const semantic = Math.round(cosineSimilarity(resumeFreq, jobFreq) * 100);

  const candidateTitles = (resume.experience || []).map(exp => exp.position.toLowerCase());
  const targetTitle = (prefs.targetRole || candidateTitles[0] || "").toLowerCase();
  const titleTokens = new Set(tokenize(`${targetTitle} ${candidateTitles.join(" ")}`));
  const jobTitleTokens = new Set(tokenize(job.title));
  const title = Math.round(overlapScore(titleTokens, jobTitleTokens) * 100);

  const candidateSkills = new Set([
    ...(resume.skills?.technical || []),
    ...(resume.skills?.soft || []),
    ...(resume.skills?.certifications || []),
  ].map(s => s.toLowerCase().trim()).filter(Boolean));

  const jobSkills = parseSkillsFromJob(job);
  const missingSkills = jobSkills.filter(skill => !candidateSkills.has(skill)).slice(0, 8);
  const matchedSkills = jobSkills.filter(skill => candidateSkills.has(skill));
  const skills = jobSkills.length
    ? Math.round((matchedSkills.length / jobSkills.length) * 100)
    : Math.round(overlapScore(new Set(resumeTokens), new Set(jobTokens)) * 100);

  const salary = scoreSalaryFit(job, prefs);
  const preference = scorePreferenceFit(job, prefs);

  const overall = Math.round(
    semantic * 0.36 +
    skills * 0.30 +
    title * 0.14 +
    preference * 0.12 +
    salary * 0.08
  );

  const reasons: string[] = [];
  if (skills >= 70) reasons.push(`Strong skill overlap (${matchedSkills.length}/${jobSkills.length || 0})`);
  if (title >= 60) reasons.push("Role/title alignment is high");
  if (preference >= 70) reasons.push("Matches your work and location preferences");
  if (salary >= 70) reasons.push("Salary range aligns with your target");
  if (semantic >= 70) reasons.push("Resume content strongly matches job context");
  if (!reasons.length) reasons.push("Moderate alignment with improvement opportunities");

  return {
    overall: Math.max(0, Math.min(100, overall)),
    semantic,
    title,
    skills,
    salary,
    preference,
    missingSkills,
    reasons: reasons.slice(0, 4),
  };
}

export function rankJobsBySemanticFit(
  resume: ResumeContent,
  jobs: JobListingRow[],
  prefs: SemanticPreferences = {}
): Array<{ job: JobListingRow; score: SemanticMatchScore }> {
  return jobs
    .map(job => ({ job, score: scoreSemanticMatch(resume, job, prefs) }))
    .sort((a, b) => b.score.overall - a.score.overall);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Full job match analysis (semantic match + skill gap + culture + salary)
// ─────────────────────────────────────────────────────────────────────────────

export async function analyseJobMatch(
  resume: ResumeContent,
  job: JobListingRow,
  userMinSalary?: number,
  userMaxSalary?: number
): Promise<JobMatchAnalysis> {
  const resumeText = resumeToText(resume);
  const salaryContext = job.salary_min
    ? `Advertised range: ${job.salary_currency} ${job.salary_min.toLocaleString()}–${job.salary_max?.toLocaleString() ?? "?"}`
    : "No salary advertised";
  const userSalaryContext =
    userMinSalary
      ? `Candidate expects: ${job.salary_currency} ${userMinSalary.toLocaleString()}–${userMaxSalary?.toLocaleString() ?? "open"}`
      : "Candidate has no salary preference set";

  const prompt = `You are an expert recruiter and career coach. Perform a comprehensive job-candidate match analysis.

CANDIDATE RESUME:
${resumeText.slice(0, 3000)}

JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location || "Not specified"}
Work Type: ${job.work_type}
Industry: ${job.industry || "Not specified"}
Experience Level: ${job.experience_level || "Not specified"}
Required Skills: ${job.skills_required.join(", ") || "Not listed"}
${salaryContext}
Company Culture: ${job.company_culture || "Not provided"}
Job Description: ${(job.description || "").slice(0, 1000)}
Requirements: ${(job.requirements || "").slice(0, 800)}

SALARY CONTEXT:
${userSalaryContext}

Return ONLY a raw JSON object:
{
  "matchScore": <integer 0-100, overall fit>,
  "skillMatchScore": <integer 0-100>,
  "cultureFitScore": <integer 0-100>,
  "salaryFitScore": <integer 0-100, how well advertised range fits candidate expectations>,
  "matchReasons": ["reason 1", "reason 2", "reason 3"],
  "skillGaps": [
    {
      "skill": "Kubernetes",
      "currentLevel": "none",
      "requiredLevel": "intermediate",
      "importance": "high",
      "learningPath": [
        {
          "title": "Kubernetes for Developers",
          "type": "course",
          "platform": "Udemy",
          "url": "https://udemy.com",
          "estimatedHours": 12,
          "priority": "high"
        }
      ]
    }
  ],
  "salaryPrediction": {
    "currency": "${job.salary_currency || "USD"}",
    "min": <integer>,
    "median": <integer>,
    "max": <integer>,
    "percentile25": <integer>,
    "percentile75": <integer>,
    "marketTrend": "rising|stable|declining",
    "confidenceLevel": "high|medium|low",
    "factors": ["factor 1", "factor 2"],
    "comparison": "1-2 sentence comparison vs advertised range"
  },
  "cultureAnalysis": {
    "overallFitScore": <integer 0-100>,
    "dimensions": {
      "workLifeBalance": <integer 0-100>,
      "innovationFocus": <integer 0-100>,
      "collaboration": <integer 0-100>,
      "autonomy": <integer 0-100>,
      "growthOpportunity": <integer 0-100>
    },
    "strengths": ["strength 1", "strength 2"],
    "watchouts": ["watchout 1"],
    "summary": "2-3 sentence culture fit summary"
  }
}

Rules:
- Be realistic with scores. A 95+ match should be rare.
- List only REAL skill gaps (skills the job needs that the candidate lacks).
- Salary prediction should reflect current market rates for this role/location.
- Learning paths must be actionable with real platforms (Coursera, Udemy, LinkedIn Learning, Pluralsight, etc).
- cultureFitScore should reflect alignment between candidate background and company culture description.`;

  const result = await generateDeepSeekResponse(prompt);
  if (!result.text) throw new Error("LLM did not return a response");

  const json = extractJSON(result.text);
  try {
    return JSON.parse(json) as JobMatchAnalysis;
  } catch {
    console.error("[analyseJobMatch] JSON parse failed:", result.text?.slice(0, 300));
    throw new Error("Could not parse AI match analysis response");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Standalone salary prediction
// ─────────────────────────────────────────────────────────────────────────────

export async function predictSalary(
  role: string,
  location: string,
  experienceYears: number,
  skills: string[],
  currency = "USD"
): Promise<SalaryPrediction> {
  const prompt = `You are a compensation expert with access to current market salary data.

Predict the salary range for:
- Role: ${role}
- Location: ${location}
- Experience: ${experienceYears} years
- Key Skills: ${skills.slice(0, 15).join(", ")}
- Currency: ${currency}

Return ONLY raw JSON:
{
  "currency": "${currency}",
  "min": <annual integer>,
  "median": <annual integer>,
  "max": <annual integer>,
  "percentile25": <integer>,
  "percentile75": <integer>,
  "marketTrend": "rising|stable|declining",
  "confidenceLevel": "high|medium|low",
  "factors": ["top factors affecting this salary"],
  "comparison": "Brief market context sentence"
}`;

  const result = await generateDeepSeekResponse(prompt);
  if (!result.text) throw new Error("LLM did not return salary prediction");
  const json = extractJSON(result.text);
  try {
    return JSON.parse(json) as SalaryPrediction;
  } catch {
    throw new Error("Could not parse salary prediction response");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Standalone culture fit assessment
// ─────────────────────────────────────────────────────────────────────────────

export async function assessCultureFit(
  resume: ResumeContent,
  companyName: string,
  cultureSummary: string
): Promise<CultureAnalysis> {
  const resumeText = resumeToText(resume);

  const prompt = `You are an organizational psychologist. Assess culture fit between a candidate and a company.

CANDIDATE BACKGROUND:
${resumeText.slice(0, 2000)}

COMPANY: ${companyName}
CULTURE: ${cultureSummary.slice(0, 1500)}

Return ONLY raw JSON:
{
  "overallFitScore": <integer 0-100>,
  "dimensions": {
    "workLifeBalance": <integer 0-100>,
    "innovationFocus": <integer 0-100>,
    "collaboration": <integer 0-100>,
    "autonomy": <integer 0-100>,
    "growthOpportunity": <integer 0-100>
  },
  "strengths": ["what aligns well"],
  "watchouts": ["potential friction points"],
  "summary": "2-3 sentence overall assessment"
}`;

  const result = await generateDeepSeekResponse(prompt);
  if (!result.text) throw new Error("LLM did not return culture analysis");
  const json = extractJSON(result.text);
  try {
    return JSON.parse(json) as CultureAnalysis;
  } catch {
    throw new Error("Could not parse culture analysis response");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Personalised learning path for a skill set
// ─────────────────────────────────────────────────────────────────────────────

export async function buildLearningPath(
  skillGaps: string[],
  targetRole: string,
  currentSkills: string[]
): Promise<LearningResource[]> {
  if (!skillGaps.length) return [];

  const prompt = `You are a learning & development specialist. Build a prioritised learning plan.

Target Role: ${targetRole}
Skills to Develop: ${skillGaps.join(", ")}
Current Skills: ${currentSkills.slice(0, 20).join(", ")}

Return ONLY a raw JSON array of learning resources (max 10):
[
  {
    "title": "Resource title",
    "type": "course|book|certification|project|tutorial",
    "platform": "Platform name",
    "url": "https://real-url.com",
    "estimatedHours": <integer>,
    "priority": "critical|high|medium|low"
  }
]

Rules:
- Use REAL platforms: Coursera, Udemy, edX, Pluralsight, LinkedIn Learning, YouTube, etc.
- Sort by priority (critical first).
- Prefer free or widely-available resources.
- Include at least one hands-on project.`;

  const result = await generateDeepSeekResponse(prompt);
  if (!result.text) return [];

  const raw = result.text;
  const firstBracket = raw.indexOf("[");
  const lastBracket = raw.lastIndexOf("]");
  const json = firstBracket !== -1 && lastBracket > firstBracket
    ? raw.slice(firstBracket, lastBracket + 1)
    : raw.trim();

  try {
    return JSON.parse(json) as LearningResource[];
  } catch {
    return [];
  }
}
