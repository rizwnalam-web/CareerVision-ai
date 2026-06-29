import { jsonrepair } from "jsonrepair";
import { Router, Request, Response } from "express";
import multer from "multer";
import { randomBytes } from "crypto";
import { db } from "../db/database.js";
import {
  parsePdf,
  parseDocx,
  parseTxt,
  structureResumeFromText,
  runATSCheck,
  getResumeSuggestions,
  tailorResumeToJD,
  translateResumeContent,
  generateCoverLetterFromResume,
  type ResumeContent,
} from "../services/resumeService.js";
import { generateDeepSeekResponse } from "../services/deepseekService.js";

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Validate and normalise the caller-supplied user identifier.
 * Accepts both PostgreSQL UUIDs and Firebase UIDs (any non-empty string).
 * The resume/portfolio tables use a plain TEXT column (user_identifier),
 * so no DB lookup is needed.
 */
function normaliseUserId(raw: unknown): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null") return null;
  return trimmed;
}

type DeepResumeEvidence = {
  sourceType: "experience" | "project" | "github" | "caseStudy" | "reference" | "skill" | "education" | "award";
  title: string;
  quote: string;
  link?: string;
  sourceId?: string;
  sectionPath?: string;
};

type DeepResumeAnswer = {
  answer: string;
  evidence: DeepResumeEvidence[];
  followUpQuestions: string[];
  confidence: number;
};

type DeepProfileSnapshot = {
  name: string;
  headline: string;
  strengths: string[];
  githubRepos: Array<{ title: string; url: string }>;
  caseStudies: Array<{ title: string; url: string }>;
  references: string[];
};

type DeepProfileLoadResult = {
  content: ResumeContent | null;
  portfolio: any[];
  mergedReferences: string[];
  profileSnapshot: DeepProfileSnapshot;
};

function extractJSON(raw: string | null | undefined): string {
  if (!raw) return "";
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : (() => {
    const first = raw.indexOf("{");
    const last  = raw.lastIndexOf("}");
    return first !== -1 && last > first ? raw.slice(first, last + 1) : raw.trim();
  })();
  return jsonrepair(candidate);
}

function parseDeepResumeAnswer(raw: string | null | undefined): DeepResumeAnswer | null {
  if (!raw) return null;
  const cleaned = extractJSON(raw);
  try {
    const parsed = JSON.parse(cleaned) as Partial<DeepResumeAnswer>;
    if (!parsed || typeof parsed.answer !== "string") return null;

    const allowedSourceTypes = new Set(["experience", "project", "github", "caseStudy", "reference", "skill", "education", "award"]);
    const evidence = Array.isArray(parsed.evidence)
      ? parsed.evidence
          .filter((item): item is DeepResumeEvidence => Boolean(item && typeof item.title === "string" && typeof item.quote === "string"))
          .slice(0, 8)
          .map((item) => {
            const rawSourceType = String((item as any).sourceType || "").trim().toLowerCase();
            const normalized = rawSourceType === "references" ? "reference" : rawSourceType;
            const sourceType = allowedSourceTypes.has(normalized)
              ? (normalized as DeepResumeEvidence["sourceType"])
              : "project";
            return { ...item, sourceType };
          })
      : [];

    const followUpQuestions = Array.isArray(parsed.followUpQuestions)
      ? parsed.followUpQuestions.filter((q): q is string => typeof q === "string" && q.trim().length > 0).slice(0, 4)
      : [];

    const confidence = Number(parsed.confidence);
    const safeConfidence = Number.isFinite(confidence) ? Math.max(0, Math.min(100, Math.round(confidence))) : 70;

    return {
      answer: parsed.answer.trim(),
      evidence,
      followUpQuestions,
      confidence: safeConfidence,
    };
  } catch {
    return null;
  }
}

function makeShareSlug(): string {
  return randomBytes(8).toString("hex");
}

function buildDeepProfileSnapshot(content: ResumeContent | null, portfolio: any[], mergedReferences: string[]): DeepProfileSnapshot {
  return {
    name: content?.personalInfo?.name || "Candidate",
    headline: content?.personalInfo?.summary || "",
    strengths: [
      ...(content?.skills?.technical || []),
      ...(content?.skills?.soft || []),
    ].slice(0, 8),
    githubRepos: portfolio
      .filter((p: any) => typeof p.repo_url === "string" && p.repo_url.trim().length > 0)
      .slice(0, 8)
      .map((p: any) => ({ title: p.title, url: p.repo_url })),
    caseStudies: portfolio
      .filter((p: any) => typeof p.project_url === "string" && p.project_url.trim().length > 0)
      .slice(0, 8)
      .map((p: any) => ({ title: p.title, url: p.project_url })),
    references: mergedReferences,
  };
}

async function loadDeepProfileData(userIdentifier: string, references: string[] = []): Promise<DeepProfileLoadResult> {
  const resumeRow = await db.oneOrNone(
    `SELECT r.id, rv.content_json
     FROM resumes r
     LEFT JOIN resume_versions rv ON rv.id = r.current_version_id
     WHERE r.user_identifier = $1
     LIMIT 1`,
    [userIdentifier]
  );

  const portfolio = await db.manyOrNone(
    `SELECT id, title, description, role, tech_stack, project_url, repo_url, tags, featured
     FROM portfolio_projects
     WHERE user_identifier = $1
     ORDER BY featured DESC, updated_at DESC
     LIMIT 50`,
    [userIdentifier]
  );

  const content = (resumeRow?.content_json && typeof resumeRow.content_json === "object")
    ? (resumeRow.content_json as ResumeContent)
    : null;

  const resumeReferences = Array.isArray((content as any)?.references)
    ? ((content as any).references as string[])
    : [];

  const mergedReferences = Array.from(new Set([
    ...(Array.isArray(references) ? references : []),
    ...resumeReferences,
  ].filter(item => typeof item === "string" && item.trim().length > 0).map(item => item.trim()))).slice(0, 12);

  return {
    content,
    portfolio,
    mergedReferences,
    profileSnapshot: buildDeepProfileSnapshot(content, portfolio, mergedReferences),
  };
}

function mapEvidenceToSection(evidence: DeepResumeEvidence, context: { content: ResumeContent | null; portfolio: any[]; mergedReferences: string[] }): DeepResumeEvidence {
  if (evidence.sectionPath) {
    const rawPath = evidence.sectionPath.trim();
    const hasResumePrefix = rawPath.startsWith("resume.");
    const hasPortfolioPrefix = rawPath.startsWith("portfolio[");
    if (!hasResumePrefix && !hasPortfolioPrefix) {
      if (["github", "caseStudy", "project"].includes(evidence.sourceType)) {
        evidence = { ...evidence, sectionPath: rawPath.startsWith("[") ? `portfolio${rawPath}` : `portfolio.${rawPath}` };
      } else {
        evidence = { ...evidence, sectionPath: `resume.${rawPath}` };
      }
    }
  }

  if (evidence.sectionPath && evidence.sourceId) return evidence;

  const title = (evidence.title || "").toLowerCase();
  const quote = (evidence.quote || "").toLowerCase();

  const matchText = (text: string) => title.includes(text.toLowerCase()) || quote.includes(text.toLowerCase());

  if (context.content) {
    if (evidence.sourceType === "experience") {
      const idx = context.content.experience.findIndex((exp) => {
        const label = `${exp.position} ${exp.company}`.trim();
        return matchText(label) || matchText(exp.description || "");
      });
      if (idx >= 0) {
        const exp = context.content.experience[idx];
        return { ...evidence, sourceId: exp.id, sectionPath: `resume.experience[${idx}]` };
      }
    }

    if (evidence.sourceType === "education") {
      const idx = context.content.education.findIndex((edu) => matchText(`${edu.degree} ${edu.institution}`));
      if (idx >= 0) {
        const edu = context.content.education[idx];
        return { ...evidence, sourceId: edu.id, sectionPath: `resume.education[${idx}]` };
      }
    }

    if (evidence.sourceType === "project") {
      const idx = context.content.projects.findIndex((proj) => matchText(`${proj.title} ${proj.description}`));
      if (idx >= 0) {
        const proj = context.content.projects[idx];
        return { ...evidence, sourceId: proj.id, sectionPath: `resume.projects[${idx}]`, link: evidence.link || proj.url || undefined };
      }
    }

    if (evidence.sourceType === "reference") {
      const idx = context.mergedReferences.findIndex((ref) => matchText(ref));
      if (idx >= 0) return { ...evidence, sourceId: `ref-${idx}`, sectionPath: `resume.references[${idx}]` };
    }

    if (evidence.sourceType === "award") {
      const idx = context.content.awards.findIndex((award) => matchText(award));
      if (idx >= 0) return { ...evidence, sourceId: `award-${idx}`, sectionPath: `resume.awards[${idx}]` };
    }

    if (evidence.sourceType === "skill") {
      const skills = [
        ...context.content.skills.technical.map((s, i) => ({ s, p: `resume.skills.technical[${i}]` })),
        ...context.content.skills.soft.map((s, i) => ({ s, p: `resume.skills.soft[${i}]` })),
        ...context.content.skills.certifications.map((s, i) => ({ s, p: `resume.skills.certifications[${i}]` })),
      ];
      const found = skills.find((k) => matchText(k.s));
      if (found) return { ...evidence, sourceId: found.s, sectionPath: found.p };
    }
  }

  if (evidence.sourceType === "github" || evidence.sourceType === "caseStudy" || evidence.sourceType === "project") {
    const idx = context.portfolio.findIndex((p) => matchText(`${p.title} ${p.description || ""}`));
    if (idx >= 0) {
      const p = context.portfolio[idx];
      const link = evidence.link || p.repo_url || p.project_url || undefined;
      return { ...evidence, sourceId: p.id, sectionPath: `portfolio[${idx}]`, link };
    }
  }

  return evidence;
}

async function saveDeepResumeHistory(args: {
  userIdentifier: string;
  accessScope: "owner" | "public";
  shareSlug?: string | null;
  question: string;
  response: DeepResumeAnswer;
}) {
  await db.none(
    `INSERT INTO deep_resume_qa_history
       (user_identifier, access_scope, share_slug, question, answer, confidence, response_json, evidence_json)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      args.userIdentifier,
      args.accessScope,
      args.shareSlug || null,
      args.question,
      args.response.answer,
      args.response.confidence,
      JSON.stringify(args.response),
      JSON.stringify(args.response.evidence || []),
    ]
  );
}

async function answerDeepResumeQuestion(args: {
  question: string;
  content: ResumeContent | null;
  portfolio: any[];
  mergedReferences: string[];
  conversation: Array<{ question: string; answer: string }>;
}): Promise<DeepResumeAnswer> {
  const prompt = `You are a recruiter-facing interactive deep resume assistant.

Answer the recruiter question using ONLY the candidate data provided.
Do not invent facts. If evidence is missing, explicitly say what is missing.
Keep answer concise, specific, and professional.

Return ONLY JSON in this exact format:
{
  "answer": "string",
  "evidence": [
    {
      "sourceType": "experience|project|github|caseStudy|reference|skill|education|award",
      "title": "short source title",
      "quote": "specific supporting fact from provided data",
      "link": "optional https URL",
      "sourceId": "optional source id from the provided objects",
      "sectionPath": "exact path like resume.experience[0] or portfolio[2]"
    }
  ],
  "followUpQuestions": ["string", "string"],
  "confidence": 0
}

Candidate data:
${JSON.stringify({
    resumeContent: args.content || null,
    portfolio: args.portfolio,
    references: args.mergedReferences,
    previousConversation: args.conversation,
  }).slice(0, 26000)}

Recruiter question:
${args.question.trim()}`;

  const result = await generateDeepSeekResponse(prompt, {
    temperature: 0.2,
    maxTokens: 900,
    systemInstruction: "You are a precise hiring intelligence assistant. Cite evidence from provided profile data only.",
  });

  const parsed = parseDeepResumeAnswer(result.text);
  const context = {
    content: args.content,
    portfolio: args.portfolio,
    mergedReferences: args.mergedReferences,
  };

  if (!parsed) {
    return {
      answer: "I could not fully structure an AI answer right now, but the profile data is available. Ask a more specific question about leadership, delivery impact, or technical ownership.",
      evidence: args.portfolio.slice(0, 2).map((p: any, idx: number) => ({
        sourceType: p.repo_url ? "github" : "project",
        title: p.title || `Portfolio item ${idx + 1}`,
        quote: p.description || p.role || "Portfolio evidence available",
        link: p.repo_url || p.project_url || undefined,
        sourceId: p.id,
        sectionPath: `portfolio[${idx}]`,
      })),
      followUpQuestions: [
        "Can you show leadership examples across distributed teams?",
        "Which projects best demonstrate architecture ownership?",
      ],
      confidence: 45,
    };
  }

  const mappedEvidence = parsed.evidence.map((item) => mapEvidenceToSection(item, context));
  return {
    ...parsed,
    evidence: mappedEvidence,
  };
}

// ---------------------------------------------------------------------------
// Multer � keep files in memory (max 10 MB)
// ---------------------------------------------------------------------------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/octet-stream",   // some browsers send PDFs as this
      "application/msword",
    ];
    const ext = (file.originalname || "").split(".").pop()?.toLowerCase();
    const allowedExts = ["pdf", "docx", "txt"];
    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext || "")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOCX, and TXT files are supported"));
    }
  },
});

// ---------------------------------------------------------------------------
// POST /api/resume/parse  � upload & parse a resume file
// ---------------------------------------------------------------------------
router.post(
  "/parse",
  // Wrap multer so its errors surface as JSON (not HTML 500 pages)
  (req: Request, res: Response, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message || "File upload failed" });
      next();
    });
  },
  async (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const userIdentifier = normaliseUserId(req.body.userId);
      if (!userIdentifier) return res.status(400).json({ error: "userId is required" });

      const { targetRole } = req.body;

      // Detect format by MIME type then extension fallback
      const mime = req.file.mimetype;
      const ext  = (req.file.originalname || "").split(".").pop()?.toLowerCase();
      const isPdf  = mime === "application/pdf"  || ext === "pdf";
      const isDocx = mime.includes("wordprocessingml") || ext === "docx";

      let rawText = "";
      try {
        if (isPdf)       rawText = await parsePdf(req.file.buffer);
        else if (isDocx) rawText = await parseDocx(req.file.buffer);
        else             rawText = parseTxt(req.file.buffer);
      } catch (parseErr: any) {
        console.error("[resume/parse] extraction error:", parseErr.message);
        return res.status(422).json({ error: `Could not read file: ${parseErr.message}` });
      }

      if (!rawText.trim()) {
        return res.status(422).json({
          error: "No text could be extracted. Is this a scanned image PDF?",
        });
      }

      console.log(`[resume/parse] file="${req.file.originalname}" format=${isPdf?"pdf":isDocx?"docx":"txt"} textLen=${rawText.length}`);

      const content = await structureResumeFromText(rawText);
      // ATS check is deferred — user triggers it from the ATS tab
      // Running it here doubled the LLM wait time (60–120 s)
      const atsReport = null;

      let resume = await db.oneOrNone(
        "SELECT id FROM resumes WHERE user_identifier = $1 LIMIT 1",
        [userIdentifier]
      );
      if (!resume) {
        resume = await db.one(
          "INSERT INTO resumes (user_identifier, title) VALUES ($1, $2) RETURNING id",
          [userIdentifier, req.file.originalname.replace(/\.[^.]+$/, "") || "My Resume"]
        );
      }

      const versionCount = await db.one(
        "SELECT COALESCE(MAX(version_number), 0) AS max FROM resume_versions WHERE resume_id = $1",
        [resume.id]
      );
      const nextVersion = Number(versionCount.max) + 1;

      const version = await db.one(
        `INSERT INTO resume_versions
           (resume_id, version_number, content_json, raw_text, file_name, file_format,
            ats_score, ats_report_json, change_summary)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [
          resume.id, nextVersion,
          JSON.stringify(content),
          rawText.slice(0, 50000),
          req.file.originalname,
          isPdf ? "pdf" : isDocx ? "docx" : "txt",
          null,   // ats_score — populated when user runs ATS check
          null,   // ats_report_json
          `Uploaded ${req.file.originalname}`,
        ]
      );

      await db.none(
        "UPDATE resumes SET current_version_id = $1, updated_at = NOW() WHERE id = $2",
        [version.id, resume.id]
      );

      res.json({
        success: true,
        resumeId: resume.id,
        versionId: version.id,
        versionNumber: nextVersion,
        content,
        atsReport,
      });
    } catch (err: any) {
      console.error("[resume/parse]", err);
      res.status(500).json({ error: err.message || "Failed to parse resume" });
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/resume/:userId  � get current resume
// ---------------------------------------------------------------------------
router.get("/:userId", async (req: Request, res: Response) => {
  try {
    const userIdentifier = normaliseUserId(req.params.userId);
    if (!userIdentifier) return res.status(400).json({ error: "userId is required" });

    const resume = await db.oneOrNone(
      `SELECT r.*, rv.content_json, rv.ats_score, rv.ats_report_json,
              rv.version_number, rv.file_name, rv.id AS version_id
       FROM resumes r
       LEFT JOIN resume_versions rv ON rv.id = r.current_version_id
       WHERE r.user_identifier = $1
       LIMIT 1`,
      [userIdentifier]
    );

    if (!resume) return res.json({ success: true, resume: null });

    res.json({
      success: true,
      resume: {
        id: resume.id,
        title: resume.title,
        currentVersionId: resume.version_id,
        versionNumber: resume.version_number,
        fileName: resume.file_name,
        content: resume.content_json,
        atsScore: resume.ats_score,
        atsReport: resume.ats_report_json,
        updatedAt: resume.updated_at,
      },
    });
  } catch (err) {
    console.error("[resume/get]", err);
    res.status(500).json({ error: "Failed to fetch resume" });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/resume/:userId/content  � save edited content as new version
// ---------------------------------------------------------------------------
router.put("/:userId/content", async (req: Request, res: Response) => {
  try {
    const userIdentifier = normaliseUserId(req.params.userId);
    if (!userIdentifier) return res.status(400).json({ error: "userId is required" });

    const { content, changeSummary, targetRole } = req.body as {
      content: ResumeContent; changeSummary?: string; targetRole?: string;
    };
    if (!content) return res.status(400).json({ error: "content is required" });

    let resume = await db.oneOrNone(
      "SELECT id FROM resumes WHERE user_identifier = $1 LIMIT 1",
      [userIdentifier]
    );
    if (!resume) {
      resume = await db.one(
        "INSERT INTO resumes (user_identifier) VALUES ($1) RETURNING id",
        [userIdentifier]
      );
    }

    const atsReport    = await runATSCheck(content, targetRole);
    const versionCount = await db.one(
      "SELECT COALESCE(MAX(version_number), 0) AS max FROM resume_versions WHERE resume_id = $1",
      [resume.id]
    );
    const nextVersion = Number(versionCount.max) + 1;

    const version = await db.one(
      `INSERT INTO resume_versions
         (resume_id, version_number, content_json, ats_score, ats_report_json, change_summary)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [resume.id, nextVersion, JSON.stringify(content), atsReport.score,
       JSON.stringify(atsReport), changeSummary || `Manual edit v${nextVersion}`]
    );

    await db.none(
      "UPDATE resumes SET current_version_id = $1, updated_at = NOW() WHERE id = $2",
      [version.id, resume.id]
    );

    res.json({ success: true, versionId: version.id, versionNumber: nextVersion, atsReport });
  } catch (err) {
    console.error("[resume/save]", err);
    res.status(500).json({ error: "Failed to save resume" });
  }
});

// ---------------------------------------------------------------------------
// GET /api/resume/:userId/versions
// ---------------------------------------------------------------------------
router.get("/:userId/versions", async (req: Request, res: Response) => {
  try {
    const userIdentifier = normaliseUserId(req.params.userId);
    if (!userIdentifier) return res.status(400).json({ error: "userId is required" });

    const resume = await db.oneOrNone(
      "SELECT id, current_version_id FROM resumes WHERE user_identifier = $1 LIMIT 1",
      [userIdentifier]
    );
    if (!resume) return res.json({ success: true, versions: [] });

    const versions = await db.manyOrNone(
      `SELECT id,
              version_number   AS "versionNumber",
              file_name        AS "fileName",
              file_format      AS "fileFormat",
              ats_score        AS "atsScore",
              change_summary   AS "changeSummary",
              created_at       AS "createdAt"
       FROM resume_versions WHERE resume_id = $1 ORDER BY version_number DESC`,
      [resume.id]
    );

    res.json({ success: true, currentVersionId: resume.current_version_id, versions: versions || [] });
  } catch (err) {
    console.error("[resume/versions]", err);
    res.status(500).json({ error: "Failed to fetch versions" });
  }
});

// ---------------------------------------------------------------------------
// POST /api/resume/:userId/restore/:versionId
// ---------------------------------------------------------------------------
router.post("/:userId/restore/:versionId", async (req: Request, res: Response) => {
  try {
    const userIdentifier = normaliseUserId(req.params.userId);
    if (!userIdentifier) return res.status(400).json({ error: "userId is required" });

    const { versionId } = req.params;

    const resume = await db.oneOrNone(
      "SELECT id FROM resumes WHERE user_identifier = $1 LIMIT 1",
      [userIdentifier]
    );
    if (!resume) return res.status(404).json({ error: "No resume found" });

    const version = await db.oneOrNone(
      "SELECT * FROM resume_versions WHERE id = $1 AND resume_id = $2",
      [versionId, resume.id]
    );
    if (!version) return res.status(404).json({ error: "Version not found" });

    const versionCount = await db.one(
      "SELECT COALESCE(MAX(version_number), 0) AS max FROM resume_versions WHERE resume_id = $1",
      [resume.id]
    );
    const nextVersion = Number(versionCount.max) + 1;

    const newVersion = await db.one(
      `INSERT INTO resume_versions
         (resume_id, version_number, content_json, raw_text, file_name, file_format,
          ats_score, ats_report_json, change_summary)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [resume.id, nextVersion, version.content_json, version.raw_text,
       version.file_name, version.file_format, version.ats_score,
       version.ats_report_json, `Restored from v${version.version_number}`]
    );

    await db.none(
      "UPDATE resumes SET current_version_id = $1, updated_at = NOW() WHERE id = $2",
      [newVersion.id, resume.id]
    );

    res.json({ success: true, versionId: newVersion.id, versionNumber: nextVersion });
  } catch (err) {
    console.error("[resume/restore]", err);
    res.status(500).json({ error: "Failed to restore version" });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/resume/:userId/version/:versionId  – delete a non-current version
// ---------------------------------------------------------------------------
router.delete("/:userId/version/:versionId", async (req: Request, res: Response) => {
  try {
    const userIdentifier = normaliseUserId(req.params.userId);
    if (!userIdentifier) return res.status(400).json({ error: "userId is required" });

    const { versionId } = req.params;

    const resume = await db.oneOrNone(
      "SELECT id, current_version_id FROM resumes WHERE user_identifier = $1 LIMIT 1",
      [userIdentifier]
    );
    if (!resume) return res.status(404).json({ error: "No resume found" });

    if (resume.current_version_id === versionId) {
      return res.status(400).json({ error: "Cannot delete the current resume version" });
    }

    const version = await db.oneOrNone(
      "SELECT id FROM resume_versions WHERE id = $1 AND resume_id = $2",
      [versionId, resume.id]
    );
    if (!version) return res.status(404).json({ error: "Version not found" });

    await db.none(
      "DELETE FROM resume_versions WHERE id = $1 AND resume_id = $2",
      [versionId, resume.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("[resume/delete-version]", err);
    res.status(500).json({ error: "Failed to delete resume version" });
  }
});

// ---------------------------------------------------------------------------
// POST /api/resume/ats-check
// ---------------------------------------------------------------------------
router.post("/ats-check", async (req: Request, res: Response) => {
  try {
    const { content, targetRole, jobDescription } = req.body;
    if (!content) return res.status(400).json({ error: "content is required" });
    const report = await runATSCheck(content, targetRole, jobDescription);
    res.json({ success: true, report });
  } catch (err) {
    console.error("[resume/ats-check]", err);
    res.status(500).json({ error: "ATS check failed" });
  }
});

// ---------------------------------------------------------------------------
// POST /api/resume/tailor  – AI-tailor resume content to a job description
// ---------------------------------------------------------------------------
router.post("/tailor", async (req: Request, res: Response) => {
  try {
    const { content, jobDescription } = req.body as {
      content: ResumeContent;
      jobDescription: string;
    };
    if (!content) return res.status(400).json({ error: "content is required" });
    if (!jobDescription?.trim()) return res.status(400).json({ error: "jobDescription is required" });
    const tailored = await tailorResumeToJD(content, jobDescription);
    res.json({ success: true, tailored });
  } catch (err: any) {
    console.error("[resume/tailor]", err);
    res.status(500).json({ error: err.message || "Tailoring failed" });
  }
});

// ---------------------------------------------------------------------------
// POST /api/resume/:userId/translate  – translate resume content to target language
// ---------------------------------------------------------------------------
router.post("/:userId/translate", async (req: Request, res: Response) => {
  try {
    const userIdentifier = normaliseUserId(req.params.userId);
    if (!userIdentifier) return res.status(400).json({ error: "userId is required" });

    const {
      content,
      targetLanguage,
      tone,
      saveAsVersion = true,
    } = req.body as {
      content: ResumeContent;
      targetLanguage: string;
      tone?: "professional" | "formal" | "concise";
      saveAsVersion?: boolean;
    };

    if (!content) return res.status(400).json({ error: "content is required" });
    if (!targetLanguage?.trim()) return res.status(400).json({ error: "targetLanguage is required" });

    const translated = await translateResumeContent(content, targetLanguage, tone || "professional");

    if (!saveAsVersion) {
      return res.json({ success: true, translated, saved: false });
    }

    let resume = await db.oneOrNone(
      "SELECT id FROM resumes WHERE user_identifier = $1 LIMIT 1",
      [userIdentifier]
    );
    if (!resume) {
      resume = await db.one(
        "INSERT INTO resumes (user_identifier) VALUES ($1) RETURNING id",
        [userIdentifier]
      );
    }

    const versionCount = await db.one(
      "SELECT COALESCE(MAX(version_number), 0) AS max FROM resume_versions WHERE resume_id = $1",
      [resume.id]
    );
    const nextVersion = Number(versionCount.max) + 1;

    const version = await db.one(
      `INSERT INTO resume_versions
         (resume_id, version_number, content_json, ats_score, ats_report_json, change_summary)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [
        resume.id,
        nextVersion,
        JSON.stringify(translated),
        null,
        null,
        `AI translated to ${targetLanguage.trim()} (${tone || "professional"})`,
      ]
    );

    await db.none(
      "UPDATE resumes SET current_version_id = $1, updated_at = NOW() WHERE id = $2",
      [version.id, resume.id]
    );

    return res.json({
      success: true,
      translated,
      saved: true,
      versionId: version.id,
      versionNumber: nextVersion,
    });
  } catch (err: any) {
    console.error("[resume/translate]", err);
    res.status(500).json({ error: err.message || "Resume translation failed" });
  }
});

// ---------------------------------------------------------------------------
// POST /api/resume/:userId/deep-profile/share - create/update public share URL
// ---------------------------------------------------------------------------
router.post("/:userId/deep-profile/share", async (req: Request, res: Response) => {
  try {
    const userIdentifier = normaliseUserId(req.params.userId);
    if (!userIdentifier) return res.status(400).json({ error: "userId is required" });

    const enabled = req.body?.enabled !== false;
    const publicBaseUrl = typeof req.body?.publicBaseUrl === "string" && req.body.publicBaseUrl.trim()
      ? req.body.publicBaseUrl.trim().replace(/\/+$/, "")
      : `${req.protocol}://${req.get("host")}`;

    let share = await db.oneOrNone(
      `SELECT share_slug, is_public
       FROM deep_resume_shares
       WHERE user_identifier = $1`,
      [userIdentifier]
    );

    if (!share) {
      let created = null;
      for (let attempt = 0; attempt < 4 && !created; attempt++) {
        const shareSlug = makeShareSlug();
        created = await db.oneOrNone(
          `INSERT INTO deep_resume_shares (user_identifier, share_slug, is_public, last_shared_at)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (share_slug) DO NOTHING
           RETURNING share_slug, is_public`,
          [userIdentifier, shareSlug, enabled, enabled ? new Date() : null]
        );
      }
      if (!created) return res.status(500).json({ error: "Could not create share link" });
      share = created;
    } else {
      share = await db.one(
        `UPDATE deep_resume_shares
         SET is_public = $2,
             updated_at = NOW(),
             last_shared_at = CASE WHEN $2 THEN NOW() ELSE last_shared_at END
         WHERE user_identifier = $1
         RETURNING share_slug, is_public`,
        [userIdentifier, enabled]
      );
    }

    return res.json({
      success: true,
      shareSlug: share.share_slug,
      isPublic: Boolean(share.is_public),
      shareUrl: `${publicBaseUrl}/deep-resume.html?share=${encodeURIComponent(share.share_slug)}`,
    });
  } catch (err: any) {
    console.error("[resume/deep-profile/share]", err);
    res.status(500).json({ error: err.message || "Failed to create share link" });
  }
});

// ---------------------------------------------------------------------------
// GET /api/resume/:userId/deep-profile/history - persisted Q&A history
// ---------------------------------------------------------------------------
router.get("/:userId/deep-profile/history", async (req: Request, res: Response) => {
  try {
    const userIdentifier = normaliseUserId(req.params.userId);
    if (!userIdentifier) return res.status(400).json({ error: "userId is required" });

    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 20)));
    const rows = await db.manyOrNone(
      `SELECT id,
              access_scope AS "accessScope",
              share_slug AS "shareSlug",
              question,
              response_json AS response,
              created_at AS "createdAt"
       FROM deep_resume_qa_history
       WHERE user_identifier = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userIdentifier, limit]
    );

    res.json({ success: true, history: rows || [] });
  } catch (err: any) {
    console.error("[resume/deep-profile/history]", err);
    res.status(500).json({ error: err.message || "Failed to fetch deep resume history" });
  }
});

// ---------------------------------------------------------------------------
// GET /api/resume/public/:shareSlug - read-only profile snapshot for hiring managers
// ---------------------------------------------------------------------------
router.get("/public/:shareSlug", async (req: Request, res: Response) => {
  try {
    const shareSlug = String(req.params.shareSlug || "").trim();
    if (!shareSlug) return res.status(400).json({ error: "shareSlug is required" });

    const share = await db.oneOrNone(
      `SELECT user_identifier, is_public
       FROM deep_resume_shares
       WHERE share_slug = $1
       LIMIT 1`,
      [shareSlug]
    );

    if (!share || !share.is_public) {
      return res.status(404).json({ error: "Deep resume share link not found" });
    }

    const profile = await loadDeepProfileData(share.user_identifier, []);
    if (!profile.content && profile.portfolio.length === 0 && profile.mergedReferences.length === 0) {
      return res.status(404).json({ error: "No profile data available for this share link" });
    }

    res.json({ success: true, profileSnapshot: profile.profileSnapshot });
  } catch (err: any) {
    console.error("[resume/public/profile]", err);
    res.status(500).json({ error: err.message || "Failed to fetch public deep resume profile" });
  }
});

// ---------------------------------------------------------------------------
// POST /api/resume/public/:shareSlug/ask - read-only recruiter Q&A
// ---------------------------------------------------------------------------
router.post("/public/:shareSlug/ask", async (req: Request, res: Response) => {
  try {
    const shareSlug = String(req.params.shareSlug || "").trim();
    const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
    const conversation = Array.isArray(req.body?.conversation)
      ? req.body.conversation.filter((turn: any) => turn && typeof turn.question === "string" && typeof turn.answer === "string").slice(-4)
      : [];

    if (!shareSlug) return res.status(400).json({ error: "shareSlug is required" });
    if (!question || question.length < 4) return res.status(400).json({ error: "question is required" });

    const share = await db.oneOrNone(
      `SELECT user_identifier, is_public
       FROM deep_resume_shares
       WHERE share_slug = $1
       LIMIT 1`,
      [shareSlug]
    );
    if (!share || !share.is_public) {
      return res.status(404).json({ error: "Deep resume share link not found" });
    }

    const profile = await loadDeepProfileData(share.user_identifier, []);
    if (!profile.content && profile.portfolio.length === 0 && profile.mergedReferences.length === 0) {
      return res.status(404).json({ error: "No profile data available for this share link" });
    }

    const response = await answerDeepResumeQuestion({
      question,
      content: profile.content,
      portfolio: profile.portfolio,
      mergedReferences: profile.mergedReferences,
      conversation,
    });

    await saveDeepResumeHistory({
      userIdentifier: share.user_identifier,
      accessScope: "public",
      shareSlug,
      question,
      response,
    });

    return res.json({ success: true, profileSnapshot: profile.profileSnapshot, response });
  } catch (err: any) {
    console.error("[resume/public/ask]", err);
    res.status(500).json({ error: err.message || "Failed to answer public deep resume question" });
  }
});

// ---------------------------------------------------------------------------
// POST /api/resume/:userId/deep-profile/ask - interactive recruiter Q&A
// ---------------------------------------------------------------------------
router.post("/:userId/deep-profile/ask", async (req: Request, res: Response) => {
  try {
    const userIdentifier = normaliseUserId(req.params.userId);
    if (!userIdentifier) return res.status(400).json({ error: "userId is required" });

    const {
      question,
      conversation,
      references,
    } = req.body as {
      question: string;
      conversation?: Array<{ question: string; answer: string }>;
      references?: string[];
    };

    if (!question || typeof question !== "string" || question.trim().length < 4) {
      return res.status(400).json({ error: "question is required" });
    }

    const profile = await loadDeepProfileData(userIdentifier, references);
    if (!profile.content && profile.portfolio.length === 0 && profile.mergedReferences.length === 0) {
      return res.status(404).json({ error: "No resume profile data found yet. Upload a resume or add portfolio projects first." });
    }

    const safeHistory = Array.isArray(conversation)
      ? conversation
          .filter((turn) => turn && typeof turn.question === "string" && typeof turn.answer === "string")
          .slice(-4)
      : [];

    const response = await answerDeepResumeQuestion({
      question,
      content: profile.content,
      portfolio: profile.portfolio,
      mergedReferences: profile.mergedReferences,
      conversation: safeHistory,
    });

    await saveDeepResumeHistory({
      userIdentifier,
      accessScope: "owner",
      question,
      response,
    });

    return res.json({
      success: true,
      profileSnapshot: profile.profileSnapshot,
      response,
    });
  } catch (err: any) {
    console.error("[resume/deep-profile/ask]", err);
    res.status(500).json({ error: err.message || "Failed to answer deep resume question" });
  }
});

// ---------------------------------------------------------------------------
// POST /api/resume/cover-letter  – generate cover letter from resume + JD
// ---------------------------------------------------------------------------
router.post("/cover-letter", async (req: Request, res: Response) => {
  try {
    const { content, jobDescription, targetRole } = req.body as {
      content: ResumeContent;
      jobDescription: string;
      targetRole?: string;
    };
    if (!content) return res.status(400).json({ error: "content is required" });
    if (!jobDescription?.trim()) return res.status(400).json({ error: "jobDescription is required" });
    const coverLetter = await generateCoverLetterFromResume(content, jobDescription, targetRole);
    res.json({ success: true, coverLetter });
  } catch (err: any) {
    console.error("[resume/cover-letter]", err);
    res.status(500).json({ error: err.message || "Cover letter generation failed" });
  }
});

// ---------------------------------------------------------------------------
// POST /api/resume/suggest
// ---------------------------------------------------------------------------
router.post("/suggest", async (req: Request, res: Response) => {
  try {
    const { section, currentText, targetRole } = req.body;
    if (!section || !currentText) {
      return res.status(400).json({ error: "section and currentText are required" });
    }
    const suggestions = await getResumeSuggestions(section, currentText, targetRole);
    res.json({ success: true, suggestions });
  } catch (err) {
    console.error("[resume/suggest]", err);
    res.status(500).json({ error: "Failed to generate suggestions" });
  }
});

// ---------------------------------------------------------------------------
// Portfolio CRUD
// ---------------------------------------------------------------------------

router.get("/:userId/portfolio", async (req: Request, res: Response) => {
  try {
    const userIdentifier = normaliseUserId(req.params.userId);
    if (!userIdentifier) return res.status(400).json({ error: "userId is required" });
    const projects = await db.manyOrNone(
      "SELECT * FROM portfolio_projects WHERE user_identifier = $1 ORDER BY featured DESC, created_at DESC",
      [userIdentifier]
    );
    res.json({ success: true, projects: projects || [] });
  } catch (err) {
    console.error("[resume/portfolio/list]", err);
    res.status(500).json({ error: "Failed to fetch portfolio" });
  }
});

router.post("/:userId/portfolio", async (req: Request, res: Response) => {
  try {
    const userIdentifier = normaliseUserId(req.params.userId);
    if (!userIdentifier) return res.status(400).json({ error: "userId is required" });

    const { title, description, techStack, role, startDate, endDate,
            isOngoing, projectUrl, repoUrl, imageUrl, tags, featured } = req.body;
    if (!title) return res.status(400).json({ error: "title is required" });

    const project = await db.one(
      `INSERT INTO portfolio_projects
         (user_identifier, title, description, tech_stack, role, start_date, end_date,
          is_ongoing, project_url, repo_url, image_url, tags, featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [userIdentifier, title, description || null, techStack || [], role || null,
       startDate || null, endDate || null, isOngoing || false,
       projectUrl || null, repoUrl || null, imageUrl || null, tags || [], featured || false]
    );
    res.status(201).json({ success: true, project });
  } catch (err) {
    console.error("[resume/portfolio/create]", err);
    res.status(500).json({ error: "Failed to create portfolio project" });
  }
});

router.put("/:userId/portfolio/:projectId", async (req: Request, res: Response) => {
  try {
    const userIdentifier = normaliseUserId(req.params.userId);
    if (!userIdentifier) return res.status(400).json({ error: "userId is required" });

    const { projectId } = req.params;
    const { title, description, techStack, role, startDate, endDate,
            isOngoing, projectUrl, repoUrl, imageUrl, tags, featured } = req.body;

    const existing = await db.oneOrNone(
      "SELECT id FROM portfolio_projects WHERE id = $1 AND user_identifier = $2",
      [projectId, userIdentifier]
    );
    if (!existing) return res.status(404).json({ error: "Project not found" });

    const project = await db.one(
      `UPDATE portfolio_projects
       SET title=$1, description=$2, tech_stack=$3, role=$4, start_date=$5, end_date=$6,
           is_ongoing=$7, project_url=$8, repo_url=$9, image_url=$10, tags=$11,
           featured=$12, updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [title, description || null, techStack || [], role || null,
       startDate || null, endDate || null, isOngoing || false,
       projectUrl || null, repoUrl || null, imageUrl || null,
       tags || [], featured || false, projectId]
    );
    res.json({ success: true, project });
  } catch (err) {
    console.error("[resume/portfolio/update]", err);
    res.status(500).json({ error: "Failed to update project" });
  }
});

router.delete("/:userId/portfolio/:projectId", async (req: Request, res: Response) => {
  try {
    const userIdentifier = normaliseUserId(req.params.userId);
    if (!userIdentifier) return res.status(400).json({ error: "userId is required" });

    await db.none(
      "DELETE FROM portfolio_projects WHERE id = $1 AND user_identifier = $2",
      [req.params.projectId, userIdentifier]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("[resume/portfolio/delete]", err);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

export default router;
