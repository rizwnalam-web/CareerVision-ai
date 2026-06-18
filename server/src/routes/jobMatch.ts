import { Router, Request, Response } from "express";
import { db } from "../db/database.js";
import {
  analyseJobMatch,
  predictSalary,
  assessCultureFit,
  buildLearningPath,
  type JobListingRow,
  type JobMatchAnalysis,
} from "../services/jobMatchService.js";
import type { ResumeContent } from "../types/career.js";

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
      companyCulture, industry, experienceLevel, sourceUrl, source = "manual",
    } = req.body;

    if (!title || !company) {
      return res.status(400).json({ error: "title and company are required" });
    }

    const job = await db.one(
      `INSERT INTO job_listings
         (title, company, location, work_type, description, requirements,
          skills_required, salary_min, salary_max, salary_currency,
          company_culture, industry, experience_level, source_url, source)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [title, company, location, workType, description, requirements,
       skillsRequired, salaryMin || null, salaryMax || null, salaryCurrency,
       companyCulture || null, industry || null, experienceLevel || null,
       sourceUrl || null, source]
    );

    res.status(201).json({ success: true, job });
  } catch (err) {
    console.error("[job-match/jobs POST]", err);
    res.status(500).json({ error: "Failed to create job listing" });
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

    res.json({ success: true, matches: rows || [] });
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
      minSalary, maxSalary,
    } = req.body as {
      userId: string;
      resumeContent: ResumeContent;
      jobIds?: string[];
      workTypeFilter?: string;
      minSalary?: number;
      maxSalary?: number;
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

    const jobs: JobListingRow[] = await db.manyOrNone(
      `SELECT * FROM job_listings WHERE ${conditions.join(" AND ")} ORDER BY posted_at DESC LIMIT 20`,
      params
    );

    if (!jobs.length) {
      return res.json({ success: true, results: [] });
    }

    // Analyse each job sequentially to avoid hammering the LLM
    const results: (JobMatchAnalysis & { jobId: string })[] = [];

    for (const job of jobs) {
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

        results.push({ jobId: job.id, ...analysis });
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
