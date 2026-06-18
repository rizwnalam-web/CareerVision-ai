import { Router, Request, Response } from "express";
import multer from "multer";
import { db } from "../db/database.js";
import {
  parsePdf,
  parseDocx,
  parseTxt,
  structureResumeFromText,
  runATSCheck,
  getResumeSuggestions,
  type ResumeContent,
} from "../services/resumeService.js";

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
// POST /api/resume/ats-check
// ---------------------------------------------------------------------------
router.post("/ats-check", async (req: Request, res: Response) => {
  try {
    const { content, targetRole } = req.body;
    if (!content) return res.status(400).json({ error: "content is required" });
    const report = await runATSCheck(content, targetRole);
    res.json({ success: true, report });
  } catch (err) {
    console.error("[resume/ats-check]", err);
    res.status(500).json({ error: "ATS check failed" });
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
