import { generateDeepSeekResponse } from "./deepseekService.js";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ResumePersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  summary: string;
}

export interface ResumeExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  isCurrentRole: boolean;
  description: string;
  achievements: string[];
}

export interface ResumeEducation {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  gpa: string;
  achievements: string[];
}

export interface ResumeSkills {
  technical: string[];
  soft: string[];
  languages: string[];
  certifications: string[];
}

export interface ResumeContent {
  personalInfo: ResumePersonalInfo;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: ResumeSkills;
  projects: ResumeProjectItem[];
  awards: string[];
}

export interface ResumeProjectItem {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  url: string;
}

export interface ATSSuggestion {
  category: "keywords" | "formatting" | "content" | "structure";
  priority: "critical" | "high" | "medium" | "low";
  issue: string;
  fix: string;
}

export interface ATSReport {
  score: number;
  sections: {
    keywords: { score: number; found: string[]; missing: string[] };
    formatting: { score: number; issues: string[] };
    content: { score: number; suggestions: string[] };
    structure: { score: number; issues: string[] };
  };
  suggestions: ATSSuggestion[];
  summary: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// File parsers
// ─────────────────────────────────────────────────────────────────────────────

/** Extract plain text from a PDF buffer */
export async function parsePdf(buffer: Buffer): Promise<string> {
  // PDFParse v2 expects Uint8Array; Buffer is a subclass but explicit cast avoids edge cases
  const data = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const parser = new PDFParse({ data });
  const result = await parser.getText();
  // Strip the "-- N of N --" page-break markers added by v2
  const cleaned = (result.text || "")
    .replace(/--\s*\d+\s*of\s*\d+\s*--/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return cleaned;
}

/** Extract plain text from a DOCX buffer */
export async function parseDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value || "";
}

/** Pass-through for plain text */
export function parseTxt(buffer: Buffer): string {
  return buffer.toString("utf-8");
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

function extractJSON(raw: string | null | undefined): string {
  if (!raw) return "";
  // 1. Try markdown fenced block (```json ... ``` or ``` ... ```)
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  // 2. Slice from first '{' to last '}' to strip preamble/postamble text
  const first = raw.indexOf("{");
  const last  = raw.lastIndexOf("}");
  if (first !== -1 && last > first) return raw.slice(first, last + 1);
  return raw.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// LLM – structure raw text into ResumeContent
// ─────────────────────────────────────────────────────────────────────────────

export async function structureResumeFromText(rawText: string): Promise<ResumeContent> {
  const prompt = `You are an expert resume parser. Extract information from the resume text below and return it as JSON.

IMPORTANT: You MUST extract the ACTUAL values from the resume text. Do NOT return empty strings for fields that have data.

Return ONLY a raw JSON object (no markdown, no code fences) with exactly this structure:
{
  "personalInfo": {
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "+1 555 0100",
    "location": "New York, NY",
    "linkedin": "linkedin.com/in/johnsmith",
    "website": "johnsmith.dev",
    "summary": "Experienced software engineer..."
  },
  "experience": [
    {
      "id": "exp-1",
      "company": "Acme Corp",
      "position": "Senior Engineer",
      "startDate": "2021-03",
      "endDate": "2024-01",
      "isCurrentRole": false,
      "description": "Led a team of 5 engineers...",
      "achievements": ["Reduced load time by 40%", "Launched 3 major features"]
    }
  ],
  "education": [
    {
      "id": "edu-1",
      "institution": "MIT",
      "degree": "Bachelor of Science",
      "fieldOfStudy": "Computer Science",
      "startDate": "2017-09",
      "endDate": "2021-05",
      "gpa": "3.8",
      "achievements": []
    }
  ],
  "skills": {
    "technical": ["Python", "React", "PostgreSQL"],
    "soft": ["Leadership", "Communication"],
    "languages": ["English", "Spanish"],
    "certifications": ["AWS Certified"]
  },
  "projects": [
    {
      "id": "proj-1",
      "title": "Open Source Tool",
      "description": "A tool that does X",
      "technologies": ["Node.js", "TypeScript"],
      "url": "github.com/user/repo"
    }
  ],
  "awards": ["Dean's List 2020", "Hackathon Winner 2022"]
}

Extraction rules:
- Use the ACTUAL values from the resume. Never copy the example values above.
- Use ISO date format "YYYY-MM" (e.g. "2021-03"). Use "" if date is not found.
- Set isCurrentRole to true if the position says "Present" or "Current".
- Generate unique sequential ids like "exp-1", "exp-2", "edu-1", "proj-1", etc.
- If a field has no data in the resume, use "" for strings or [] for arrays.
- Include ALL positions, degrees, skills, projects, and awards found in the text.

RESUME TEXT TO PARSE:
${rawText.slice(0, 8000)}`;

  console.log(`[structureResumeFromText] text length=${rawText.length}, preview="${rawText.slice(0, 120).replace(/\n/g, " ")}"`);

  const result = await generateDeepSeekResponse(prompt);
  if (!result.text) {
    throw new Error("The AI service did not return a response. Please try again.");
  }

  console.log(`[structureResumeFromText] LLM response length=${result.text.length}, preview="${result.text.slice(0, 200).replace(/\n/g, " ")}"`);

  const json = extractJSON(result.text);

  try {
    const parsed = JSON.parse(json) as ResumeContent;
    // Ensure required top-level keys exist (guards against partial LLM output)
    if (!parsed.personalInfo || !parsed.experience || !parsed.skills) {
      throw new Error("Incomplete JSON");
    }
    return parsed;
  } catch {
    console.error("[structureResumeFromText] JSON parse failed. Raw LLM output:\n", result.text?.slice(0, 500));
    throw new Error(
      "Could not parse the AI response into resume fields. " +
      "Please try again — if the problem persists, try a TXT export of your resume."
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LLM – ATS compliance analysis
// ─────────────────────────────────────────────────────────────────────────────

export async function runATSCheck(
  content: ResumeContent,
  targetRole?: string
): Promise<ATSReport> {
  const resumeText = resumeContentToText(content);
  const roleHint = targetRole ? `The target role is: "${targetRole}".` : "No specific target role provided — do a general ATS analysis.";

  const prompt = `You are an ATS (Applicant Tracking System) compliance expert. Analyse this resume and produce a detailed ATS report.
${roleHint}

Return ONLY valid JSON with this exact structure:
{
  "score": <integer 0-100>,
  "sections": {
    "keywords":   { "score": <int 0-100>, "found": ["..."], "missing": ["..."] },
    "formatting": { "score": <int 0-100>, "issues": ["..."] },
    "content":    { "score": <int 0-100>, "suggestions": ["..."] },
    "structure":  { "score": <int 0-100>, "issues": ["..."] }
  },
  "suggestions": [
    { "category": "keywords|formatting|content|structure", "priority": "critical|high|medium|low", "issue": "...", "fix": "..." }
  ],
  "summary": "2-3 sentence overall assessment"
}

Rules:
- score = weighted average of all section scores (keywords 35%, content 30%, structure 20%, formatting 15%)
- List 5-10 actionable suggestions sorted by priority (critical first)
- For keywords: found = important keywords present in resume; missing = high-demand keywords for the role that are absent
- Be specific and actionable in each suggestion

RESUME:
${resumeText.slice(0, 6000)}

Return JSON only.`;

  const atsResult = await generateDeepSeekResponse(prompt);
  const json = extractJSON(atsResult.text);

  try {
    return JSON.parse(json) as ATSReport;
  } catch {
    return defaultATSReport();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LLM – AI writing suggestions for a specific resume section
// ─────────────────────────────────────────────────────────────────────────────

export async function getResumeSuggestions(
  section: string,
  currentText: string,
  targetRole?: string
): Promise<string[]> {
  const roleHint = targetRole ? ` for a "${targetRole}" role` : "";
  const prompt = `You are an expert resume writer. Suggest 3 concrete improvements${roleHint} for the following resume ${section}.

Return ONLY a JSON array of strings, each being one actionable suggestion. No explanation outside the array.
["suggestion 1", "suggestion 2", "suggestion 3"]

CURRENT ${section.toUpperCase()} TEXT:
${currentText.slice(0, 2000)}`;

  const suggResult = await generateDeepSeekResponse(prompt);
  const json = extractJSON(suggResult.text);

  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function resumeContentToText(content: ResumeContent): string {
  const lines: string[] = [];
  const p = content.personalInfo;
  if (p.name) lines.push(p.name);
  if (p.email) lines.push(p.email);
  if (p.summary) lines.push(p.summary);

  lines.push("\nEXPERIENCE");
  for (const e of content.experience) {
    lines.push(`${e.position} at ${e.company} (${e.startDate} – ${e.isCurrentRole ? "Present" : e.endDate})`);
    if (e.description) lines.push(e.description);
    lines.push(...e.achievements);
  }

  lines.push("\nEDUCATION");
  for (const ed of content.education) {
    lines.push(`${ed.degree} in ${ed.fieldOfStudy} – ${ed.institution} (${ed.startDate} – ${ed.endDate})`);
  }

  lines.push("\nSKILLS");
  lines.push(content.skills.technical.join(", "));
  lines.push(content.skills.certifications.join(", "));

  lines.push("\nPROJECTS");
  for (const proj of content.projects) {
    lines.push(`${proj.title}: ${proj.description}`);
  }

  return lines.filter(Boolean).join("\n");
}

function emptyResumeContent(): ResumeContent {
  return {
    personalInfo: { name: "", email: "", phone: "", location: "", linkedin: "", website: "", summary: "" },
    experience: [],
    education: [],
    skills: { technical: [], soft: [], languages: [], certifications: [] },
    projects: [],
    awards: [],
  };
}

function defaultATSReport(): ATSReport {
  return {
    score: 0,
    sections: {
      keywords:   { score: 0, found: [], missing: [] },
      formatting: { score: 0, issues: ["Could not analyse formatting"] },
      content:    { score: 0, suggestions: ["Could not analyse content"] },
      structure:  { score: 0, issues: ["Could not analyse structure"] },
    },
    suggestions: [],
    summary: "ATS analysis could not be completed.",
  };
}
