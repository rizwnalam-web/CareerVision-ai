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
  references: string[];
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

function stripTrailingCommas(raw: string): string {
  return raw.replace(/,\s*([}\]])/g, "$1");
}

function fixBrokenStringTerminators(raw: string): string {
  // Fix common LLM corruption where a string value ends with repeated quotes,
  // e.g. "linkedin":"izwan1979/"""
  return raw.replace(/([^\\])"{2,}(?=\s*[,}\]])/g, "$1\"");
}

function balanceJsonClosers(raw: string): string {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (const ch of raw) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if ((ch === "}" || ch === "]") && stack[stack.length - 1] === ch) stack.pop();
  }

  return raw + stack.reverse().join("");
}

function normalizeResumeContent(input: Partial<ResumeContent> | null | undefined): ResumeContent {
  const empty = emptyResumeContent();
  return {
    personalInfo: {
      ...empty.personalInfo,
      ...(input?.personalInfo || {}),
    },
    experience: Array.isArray(input?.experience) ? input!.experience : [],
    education: Array.isArray(input?.education) ? input!.education : [],
    skills: {
      ...empty.skills,
      ...(input?.skills || {}),
      technical: Array.isArray(input?.skills?.technical) ? input!.skills.technical : [],
      soft: Array.isArray(input?.skills?.soft) ? input!.skills.soft : [],
      languages: Array.isArray(input?.skills?.languages) ? input!.skills.languages : [],
      certifications: Array.isArray(input?.skills?.certifications) ? input!.skills.certifications : [],
    },
    projects: Array.isArray(input?.projects) ? input!.projects : [],
    awards: Array.isArray(input?.awards) ? input!.awards : [],
    references: Array.isArray(input?.references) ? input!.references : [],
  };
}

function normalizeSpace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function extractSectionByHeading(rawText: string, headings: string[]): string | null {
  const lines = rawText.split(/\r?\n/);
  const normalizedHeadings = headings.map(h => h.toUpperCase());
  const headingLike = /^[A-Z][A-Z\s/&().-]{2,}:?$/;

  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const normalized = line.replace(/[:\-]+$/, "").toUpperCase();
    if (normalizedHeadings.includes(normalized)) {
      start = i + 1;
      break;
    }
  }

  if (start === -1) return null;

  const collected: string[] = [];
  for (let i = start; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (collected.length > 0) {
        const next = lines[i + 1]?.trim() || "";
        if (next && headingLike.test(next)) break;
      }
      continue;
    }
    if (headingLike.test(line) && collected.length > 0) break;
    collected.push(line.replace(/^[-*•]\s*/, ""));
  }

  if (!collected.length) return null;
  const merged = normalizeSpace(collected.join(" "));
  return merged.length >= 40 ? merged : null;
}

function extractLinkedIn(rawText: string): string | null {
  const match = rawText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[a-z0-9_\-\/.%]+/i);
  if (!match) return null;
  const value = match[0].replace(/[),.;]+$/, "");
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function extractWebsite(rawText: string): string | null {
  const candidates = rawText.match(/(?:https?:\/\/|www\.)[a-z0-9.-]+\.[a-z]{2,}(?:\/[\w\-./?%&=+#]*)?/gi) || [];
  for (const url of candidates) {
    if (/linkedin\.com/i.test(url)) continue;
    const clean = url.replace(/[),.;]+$/, "");
    return /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
  }
  return null;
}

function enrichResumeFromRawText(content: ResumeContent, rawText: string): ResumeContent {
  const next = normalizeResumeContent(content);

  const extractedSummary = extractSectionByHeading(rawText, [
    "PROFESSIONAL SUMMARY",
    "SUMMARY",
    "PROFILE",
    "CAREER SUMMARY",
    "EXECUTIVE SUMMARY",
  ]);

  const currentSummary = normalizeSpace(next.personalInfo.summary || "");
  if (extractedSummary) {
    const shouldReplace =
      !currentSummary ||
      extractedSummary.length > currentSummary.length + 40 ||
      currentSummary.length < 120;
    if (shouldReplace) next.personalInfo.summary = extractedSummary;
  }

  const linkedin = extractLinkedIn(rawText);
  if (linkedin && (!next.personalInfo.linkedin || !/linkedin\.com/i.test(next.personalInfo.linkedin))) {
    next.personalInfo.linkedin = linkedin;
  }

  const website = extractWebsite(rawText);
  if (website && !next.personalInfo.website) {
    next.personalInfo.website = website;
  }

  return next;
}

function tryParseResumeContent(raw: string): ResumeContent | null {
  const candidates = [
    raw,
    fixBrokenStringTerminators(raw),
    stripTrailingCommas(raw),
    stripTrailingCommas(fixBrokenStringTerminators(raw)),
    balanceJsonClosers(stripTrailingCommas(fixBrokenStringTerminators(raw))),
  ];

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as Partial<ResumeContent>;
      if (!parsed || typeof parsed !== "object") continue;
      if (!parsed.personalInfo || !parsed.experience || !parsed.skills) continue;
      return normalizeResumeContent(parsed);
    } catch {
      // Try next repair strategy.
    }
  }

  return null;
}

function normalizeATSReport(input: Partial<ATSReport> | null | undefined): ATSReport {
  const safeSection = <T extends object>(section: T | null | undefined, defaults: T): T => ({
    ...defaults,
    ...(section || {}),
  });

  const keywords = safeSection(input?.sections?.keywords, { score: 0, found: [] as string[], missing: [] as string[] });
  const formatting = safeSection(input?.sections?.formatting, { score: 0, issues: [] as string[] });
  const content = safeSection(input?.sections?.content, { score: 0, suggestions: [] as string[] });
  const structure = safeSection(input?.sections?.structure, { score: 0, issues: [] as string[] });

  return {
    score: typeof input?.score === "number" ? Math.max(0, Math.min(100, Math.round(input.score))) : 0,
    sections: {
      keywords: {
        score: typeof keywords.score === "number" ? Math.max(0, Math.min(100, Math.round(keywords.score))) : 0,
        found: Array.isArray(keywords.found) ? keywords.found : [],
        missing: Array.isArray(keywords.missing) ? keywords.missing : [],
      },
      formatting: {
        score: typeof formatting.score === "number" ? Math.max(0, Math.min(100, Math.round(formatting.score))) : 0,
        issues: Array.isArray(formatting.issues) ? formatting.issues : [],
      },
      content: {
        score: typeof content.score === "number" ? Math.max(0, Math.min(100, Math.round(content.score))) : 0,
        suggestions: Array.isArray(content.suggestions) ? content.suggestions : [],
      },
      structure: {
        score: typeof structure.score === "number" ? Math.max(0, Math.min(100, Math.round(structure.score))) : 0,
        issues: Array.isArray(structure.issues) ? structure.issues : [],
      },
    },
    suggestions: Array.isArray(input?.suggestions)
      ? input!.suggestions.filter(Boolean).map((item: any) => ({
          category: ["keywords", "formatting", "content", "structure"].includes(item?.category) ? item.category : "content",
          priority: ["critical", "high", "medium", "low"].includes(item?.priority) ? item.priority : "medium",
          issue: typeof item?.issue === "string" ? item.issue : "Improve ATS alignment",
          fix: typeof item?.fix === "string" ? item.fix : "Clarify this section with role-specific keywords.",
        }))
      : [],
    summary: typeof input?.summary === "string" && input.summary.trim()
      ? input.summary
      : "ATS analysis completed.",
  };
}

function tryParseATSReport(raw: string): ATSReport | null {
  const candidates = [
    raw,
    stripTrailingCommas(raw),
    balanceJsonClosers(stripTrailingCommas(raw)),
  ];

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as Partial<ATSReport>;
      if (!parsed || typeof parsed !== "object" || !parsed.sections) continue;
      return normalizeATSReport(parsed);
    } catch {
      // Try next repair strategy.
    }
  }

  return null;
}

async function repairATSReportJSON(raw: string): Promise<ATSReport | null> {
  const prompt = `Repair this malformed JSON into a valid ATS report object.

Rules:
- Return ONLY a valid raw JSON object
- Preserve existing scores, keyword lists, suggestions, and summary when possible
- Ensure the final object contains keys: score, sections, suggestions, summary
- sections must contain: keywords, formatting, content, structure

MALFORMED JSON:
${raw.slice(0, 7000)}`;

  const result = await generateDeepSeekResponse(prompt);
  return tryParseATSReport(extractJSON(result.text));
}

async function repairResumeJSON(raw: string): Promise<ResumeContent | null> {
  const prompt = `Repair this malformed JSON into valid JSON for a resume parser.

Rules:
- Return ONLY a valid raw JSON object
- Preserve all existing values exactly when possible
- Do not invent new experience, education, projects, or awards
- Ensure the final object contains keys: personalInfo, experience, education, skills, projects, awards, references
- Fix truncation and remove trailing commas if present

MALFORMED JSON:
${raw.slice(0, 7000)}`;

  const result = await generateDeepSeekResponse(prompt);
  return tryParseResumeContent(extractJSON(result.text));
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
  "awards": ["Dean's List 2020", "Hackathon Winner 2022"],
  "references": [
    "Alex Johnson - Engineering Manager at Acme Corp - alex@acme.com",
    "Priya Shah - Product Lead at Beta Labs - priyashah@example.com"
  ]
}

Extraction rules:
- Use the ACTUAL values from the resume. Never copy the example values above.
- Use ISO date format "YYYY-MM" (e.g. "2021-03"). Use "" if date is not found.
- Set isCurrentRole to true if the position says "Present" or "Current".
- Generate unique sequential ids like "exp-1", "exp-2", "edu-1", "proj-1", etc.
- If a field has no data in the resume, use "" for strings or [] for arrays.
- Include ALL positions, degrees, skills, projects, and awards found in the text.
- Put referee details under references if the resume includes a references section.
- For personalInfo.summary: preserve the FULL professional summary paragraph(s) from the resume; do not shorten or compress.
- If summary spans multiple lines, merge lines into one continuous paragraph while preserving meaning.

RESUME TEXT TO PARSE:
${rawText.slice(0, 12000)}`;

  console.log(`[structureResumeFromText] text length=${rawText.length}, preview="${rawText.slice(0, 120).replace(/\n/g, " ")}"`);

  const result = await generateDeepSeekResponse(prompt);
  if (!result.text) {
    throw new Error("The AI service did not return a response. Please try again.");
  }

  console.log(`[structureResumeFromText] LLM response length=${result.text.length}, preview="${result.text.slice(0, 200).replace(/\n/g, " ")}"`);

  const json = extractJSON(result.text);
  const parsed = tryParseResumeContent(json);
  if (parsed) return enrichResumeFromRawText(parsed, rawText);

  console.warn("[structureResumeFromText] Direct JSON parse failed; attempting repair pass");
  const repaired = await repairResumeJSON(json || result.text);
  if (repaired) return enrichResumeFromRawText(repaired, rawText);

  console.error("[structureResumeFromText] JSON parse failed after repair. Raw LLM output:\n", result.text?.slice(0, 1000));
  throw new Error(
    "Could not parse the AI response into resume fields. " +
    "Please try again — if the problem persists, try a TXT export of your resume."
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LLM – ATS compliance analysis
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// LLM – Tailor resume content to a job description
// ─────────────────────────────────────────────────────────────────────────────

export async function tailorResumeToJD(
  content: ResumeContent,
  jobDescription: string
): Promise<ResumeContent> {
  const resumeText = resumeContentToText(content);

  const prompt = `You are an expert resume writer. Your task is to tailor the provided resume to match the job description as closely as possible while keeping all information truthful and accurate.

Rules:
- Rewrite the professional summary to directly address the JD requirements
- Enhance experience descriptions to emphasise skills and achievements relevant to the JD (use keywords from the JD naturally)
- Add missing JD keywords to skills sections only if genuinely represented in the candidate's background
- Preserve ALL personal info, companies, positions, dates, institutions, and project titles exactly as-is
- Do NOT fabricate new experience, companies, degrees, or accomplishments
- Return ONLY valid JSON matching the original resume structure exactly

JOB DESCRIPTION:
${jobDescription.slice(0, 3000)}

CURRENT RESUME (JSON):
${JSON.stringify(content).slice(0, 6000)}

Return the tailored resume as a raw JSON object with identical structure. No markdown, no explanation.`;

  const result = await generateDeepSeekResponse(prompt);
  if (!result.text) throw new Error("AI service did not return a response.");

  const json = extractJSON(result.text);
  try {
    const parsed = JSON.parse(json) as ResumeContent;
    if (!parsed.personalInfo || !parsed.experience || !parsed.skills) throw new Error("Incomplete JSON");
    return parsed;
  } catch {
    throw new Error("Could not parse the tailored resume. Please try again.");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LLM – Translate resume content for global applications
// ─────────────────────────────────────────────────────────────────────────────

export async function translateResumeContent(
  content: ResumeContent,
  targetLanguage: string,
  tone: "professional" | "formal" | "concise" = "professional"
): Promise<ResumeContent> {
  const language = (targetLanguage || "").trim();
  if (!language) throw new Error("targetLanguage is required");

  const prompt = `You are a professional multilingual resume localization specialist.

Translate the resume JSON into ${language}.

Critical rules:
- Preserve all facts exactly: names, companies, institutions, dates, metrics, achievements, and order.
- Keep URLs, email addresses, phone numbers, LinkedIn handles, certifications names, and technology names unchanged unless there is a common local rendering.
- Do NOT invent, remove, or exaggerate content.
- Keep the exact same JSON structure and IDs.
- Ensure tone is ${tone} and suitable for recruiter screening in ${language}.
- Translate text fields and list item text naturally for native professional readers.

Return ONLY valid raw JSON with identical structure.

SOURCE RESUME JSON:
${JSON.stringify(content).slice(0, 14000)}`;

  const result = await generateDeepSeekResponse(prompt);
  if (!result.text) throw new Error("AI service did not return a response.");

  const json = extractJSON(result.text);
  const parsed = tryParseResumeContent(json);
  if (parsed) return parsed;

  const repaired = await repairResumeJSON(json || result.text);
  if (repaired) return repaired;

  throw new Error("Could not parse translated resume content. Please try again.");
}

// ─────────────────────────────────────────────────────────────────────────────
// LLM – Generate a cover letter from resume + job description
// ─────────────────────────────────────────────────────────────────────────────

export async function generateCoverLetterFromResume(
  content: ResumeContent,
  jobDescription: string,
  targetRole?: string
): Promise<string> {
  const p = content.personalInfo;
  const roleHint = targetRole ? ` for the role of ${targetRole}` : "";

  const prompt = `You are an expert cover letter writer. Write a compelling, personalised cover letter${roleHint}.

Guidelines:
- Address the specific requirements and keywords in the job description
- Highlight the candidate's most relevant experience and achievements from the resume
- Open with a strong, attention-grabbing paragraph
- Body: 2 paragraphs connecting experience to JD requirements with specific examples
- Closing: confident call to action
- Professional but human tone — avoid generic phrases like "I am writing to apply"
- Keep to 3-4 paragraphs, under 400 words
- Address to "Hiring Manager" if no specific name is available
- Sign off with the candidate's name: ${p.name || "[Candidate Name]"}

CANDIDATE RESUME SUMMARY:
Name: ${p.name}
Email: ${p.email}
Summary: ${p.summary}
Top skills: ${content.skills.technical.slice(0, 10).join(", ")}
Most recent role: ${content.experience[0] ? `${content.experience[0].position} at ${content.experience[0].company}` : "N/A"}
Key achievements: ${content.experience.flatMap(e => e.achievements).slice(0, 4).join("; ")}

JOB DESCRIPTION:
${jobDescription.slice(0, 3000)}

Write the cover letter now (plain text, no markdown headers, ready to copy-paste):`;

  const result = await generateDeepSeekResponse(prompt);
  if (!result.text) throw new Error("AI service did not return a response.");
  return result.text.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// LLM – ATS compliance analysis
// ─────────────────────────────────────────────────────────────────────────────

export async function runATSCheck(
  content: ResumeContent,
  targetRole?: string,
  jobDescription?: string
): Promise<ATSReport> {
  const resumeText = resumeContentToText(content);
  const roleHint = jobDescription
    ? `The candidate is applying for: "${targetRole || "the role"}". Analyse against this job description:\n${jobDescription.slice(0, 2000)}`
    : targetRole ? `The target role is: "${targetRole}".` : "No specific target role provided — do a general ATS analysis.";

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
  const parsed = tryParseATSReport(json);
  if (parsed) return parsed;

  console.warn("[runATSCheck] Direct JSON parse failed; attempting repair pass");
  const repaired = await repairATSReportJSON(json || atsResult.text || "");
  if (repaired) return repaired;

  console.error(
    "[runATSCheck] ATS JSON parse failed after repair. Raw LLM output:\n",
    atsResult.text?.slice(0, 1000),
    "\nLLM error:",
    atsResult.error
  );
  return buildHeuristicATSReport(content, targetRole, jobDescription, atsResult.error);
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

  if (content.references.length > 0) {
    lines.push("\nREFERENCES");
    lines.push(...content.references);
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
    references: [],
  };
}

function tokenizeKeywords(input: string): string[] {
  const stopWords = new Set([
    "the", "and", "for", "with", "from", "that", "this", "your", "you", "our", "are", "was", "will",
    "have", "has", "had", "into", "onto", "about", "role", "job", "work", "team", "year", "years",
    "using", "used", "ability", "their", "them", "they", "who", "how", "all", "any", "not", "but",
    "can", "may", "per", "via", "etc", "than", "then", "also", "one", "two", "three", "required",
    "preferred", "candidate", "experience", "responsible", "requirements", "skills", "skill"
  ]);

  return Array.from(
    new Set(
      input
        .toLowerCase()
        .replace(/[^a-z0-9+/#.\s-]/g, " ")
        .split(/\s+/)
        .map(token => token.trim())
        .filter(token => token.length >= 3 && !stopWords.has(token))
    )
  );
}

function extractTargetKeywords(targetRole?: string, jobDescription?: string): string[] {
  const source = [targetRole || "", jobDescription || ""].filter(Boolean).join(" ");
  const tokens = tokenizeKeywords(source);
  return tokens.slice(0, 18);
}

function buildHeuristicATSReport(
  content: ResumeContent,
  targetRole?: string,
  jobDescription?: string,
  llmError?: string
): ATSReport {
  const resumeText = resumeContentToText(content).toLowerCase();
  const targetKeywords = extractTargetKeywords(targetRole, jobDescription);
  const foundKeywords = targetKeywords.filter(keyword => resumeText.includes(keyword));
  const missingKeywords = targetKeywords.filter(keyword => !resumeText.includes(keyword)).slice(0, 10);

  const hasName = !!content.personalInfo.name.trim();
  const hasEmail = !!content.personalInfo.email.trim();
  const hasPhone = !!content.personalInfo.phone.trim();
  const hasSummary = !!content.personalInfo.summary.trim();
  const expCount = content.experience.length;
  const eduCount = content.education.length;
  const skillCount = content.skills.technical.length + content.skills.soft.length + content.skills.certifications.length;
  const achievementsCount = content.experience.reduce((sum, item) => sum + item.achievements.length, 0);
  const projectsCount = content.projects.length;

  const formattingIssues: string[] = [];
  if (!hasEmail) formattingIssues.push("Add a professional email address to the resume header.");
  if (!hasPhone) formattingIssues.push("Add a phone number so recruiters can contact you directly.");
  if (!content.personalInfo.linkedin.trim()) formattingIssues.push("Include a LinkedIn URL for recruiter verification.");

  const structureIssues: string[] = [];
  if (!hasSummary) structureIssues.push("Add a concise professional summary tailored to the target role.");
  if (expCount === 0) structureIssues.push("Add at least one work experience entry.");
  if (eduCount === 0) structureIssues.push("Add an education section to complete the ATS profile.");
  if (skillCount === 0) structureIssues.push("Add a dedicated skills section with relevant keywords.");

  const contentSuggestions: string[] = [];
  if (achievementsCount < Math.max(2, expCount)) contentSuggestions.push("Add measurable achievements under each role, such as cost savings, scale, or delivery impact.");
  if (projectsCount === 0) contentSuggestions.push("Add notable projects if they strengthen alignment with the target role.");
  if (content.skills.certifications.length === 0) contentSuggestions.push("Include relevant certifications if applicable to the role.");

  const keywordsScore = targetKeywords.length === 0
    ? Math.min(85, 45 + Math.min(skillCount * 4, 40))
    : Math.round((foundKeywords.length / Math.max(targetKeywords.length, 1)) * 100);
  const formattingScore = Math.max(55, 100 - formattingIssues.length * 12);
  const contentScore = Math.max(40, Math.min(100,
    35 + Math.min(expCount * 12, 30) + Math.min(achievementsCount * 4, 20) + Math.min(skillCount * 2, 15)
  ));
  const structureScore = Math.max(40, 100 - structureIssues.length * 15);

  const overallScore = Math.round(
    keywordsScore * 0.35 +
    contentScore * 0.30 +
    structureScore * 0.20 +
    formattingScore * 0.15
  );

  const suggestions: ATSSuggestion[] = [];
  if (missingKeywords.length > 0) {
    suggestions.push({
      category: "keywords",
      priority: "high",
      issue: `Important target keywords are missing: ${missingKeywords.slice(0, 4).join(", ")}`,
      fix: "Naturally add these keywords to your summary, skills, and experience bullets where they accurately reflect your work.",
    });
  }
  for (const issue of formattingIssues.slice(0, 2)) {
    suggestions.push({ category: "formatting", priority: "medium", issue, fix: issue });
  }
  for (const issue of structureIssues.slice(0, 2)) {
    suggestions.push({ category: "structure", priority: "high", issue, fix: issue });
  }
  for (const issue of contentSuggestions.slice(0, 3)) {
    suggestions.push({ category: "content", priority: "medium", issue, fix: issue });
  }

  const fallbackNote = llmError ? " AI scoring service was unavailable, so this score uses a local ATS heuristic." : "";

  return {
    score: overallScore,
    sections: {
      keywords: { score: keywordsScore, found: foundKeywords, missing: missingKeywords },
      formatting: { score: formattingScore, issues: formattingIssues },
      content: { score: contentScore, suggestions: contentSuggestions },
      structure: { score: structureScore, issues: structureIssues },
    },
    suggestions: suggestions.slice(0, 8),
    summary:
      overallScore >= 80
        ? `This resume is in strong ATS shape with solid structure and relevant content.${fallbackNote}`
        : overallScore >= 60
          ? `This resume is reasonably ATS-friendly but still has keyword or structure gaps that may limit visibility.${fallbackNote}`
          : `This resume needs stronger keyword alignment and clearer ATS structure before it will perform consistently.${fallbackNote}`,
  };
}

function defaultATSReport(): ATSReport {
  return buildHeuristicATSReport(emptyResumeContent(), undefined, undefined, "LLM unavailable");
}
