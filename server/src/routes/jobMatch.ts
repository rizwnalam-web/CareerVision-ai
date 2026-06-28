import { Router, Request, Response } from "express";
import { db } from "../db/database.js";
import {
  analyseJobMatch,
  predictSalary,
  assessCultureFit,
  buildLearningPath,
  rankJobsBySemanticFit,
  type ResumeContent,
  type JobListingRow,
  type JobMatchAnalysis,
  type SemanticPreferences,
} from "../services/jobMatchService.js";
import {
  tailorResumeToJD,
  generateCoverLetterFromResume,
  type ResumeContent as TailorResumeContent,
} from "../services/resumeService.js";
import { submitJobBoardApplication } from "../services/jobBoardSubmissionService.js";
import { aggregateJobsFromProviders, type AggregationProvider } from "../services/jobAggregationService.js";
import { getJobAggregationSchedulerMetrics, runJobAggregationNow } from "../services/jobAggregationScheduler.js";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function normaliseUser(raw: unknown): string | null {
  if (!raw || typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t || t === "undefined" || t === "null") return null;
  return t;
}

function mapJobListing(row: JobListingRow) {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    location: row.location,
    workType: row.work_type,
    description: row.description,
    requirements: row.requirements,
    skillsRequired: row.skills_required,
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
    salaryCurrency: row.salary_currency,
    companyCulture: row.company_culture,
    industry: row.industry,
    experienceLevel: row.experience_level,
    sourceUrl: row.source_url,
    source: row.source || null,
    postedAt: row.posted_at,
  };
}

function parseResumeContent(raw: unknown): TailorResumeContent | null {
  const normalize = (value: unknown): TailorResumeContent | null => {
    if (!value || typeof value !== "object") return null;
    const content = ({ ...(value as Record<string, unknown>) } as unknown) as TailorResumeContent;
    if (!Array.isArray(content.projects)) {
      content.projects = [];
    }
    return content;
  };

  if (!raw) return null;
  if (typeof raw === "object") return normalize(raw);
  if (typeof raw === "string") {
    try {
      return normalize(JSON.parse(raw));
    } catch {
      return null;
    }
  }
  return null;
}

function buildSemanticXaiExplanation(args: {
  title: string;
  company: string;
  score: number;
  breakdown: { semantic: number; title: number; skills: number; salary: number; preference: number };
  reasons: string[];
  missingSkills: string[];
}) {
  const { title, company, score, breakdown, reasons, missingSkills } = args;
  const drivers: string[] = [];

  if (breakdown.skills >= 70) drivers.push("your current skills overlap strongly with this role");
  if (breakdown.title >= 60) drivers.push("your target role aligns with the job title");
  if (breakdown.preference >= 70) drivers.push("it matches your work setup and location preferences");
  if (breakdown.salary >= 70) drivers.push("the salary range is close to your target");
  if (breakdown.semantic >= 70) drivers.push("your resume context is highly relevant to the responsibilities");

  const primaryReason = drivers[0] || reasons[0]?.toLowerCase() || "your profile aligns with key parts of this job";
  const gaps = missingSkills.slice(0, 2);

  if (score >= 80) {
    return gaps.length
      ? `${title} at ${company} is a strong recommendation because ${primaryReason}. Main upskilling areas: ${gaps.join(", ")}.`
      : `${title} at ${company} is a strong recommendation because ${primaryReason}.`;
  }

  return gaps.length
    ? `${title} at ${company} is recommended because ${primaryReason}, with moderate gaps in ${gaps.join(", ")}.`
    : `${title} at ${company} is recommended because ${primaryReason}.`;
}

function buildCachedXaiExplanation(row: any) {
  const drivers: string[] = [];
  if (Number(row.skillMatchScore) >= 70) drivers.push("your skills fit the core requirements");
  if (Number(row.cultureFitScore) >= 70) drivers.push("your background aligns with the team culture");
  if (Number(row.salaryFitScore) >= 70) drivers.push("the compensation is aligned with your expectations");

  const reasonFromModel = Array.isArray(row.matchReasons) && row.matchReasons.length
    ? String(row.matchReasons[0]).toLowerCase()
    : "there is overall alignment between your resume and this role";

  const primaryReason = drivers[0] || reasonFromModel;
  const score = Number(row.matchScore) || 0;

  if (score >= 80) {
    return `${row.title} at ${row.company} is a high-confidence match because ${primaryReason}.`;
  }

  if (score >= 60) {
    return `${row.title} at ${row.company} is a good match because ${primaryReason}, with a few areas to improve.`;
  }

  return `${row.title} at ${row.company} is a partial match because ${primaryReason}.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/job-match/jobs
// List active job listings with optional work_type filter
// ─────────────────────────────────────────────────────────────────────────────

router.get("/jobs", async (req: Request, res: Response) => {
  try {
    const { workType, industry, limit = "50", offset = "0" } = req.query as Record<string, string>;
    const conditions: string[] = ["is_active = TRUE"];
    const params: unknown[] = [];

    if (workType && workType !== "any") {
      params.push(workType);
      conditions.push(`work_type = $${params.length}`);
    }
    if (industry) {
      params.push(`%${industry}%`);
      conditions.push(`industry ILIKE $${params.length}`);
    }

    params.push(parseInt(limit, 10));
    params.push(parseInt(offset, 10));

    const rows = await db.manyOrNone(
      `SELECT * FROM job_listings WHERE ${conditions.join(" AND ")}
       ORDER BY posted_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ success: true, jobs: rows || [] });
  } catch (err) {
    console.error("[job-match/jobs GET]", err);
    res.status(500).json({ error: "Failed to fetch job listings" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/job-match/jobs
// Add a new job listing
// ─────────────────────────────────────────────────────────────────────────────

router.post("/jobs", async (req: Request, res: Response) => {
  try {
    const {
      title, company, location, workType = "onsite", description, requirements,
      skillsRequired = [], salaryMin, salaryMax, salaryCurrency = "USD",
      companyCulture, industry, experienceLevel, sourceUrl, source = "manual", externalJobId = null,
    } = req.body;

    if (!title || !company) {
      return res.status(400).json({ error: "title and company are required" });
    }

    const job = await db.one(
      `INSERT INTO job_listings
         (title, company, location, work_type, description, requirements,
          skills_required, salary_min, salary_max, salary_currency,
         company_culture, industry, experience_level, source_url, source, external_job_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [title, company, location, workType, description, requirements,
       skillsRequired, salaryMin || null, salaryMax || null, salaryCurrency,
       companyCulture || null, industry || null, experienceLevel || null,
       sourceUrl || null, source, externalJobId]
    );

    res.status(201).json({ success: true, job });
  } catch (err) {
    console.error("[job-match/jobs POST]", err);
    res.status(500).json({ error: "Failed to create job listing" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/job-match/jobs/aggregate
// Sync jobs from configured providers (LinkedIn/Indeed/etc).
// Requires provider feed URLs configured via env vars.
// ─────────────────────────────────────────────────────────────────────────────

router.post("/jobs/aggregate", async (req: Request, res: Response) => {
  try {
    const {
      providers,
      query,
      location,
      limitPerProvider,
    } = req.body as {
      providers?: AggregationProvider[];
      query?: string;
      location?: string;
      limitPerProvider?: number;
    };

    const summary = await aggregateJobsFromProviders({
      providers,
      query,
      location,
      limitPerProvider,
    });

    res.json({ success: true, summary });
  } catch (err) {
    console.error("[job-match/jobs/aggregate POST]", err);
    res.status(500).json({ error: "Failed to aggregate jobs" });
  }
});

// GET /api/job-match/jobs/aggregate/health
router.get("/jobs/aggregate/health", async (_req: Request, res: Response) => {
  try {
    res.json({ success: true, metrics: getJobAggregationSchedulerMetrics() });
  } catch (err) {
    console.error("[job-match/jobs/aggregate/health GET]", err);
    res.status(500).json({ error: "Failed to fetch aggregation health" });
  }
});

// POST /api/job-match/jobs/aggregate/run-now
router.post("/jobs/aggregate/run-now", async (req: Request, res: Response) => {
  try {
    const {
      providers,
      query,
      location,
      limitPerProvider,
    } = req.body as {
      providers?: AggregationProvider[];
      query?: string;
      location?: string;
      limitPerProvider?: number;
    };

    const summary = await runJobAggregationNow({
      providers,
      query,
      location,
      limitPerProvider,
    });

    res.json({ success: true, summary });
  } catch (err) {
    console.error("[job-match/jobs/aggregate/run-now POST]", err);
    res.status(500).json({ error: "Failed to run aggregation" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/job-match/semantic-match
// Fast, deterministic semantic ranking for large job sets.
// ─────────────────────────────────────────────────────────────────────────────

router.post("/semantic-match", async (req: Request, res: Response) => {
  try {
    const {
      userId,
      resumeContent,
      workTypeFilter,
      industry,
      limit = 30,
      minSalary,
      maxSalary,
    } = req.body as {
      userId: string;
      resumeContent: ResumeContent;
      workTypeFilter?: string;
      industry?: string;
      limit?: number;
      minSalary?: number;
      maxSalary?: number;
    };

    const userIdentifier = normaliseUser(userId);
    if (!userIdentifier) return res.status(400).json({ error: "userId is required" });
    if (!resumeContent) return res.status(400).json({ error: "resumeContent is required" });

    const conditions: string[] = ["is_active = TRUE"];
    const params: unknown[] = [];

    if (workTypeFilter && workTypeFilter !== "any") {
      params.push(workTypeFilter);
      conditions.push(`work_type = $${params.length}`);
    }
    if (industry) {
      params.push(`%${industry}%`);
      conditions.push(`industry ILIKE $${params.length}`);
    }

    const jobs: JobListingRow[] = await db.manyOrNone(
      `SELECT * FROM job_listings
       WHERE ${conditions.join(" AND ")}
       ORDER BY posted_at DESC
       LIMIT 300`,
      params
    );

    const prefsRow = await db.oneOrNone(
      `SELECT
         work_type_preference AS "workTypePreference",
         min_salary AS "minSalary",
         max_salary AS "maxSalary",
         preferred_locations AS "preferredLocations",
         preferred_industries AS "preferredIndustries",
         target_role AS "targetRole"
       FROM user_work_preferences
       WHERE user_identifier = $1`,
      [userIdentifier]
    );

    const prefs: SemanticPreferences = {
      ...(prefsRow || {}),
      minSalary: minSalary ?? prefsRow?.minSalary ?? null,
      maxSalary: maxSalary ?? prefsRow?.maxSalary ?? null,
    };

    const ranked = rankJobsBySemanticFit(resumeContent, jobs, prefs)
      .slice(0, Math.min(Math.max(limit, 1), 100))
      .map(({ job, score }) => {
        const breakdown = {
          semantic: score.semantic,
          title: score.title,
          skills: score.skills,
          salary: score.salary,
          preference: score.preference,
        };

        return {
        job: mapJobListing(job),
        score: score.overall,
        breakdown,
        reasons: score.reasons,
        missingSkills: score.missingSkills,
        xaiExplanation: buildSemanticXaiExplanation({
          title: job.title,
          company: job.company,
          score: score.overall,
          breakdown,
          reasons: score.reasons,
          missingSkills: score.missingSkills,
        }),
      };
      });

    res.json({ success: true, results: ranked });
  } catch (err) {
    console.error("[job-match/semantic-match POST]", err);
    res.status(500).json({ error: "Failed to perform semantic matching" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/job-match/applications/ai-submit
// AI-tailor resume + generate cover letter + create application record.
// Body: { userId, jobId }
// ─────────────────────────────────────────────────────────────────────────────

router.post("/applications/ai-submit", async (req: Request, res: Response) => {
  try {
    const { userId, jobId } = req.body as { userId: string; jobId: string };

    const userIdentifier = normaliseUser(userId);
    if (!userIdentifier) return res.status(400).json({ error: "userId is required" });
    if (!jobId?.trim()) return res.status(400).json({ error: "jobId is required" });

    const job: JobListingRow | null = await db.oneOrNone(
      "SELECT * FROM job_listings WHERE id = $1 AND is_active = TRUE",
      [jobId]
    );
    if (!job) return res.status(404).json({ error: "Job not found" });

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
      [userIdentifier, job.source_url || null, job.title, job.company, job.location || null]
    );

    if (existing) {
      return res.status(409).json({
        error: "Application already exists for this job",
        existingApplicationId: existing.id,
      });
    }

    const resumeRecord = await db.oneOrNone(
      `SELECT r.id AS resume_id,
              rv.id AS current_version_id,
              rv.content_json
       FROM resumes r
       LEFT JOIN resume_versions rv ON rv.id = r.current_version_id
       WHERE r.user_identifier = $1
       LIMIT 1`,
      [userIdentifier]
    );

    if (!resumeRecord?.content_json) {
      return res.status(400).json({ error: "No resume found. Please upload or create a resume first." });
    }

    const resumeContent = parseResumeContent(resumeRecord.content_json);
    if (!resumeContent) {
      return res.status(422).json({ error: "Current resume content is invalid. Please re-save your resume." });
    }

    const jobDescription = [
      `Role: ${job.title}`,
      `Company: ${job.company}`,
      job.description || "",
      job.requirements || "",
    ].filter(Boolean).join("\n\n");

    const tailoredResume = await tailorResumeToJD(resumeContent, jobDescription);
    const coverLetter = await generateCoverLetterFromResume(tailoredResume, jobDescription, job.title);

    const submission = await submitJobBoardApplication({
      userId: userIdentifier,
      job: {
        title: job.title,
        company: job.company,
        source: job.source || null,
        sourceUrl: job.source_url || null,
        externalJobId: job.external_job_id || null,
        location: job.location || null,
      },
      applicant: {
        name: tailoredResume.personalInfo?.name,
        email: tailoredResume.personalInfo?.email,
        phone: tailoredResume.personalInfo?.phone,
        location: tailoredResume.personalInfo?.location,
      },
      documents: {
        resumeJson: tailoredResume,
        coverLetter,
      },
      metadata: {
        workflow: "ai-tailor-and-submit",
        jobId: job.id,
      },
    });

    const versionCount = await db.one(
      "SELECT COALESCE(MAX(version_number), 0) AS max FROM resume_versions WHERE resume_id = $1",
      [resumeRecord.resume_id]
    );
    const nextVersion = Number(versionCount.max) + 1;

    const tailoredVersion = await db.one(
      `INSERT INTO resume_versions
         (resume_id, version_number, content_json, change_summary)
       VALUES ($1, $2, $3, $4)
       RETURNING id, version_number`,
      [
        resumeRecord.resume_id,
        nextVersion,
        JSON.stringify(tailoredResume),
        `AI tailored for ${job.title} at ${job.company}`,
      ]
    );

    const application = await db.one(
      `INSERT INTO job_applications
         (user_identifier, job_title, company, location, work_type,
          salary_min, salary_max, salary_currency,
          job_url, job_description, status, applied_at,
         resume_version_id, cover_letter_sent, notes, source, tags,
         submission_channel, submission_provider, external_submission_id, submission_metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,TRUE,$14,'ai-match',$15,$16,$17,$18,$19)
       RETURNING id, status, applied_at, resume_version_id`,
      [
        userIdentifier,
        job.title,
        job.company,
        job.location || null,
        job.work_type || null,
        job.salary_min || null,
        job.salary_max || null,
        job.salary_currency || "USD",
        job.source_url || null,
        job.description || null,
        submission.submitted ? "applied" : "saved",
        submission.submitted ? new Date() : null,
        tailoredVersion.id,
        `AI Tailor & Apply workflow: ${submission.message}`,
        ["ai-tailored", submission.submitted ? "auto-submitted" : "submission-pending"],
        submission.channel,
        submission.provider,
        submission.externalSubmissionId || null,
        JSON.stringify({
          submission,
        }),
      ]
    );

    await db.none(
      `INSERT INTO application_events (application_id, event_type, description)
       VALUES ($1, 'created', $2)`,
      [application.id, submission.submitted
        ? `Application submitted for ${job.title} at ${job.company} via ${submission.channel} (${submission.provider}).`
        : `Application saved for ${job.title} at ${job.company}. ${submission.message}`]
    );

    await db.none(
      `INSERT INTO application_events (application_id, event_type, description)
       VALUES ($1, 'note', $2)`,
      [application.id, `AI tailored resume version v${tailoredVersion.version_number} and generated cover letter.`]
    );

    res.status(201).json({
      success: true,
      application: {
        id: application.id,
        status: application.status,
        appliedAt: application.applied_at,
        resumeVersionId: application.resume_version_id,
      },
      submission,
      tailoredResume,
      coverLetter,
    });
  } catch (err) {
    console.error("[job-match/applications/ai-submit POST]", err);
    res.status(500).json({ error: "Failed to tailor and submit application" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/job-match/:userId/matches
// Return cached match results for a user (sorted by match_score)
// ─────────────────────────────────────────────────────────────────────────────

router.get("/:userId/matches", async (req: Request, res: Response) => {
  try {
    const userIdentifier = normaliseUser(req.params.userId);
    if (!userIdentifier) return res.status(400).json({ error: "userId is required" });

    const rows = await db.manyOrNone(
      `SELECT
         m.id,
         m.match_score        AS "matchScore",
         m.skill_match_score  AS "skillMatchScore",
         m.culture_fit_score  AS "cultureFitScore",
         m.salary_fit_score   AS "salaryFitScore",
         m.skill_gaps         AS "skillGaps",
         m.learning_paths     AS "learningPaths",
         m.salary_prediction  AS "salaryPrediction",
         m.culture_analysis   AS "cultureAnalysis",
         m.match_reasons      AS "matchReasons",
         m.computed_at        AS "computedAt",
         j.id                 AS "jobId",
         j.title, j.company, j.location,
         j.work_type          AS "workType",
         j.skills_required    AS "skillsRequired",
         j.salary_min         AS "salaryMin",
         j.salary_max         AS "salaryMax",
         j.salary_currency    AS "salaryCurrency",
         j.industry,
         j.experience_level   AS "experienceLevel",
         j.source_url         AS "sourceUrl",
         j.posted_at          AS "postedAt"
       FROM user_job_matches m
       JOIN job_listings j ON j.id = m.job_id
       WHERE m.user_identifier = $1
       ORDER BY m.match_score DESC`,
      [userIdentifier]
    );

    const matches = (rows || []).map(row => ({
      ...row,
      xaiExplanation: buildCachedXaiExplanation(row),
    }));

    res.json({ success: true, matches });
  } catch (err) {
    console.error("[job-match/matches GET]", err);
    res.status(500).json({ error: "Failed to fetch matches" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/job-match/analyse
// Run full AI analysis for user's resume against a list of job IDs
// Body: { userId, resumeContent, jobIds?, workTypeFilter?, minSalary?, maxSalary? }
// ─────────────────────────────────────────────────────────────────────────────

router.post("/analyse", async (req: Request, res: Response) => {
  try {
    const {
      userId, resumeContent, jobIds, workTypeFilter,
      minSalary, maxSalary, candidatePoolLimit = 150, llmTopN = 20,
    } = req.body as {
      userId: string;
      resumeContent: ResumeContent;
      jobIds?: string[];
      workTypeFilter?: string;
      minSalary?: number;
      maxSalary?: number;
      candidatePoolLimit?: number;
      llmTopN?: number;
    };

    const userIdentifier = normaliseUser(userId);
    if (!userIdentifier) return res.status(400).json({ error: "userId is required" });
    if (!resumeContent) return res.status(400).json({ error: "resumeContent is required" });

    // Build job query
    const conditions: string[] = ["is_active = TRUE"];
    const params: unknown[] = [];

    if (jobIds?.length) {
      params.push(jobIds);
      conditions.push(`id = ANY($${params.length})`);
    }
    if (workTypeFilter && workTypeFilter !== "any") {
      params.push(workTypeFilter);
      conditions.push(`work_type = $${params.length}`);
    }

    const safeCandidateLimit = Math.min(Math.max(candidatePoolLimit, 20), 500);
    params.push(safeCandidateLimit);

    const jobs: JobListingRow[] = await db.manyOrNone(
      `SELECT * FROM job_listings
       WHERE ${conditions.join(" AND ")}
       ORDER BY posted_at DESC
       LIMIT $${params.length}`,
      params
    );

    if (!jobs.length) {
      return res.json({ success: true, results: [] });
    }

    const prefsRow = await db.oneOrNone(
      `SELECT
         work_type_preference AS "workTypePreference",
         min_salary AS "minSalary",
         max_salary AS "maxSalary",
         preferred_locations AS "preferredLocations",
         preferred_industries AS "preferredIndustries",
         target_role AS "targetRole"
       FROM user_work_preferences
       WHERE user_identifier = $1`,
      [userIdentifier]
    );

    const semanticPrefs: SemanticPreferences = {
      ...(prefsRow || {}),
      minSalary: minSalary ?? prefsRow?.minSalary ?? null,
      maxSalary: maxSalary ?? prefsRow?.maxSalary ?? null,
    };

    const rankedJobs = rankJobsBySemanticFit(resumeContent, jobs, semanticPrefs);
    const analysisCandidates = rankedJobs.slice(0, Math.min(Math.max(llmTopN, 5), 40));

    // Analyse top semantic candidates sequentially to avoid hammering the LLM
    const results: Array<JobMatchAnalysis & { jobId: string; semanticScore: number }> = [];

    for (const candidate of analysisCandidates) {
      const job = candidate.job;
      try {
        const analysis = await analyseJobMatch(resumeContent, job, minSalary, maxSalary);

        // Upsert into cache
        await db.none(
          `INSERT INTO user_job_matches
             (user_identifier, job_id, match_score, skill_match_score, culture_fit_score,
              salary_fit_score, skill_gaps, learning_paths, salary_prediction, culture_analysis,
              match_reasons, computed_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, NOW())
           ON CONFLICT (user_identifier, job_id) DO UPDATE SET
             match_score       = EXCLUDED.match_score,
             skill_match_score = EXCLUDED.skill_match_score,
             culture_fit_score = EXCLUDED.culture_fit_score,
             salary_fit_score  = EXCLUDED.salary_fit_score,
             skill_gaps        = EXCLUDED.skill_gaps,
             learning_paths    = EXCLUDED.learning_paths,
             salary_prediction = EXCLUDED.salary_prediction,
             culture_analysis  = EXCLUDED.culture_analysis,
             match_reasons     = EXCLUDED.match_reasons,
             computed_at       = NOW()`,
          [
            userIdentifier, job.id,
            analysis.matchScore, analysis.skillMatchScore,
            analysis.cultureFitScore, analysis.salaryFitScore,
            analysis.skillGaps.map(g => g.skill),
            JSON.stringify(analysis.skillGaps.flatMap(g => g.learningPath)),
            JSON.stringify(analysis.salaryPrediction),
            JSON.stringify(analysis.cultureAnalysis),
            analysis.matchReasons,
          ]
        );

        results.push({ jobId: job.id, ...analysis, semanticScore: candidate.score.overall });
      } catch (jobErr) {
        console.error(`[job-match/analyse] job ${job.id} failed:`, (jobErr as Error).message);
      }
    }

    res.json({ success: true, results });
  } catch (err) {
    console.error("[job-match/analyse]", err);
    res.status(500).json({ error: "Failed to analyse job matches" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/job-match/skill-gap
// Standalone skill-gap + learning path for a single job
// Body: { resumeContent, jobId }
// ─────────────────────────────────────────────────────────────────────────────

router.post("/skill-gap", async (req: Request, res: Response) => {
  try {
    const { resumeContent, jobId } = req.body as {
      resumeContent: ResumeContent;
      jobId: string;
    };

    if (!resumeContent || !jobId) {
      return res.status(400).json({ error: "resumeContent and jobId are required" });
    }

    const job: JobListingRow | null = await db.oneOrNone(
      "SELECT * FROM job_listings WHERE id = $1",
      [jobId]
    );
    if (!job) return res.status(404).json({ error: "Job not found" });

    const currentSkills = [
      ...(resumeContent.skills?.technical || []),
      ...(resumeContent.skills?.soft || []),
      ...(resumeContent.skills?.certifications || []),
    ];

    const gapSkills = job.skills_required.filter(
      s => !currentSkills.some(cs => cs.toLowerCase().includes(s.toLowerCase()))
    );

    const learningResources = await buildLearningPath(gapSkills, job.title, currentSkills);

    res.json({
      success: true,
      gapSkills,
      currentSkills,
      requiredSkills: job.skills_required,
      learningResources,
    });
  } catch (err) {
    console.error("[job-match/skill-gap]", err);
    res.status(500).json({ error: "Failed to generate skill gap analysis" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/job-match/salary-predict
// Body: { role, location, experienceYears, skills, currency }
// ─────────────────────────────────────────────────────────────────────────────

router.post("/salary-predict", async (req: Request, res: Response) => {
  try {
    const {
      role, location, experienceYears = 0, skills = [], currency = "USD",
    } = req.body as {
      role: string; location: string;
      experienceYears?: number; skills?: string[]; currency?: string;
    };

    if (!role) return res.status(400).json({ error: "role is required" });

    const prediction = await predictSalary(role, location || "Global", experienceYears, skills, currency);
    res.json({ success: true, prediction });
  } catch (err) {
    console.error("[job-match/salary-predict]", err);
    res.status(500).json({ error: "Failed to predict salary" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/job-match/culture-fit
// Body: { resumeContent, companyName, cultureSummary }
// ─────────────────────────────────────────────────────────────────────────────

router.post("/culture-fit", async (req: Request, res: Response) => {
  try {
    const { resumeContent, companyName, cultureSummary } = req.body as {
      resumeContent: ResumeContent; companyName: string; cultureSummary: string;
    };

    if (!resumeContent || !companyName || !cultureSummary) {
      return res.status(400).json({ error: "resumeContent, companyName, and cultureSummary are required" });
    }

    const analysis = await assessCultureFit(resumeContent, companyName, cultureSummary);
    res.json({ success: true, analysis });
  } catch (err) {
    console.error("[job-match/culture-fit]", err);
    res.status(500).json({ error: "Failed to assess culture fit" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/job-match/:userId/preferences
// ─────────────────────────────────────────────────────────────────────────────

router.get("/:userId/preferences", async (req: Request, res: Response) => {
  try {
    const userIdentifier = normaliseUser(req.params.userId);
    if (!userIdentifier) return res.status(400).json({ error: "userId is required" });

    const prefs = await db.oneOrNone(
      `SELECT
         work_type_preference  AS "workTypePreference",
         min_salary            AS "minSalary",
         max_salary            AS "maxSalary",
         salary_currency       AS "salaryCurrency",
         preferred_locations   AS "preferredLocations",
         preferred_industries  AS "preferredIndustries",
         target_role           AS "targetRole",
         setup_completed_at    AS "setupCompletedAt",
         updated_at            AS "updatedAt"
       FROM user_work_preferences WHERE user_identifier = $1`,
      [userIdentifier]
    );

    res.json({ success: true, preferences: prefs || null });
  } catch (err) {
    console.error("[job-match/preferences GET]", err);
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/job-match/:userId/preferences
// ─────────────────────────────────────────────────────────────────────────────

router.put("/:userId/preferences", async (req: Request, res: Response) => {
  try {
    const userIdentifier = normaliseUser(req.params.userId);
    if (!userIdentifier) return res.status(400).json({ error: "userId is required" });

    const {
      workTypePreference = "any", minSalary, maxSalary,
      salaryCurrency = "USD", preferredLocations = [], preferredIndustries = [], targetRole,
    } = req.body;

    await db.none(
      `INSERT INTO user_work_preferences
         (user_identifier, work_type_preference, min_salary, max_salary, salary_currency,
          preferred_locations, preferred_industries, target_role, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW())
       ON CONFLICT (user_identifier) DO UPDATE SET
         work_type_preference = EXCLUDED.work_type_preference,
         min_salary           = EXCLUDED.min_salary,
         max_salary           = EXCLUDED.max_salary,
         salary_currency      = EXCLUDED.salary_currency,
         preferred_locations  = EXCLUDED.preferred_locations,
         preferred_industries = EXCLUDED.preferred_industries,
         target_role          = EXCLUDED.target_role,
         updated_at           = NOW()`,
      [userIdentifier, workTypePreference, minSalary || null, maxSalary || null,
       salaryCurrency, preferredLocations, preferredIndustries, targetRole || null]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("[job-match/preferences PUT]", err);
    res.status(500).json({ error: "Failed to save preferences" });
  }
});

export default router;
