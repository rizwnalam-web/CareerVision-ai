import { Router, Request, Response } from "express";
import { db } from "../db/database.js";
import { generateDeepSeekResponse } from "../services/deepseekService.js";
import { submitJobBoardApplication } from "../services/jobBoardSubmissionService.js";
import { jsonrepair } from "jsonrepair";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function normaliseUserId(raw: unknown): string | null {
  if (!raw || typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t || t === "undefined" || t === "null") return null;
  return t;
}

function extractJSON(raw: string | null | undefined): string {
  if (!raw) return "";
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1].trim() : (() => {
    const first = raw.indexOf("{");
    const last  = raw.lastIndexOf("}");
    return first !== -1 && last > first ? raw.slice(first, last + 1) : raw.trim();
  })();
  return jsonrepair(candidate);
}

// ─────────────────────────────────────────────────────────────────────────────
// Row → camelCase mapper
// ─────────────────────────────────────────────────────────────────────────────

function mapRow(r: any) {
  return {
    id:               r.id,
    userId:           r.user_identifier,
    jobTitle:         r.job_title,
    company:          r.company,
    location:         r.location,
    workType:         r.work_type,
    salaryMin:        r.salary_min,
    salaryMax:        r.salary_max,
    salaryCurrency:   r.salary_currency,
    jobUrl:           r.job_url,
    jobDescription:   r.job_description,
    status:           r.status,
    appliedAt:        r.applied_at,
    deadline:         r.deadline,
    resumeVersionId:  r.resume_version_id,
    coverLetterSent:  r.cover_letter_sent,
    notes:            r.notes,
    nextStep:         r.next_step,
    followUpDate:     r.follow_up_date,
    source:           r.source,
    submissionChannel: r.submission_channel,
    submissionProvider: r.submission_provider,
    externalSubmissionId: r.external_submission_id,
    submissionMetadata: r.submission_metadata,
    tags:             r.tags || [],
    createdAt:        r.created_at,
    updatedAt:        r.updated_at,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/applications/:userId
// ─────────────────────────────────────────────────────────────────────────────

router.get("/:userId", async (req: Request, res: Response) => {
  try {
    const userId = normaliseUserId(req.params.userId);
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const rows = await db.manyOrNone(
      `SELECT * FROM job_applications
       WHERE user_identifier = $1
       ORDER BY updated_at DESC`,
      [userId]
    );

    const applications = (rows || []).map(mapRow);

    // Build summary stats
    const total     = applications.length;
    const byStatus  = applications.reduce<Record<string, number>>((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {});
    const applied       = byStatus.applied     || 0;
    const interviewing  = byStatus.interviewing || 0;
    const offered       = byStatus.offered      || 0;
    const rejected      = byStatus.rejected     || 0;
    const responseRate  = applied > 0 ? Math.round(((interviewing + offered) / applied) * 100) : 0;

    res.json({
      success: true,
      applications,
      stats: { total, byStatus, applied, interviewing, offered, rejected, responseRate },
    });
  } catch (err: any) {
    console.error("[applications/list]", err);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/applications/:userId  – create
// ─────────────────────────────────────────────────────────────────────────────

router.post("/:userId", async (req: Request, res: Response) => {
  try {
    const userId = normaliseUserId(req.params.userId);
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const {
      jobTitle, company, location, workType, salaryMin, salaryMax, salaryCurrency,
      jobUrl, jobDescription, status, appliedAt, deadline, resumeVersionId,
      coverLetterSent, notes, nextStep, followUpDate, source, tags,
    } = req.body;

    if (!jobTitle || !company) {
      return res.status(400).json({ error: "jobTitle and company are required" });
    }

    const row = await db.one(
      `INSERT INTO job_applications
         (user_identifier, job_title, company, location, work_type,
          salary_min, salary_max, salary_currency, job_url, job_description,
          status, applied_at, deadline, resume_version_id, cover_letter_sent,
          notes, next_step, follow_up_date, source, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       RETURNING *`,
      [
        userId, jobTitle, company, location || null, workType || null,
        salaryMin || null, salaryMax || null, salaryCurrency || "USD",
        jobUrl || null, jobDescription || null,
        status || "saved",
        appliedAt || (status === "applied" ? new Date() : null),
        deadline || null, resumeVersionId || null, coverLetterSent || false,
        notes || null, nextStep || null, followUpDate || null,
        source || "manual", tags || [],
      ]
    );

    // Insert initial event
    await db.none(
      `INSERT INTO application_events (application_id, event_type, description)
       VALUES ($1, $2, $3)`,
      [row.id, "created", `Application ${status || "saved"} for ${jobTitle} at ${company}`]
    );

    res.status(201).json({ success: true, application: mapRow(row) });
  } catch (err: any) {
    console.error("[applications/create]", err);
    res.status(500).json({ error: "Failed to create application" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/applications/:userId/:id  – update
// ─────────────────────────────────────────────────────────────────────────────

router.put("/:userId/:id", async (req: Request, res: Response) => {
  try {
    const userId = normaliseUserId(req.params.userId);
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const { id } = req.params;
    const existing = await db.oneOrNone(
      "SELECT id, status FROM job_applications WHERE id = $1 AND user_identifier = $2",
      [id, userId]
    );
    if (!existing) return res.status(404).json({ error: "Application not found" });

    const {
      jobTitle, company, location, workType, salaryMin, salaryMax, salaryCurrency,
      jobUrl, jobDescription, status, appliedAt, deadline, resumeVersionId,
      coverLetterSent, notes, nextStep, followUpDate, source, tags,
    } = req.body;

    const row = await db.one(
      `UPDATE job_applications
       SET job_title=$1, company=$2, location=$3, work_type=$4,
           salary_min=$5, salary_max=$6, salary_currency=$7,
           job_url=$8, job_description=$9, status=$10,
           applied_at=$11, deadline=$12, resume_version_id=$13,
           cover_letter_sent=$14, notes=$15, next_step=$16,
           follow_up_date=$17, source=$18, tags=$19, updated_at=NOW()
       WHERE id=$20 AND user_identifier=$21
       RETURNING *`,
      [
        jobTitle, company, location || null, workType || null,
        salaryMin || null, salaryMax || null, salaryCurrency || "USD",
        jobUrl || null, jobDescription || null, status,
        appliedAt || null, deadline || null, resumeVersionId || null,
        coverLetterSent || false, notes || null, nextStep || null,
        followUpDate || null, source || "manual", tags || [],
        id, userId,
      ]
    );

    // Log status change event
    if (status && status !== existing.status) {
      await db.none(
        `INSERT INTO application_events (application_id, event_type, description)
         VALUES ($1, $2, $3)`,
        [id, "status_change", `Status changed from ${existing.status} → ${status}`]
      );
    }

    res.json({ success: true, application: mapRow(row) });
  } catch (err: any) {
    console.error("[applications/update]", err);
    res.status(500).json({ error: "Failed to update application" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/applications/:userId/:id
// ─────────────────────────────────────────────────────────────────────────────

router.delete("/:userId/:id", async (req: Request, res: Response) => {
  try {
    const userId = normaliseUserId(req.params.userId);
    if (!userId) return res.status(400).json({ error: "userId is required" });

    await db.none(
      "DELETE FROM job_applications WHERE id = $1 AND user_identifier = $2",
      [req.params.id, userId]
    );
    res.json({ success: true });
  } catch (err: any) {
    console.error("[applications/delete]", err);
    res.status(500).json({ error: "Failed to delete application" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/applications/:userId/:id/events  – timeline
// ─────────────────────────────────────────────────────────────────────────────

router.get("/:userId/:id/events", async (req: Request, res: Response) => {
  try {
    const userId = normaliseUserId(req.params.userId);
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const app = await db.oneOrNone(
      "SELECT id FROM job_applications WHERE id = $1 AND user_identifier = $2",
      [req.params.id, userId]
    );
    if (!app) return res.status(404).json({ error: "Application not found" });

    const events = await db.manyOrNone(
      "SELECT * FROM application_events WHERE application_id = $1 ORDER BY occurred_at DESC",
      [req.params.id]
    );
    res.json({ success: true, events: events || [] });
  } catch (err: any) {
    console.error("[applications/events]", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/applications/:userId/:id/note  – add manual event / note
// ─────────────────────────────────────────────────────────────────────────────

router.post("/:userId/:id/note", async (req: Request, res: Response) => {
  try {
    const userId = normaliseUserId(req.params.userId);
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const { description } = req.body;
    if (!description?.trim()) return res.status(400).json({ error: "description is required" });

    const app = await db.oneOrNone(
      "SELECT id FROM job_applications WHERE id = $1 AND user_identifier = $2",
      [req.params.id, userId]
    );
    if (!app) return res.status(404).json({ error: "Application not found" });

    const event = await db.one(
      `INSERT INTO application_events (application_id, event_type, description)
       VALUES ($1, 'note', $2) RETURNING *`,
      [req.params.id, description]
    );
    res.status(201).json({ success: true, event });
  } catch (err: any) {
    console.error("[applications/note]", err);
    res.status(500).json({ error: "Failed to add note" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/applications/:userId/:id/ai-coach  – AI next-step suggestion
// ─────────────────────────────────────────────────────────────────────────────

router.post("/:userId/:id/ai-coach", async (req: Request, res: Response) => {
  try {
    const userId = normaliseUserId(req.params.userId);
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const app = await db.oneOrNone(
      "SELECT * FROM job_applications WHERE id = $1 AND user_identifier = $2",
      [req.params.id, userId]
    );
    if (!app) return res.status(404).json({ error: "Application not found" });

    const daysSinceApplied = app.applied_at
      ? Math.floor((Date.now() - new Date(app.applied_at).getTime()) / 86_400_000)
      : null;

    const prompt = `You are a career coach helping a job seeker navigate their application. Give a concise, specific, actionable recommendation.

Application details:
- Role: ${app.job_title} at ${app.company}
- Status: ${app.status}
- Applied: ${daysSinceApplied !== null ? `${daysSinceApplied} days ago` : "not yet applied"}
- Cover letter sent: ${app.cover_letter_sent ? "yes" : "no"}
- Notes: ${app.notes || "none"}
- Current next step set: ${app.next_step || "none"}

Return a JSON object with:
{
  "nextStep": "One specific action to take today (max 2 sentences)",
  "reasoning": "Brief explanation why (1 sentence)",
  "urgency": "low|medium|high",
  "followUpInDays": <integer>
}

Only return the JSON object.`;

    const result = await generateDeepSeekResponse(prompt);
    const json = extractJSON(result.text);

    try {
      const parsed = JSON.parse(json);
      // Persist the next step
      await db.none(
        "UPDATE job_applications SET next_step=$1, follow_up_date=$2, updated_at=NOW() WHERE id=$3",
        [
          parsed.nextStep,
          parsed.followUpInDays
            ? new Date(Date.now() + parsed.followUpInDays * 86_400_000).toISOString().split("T")[0]
            : null,
          app.id,
        ]
      );
      res.json({ success: true, coaching: parsed });
    } catch {
      res.json({ success: true, coaching: { nextStep: result.text?.trim() || "Follow up with the recruiter.", urgency: "medium" } });
    }
  } catch (err: any) {
    console.error("[applications/ai-coach]", err);
    res.status(500).json({ error: "AI coaching failed" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/applications/:userId/auto-submit
// Submit through provider API or interface automation gateway.
// ─────────────────────────────────────────────────────────────────────────────

router.post("/:userId/auto-submit", async (req: Request, res: Response) => {
  try {
    const userId = normaliseUserId(req.params.userId);
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const {
      job,
      applicant,
      coverLetter,
      tags,
      source,
      notes,
    } = req.body as {
      job?: {
        title?: string;
        company?: string;
        location?: string;
        workType?: string;
        salaryMin?: number;
        salaryMax?: number;
        salaryCurrency?: string;
        url?: string;
        description?: string;
        externalJobId?: string;
        source?: string;
      };
      applicant?: {
        name?: string;
        email?: string;
        phone?: string;
        location?: string;
      };
      coverLetter?: string;
      tags?: string[];
      source?: string;
      notes?: string;
    };

    if (!job?.title?.trim() || !job?.company?.trim()) {
      return res.status(400).json({ error: "job.title and job.company are required" });
    }

    const existing = await db.oneOrNone(
      `SELECT id
       FROM job_applications
       WHERE user_identifier = $1
         AND (
           ($2::text IS NOT NULL AND job_url = $2)
           OR (job_title = $3 AND company = $4 AND COALESCE(location, '') = COALESCE($5, ''))
         )
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, job.url || null, job.title, job.company, job.location || null]
    );

    if (existing) {
      return res.status(409).json({
        error: "Application already exists for this job",
        existingApplicationId: existing.id,
      });
    }

    const resumeRecord = await db.oneOrNone(
      `SELECT rv.id AS current_version_id,
              rv.content_json
       FROM resumes r
       LEFT JOIN resume_versions rv ON rv.id = r.current_version_id
       WHERE r.user_identifier = $1
       LIMIT 1`,
      [userId]
    );

    const submission = await submitJobBoardApplication({
      userId,
      job: {
        title: job.title,
        company: job.company,
        source: job.source || source || null,
        sourceUrl: job.url || null,
        externalJobId: job.externalJobId || null,
        location: job.location || null,
      },
      applicant: {
        name: applicant?.name,
        email: applicant?.email,
        phone: applicant?.phone,
        location: applicant?.location,
      },
      documents: {
        resumeJson: resumeRecord?.content_json || null,
        coverLetter,
      },
      metadata: {
        workflow: "job-board-quick-apply",
      },
    });

    const row = await db.one(
      `INSERT INTO job_applications
         (user_identifier, job_title, company, location, work_type,
          salary_min, salary_max, salary_currency, job_url, job_description,
          status, applied_at, resume_version_id, cover_letter_sent,
          notes, source, tags,
          submission_channel, submission_provider, external_submission_id, submission_metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       RETURNING *`,
      [
        userId,
        job.title,
        job.company,
        job.location || null,
        job.workType || null,
        job.salaryMin || null,
        job.salaryMax || null,
        job.salaryCurrency || "USD",
        job.url || null,
        job.description || null,
        submission.submitted ? "applied" : "saved",
        submission.submitted ? new Date() : null,
        resumeRecord?.current_version_id || null,
        Boolean(coverLetter),
        notes || submission.message,
        source || "job-board",
        Array.from(new Set([...(tags || []), submission.submitted ? "auto-submitted" : "submission-pending"])),
        submission.channel,
        submission.provider,
        submission.externalSubmissionId || null,
        JSON.stringify({ submission }),
      ]
    );

    await db.none(
      `INSERT INTO application_events (application_id, event_type, description)
       VALUES ($1, $2, $3)`,
      [
        row.id,
        submission.submitted ? "created" : "note",
        submission.submitted
          ? `Application submitted via ${submission.channel} (${submission.provider}).`
          : `Auto-submit not completed: ${submission.message}`,
      ]
    );

    res.status(201).json({
      success: true,
      application: mapRow(row),
      submission,
    });
  } catch (err: any) {
    console.error("[applications/auto-submit]", err);
    res.status(500).json({ error: "Failed to auto-submit application" });
  }
});

export default router;
